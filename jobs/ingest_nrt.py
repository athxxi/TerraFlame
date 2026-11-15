import os, io, httpx, psycopg
import pandas as pd
from fire_pipeline import clean, add_cells, daily_counts, harmonize, load_reference

REF = load_reference('handover')
BASE = 'https://firms.modaps.eosdis.nasa.gov/api/area/csv'
SOURCES = {'VIIRS_SNPP_NRT': 'VNPP', 'VIIRS_NOAA20_NRT': 'VN20',
           'VIIRS_NOAA21_NRT': 'VN21', 'MODIS_NRT': 'MODIS'}
INSERT_POINT = ('INSERT INTO nrt_points (sat, t, lat, lon, frp, conf, daynight, h3, state) '
                'VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) ON CONFLICT DO NOTHING')
INSERT_DAY = ('INSERT INTO daily_h (h3, d, n_h, n_lo, n_hi, frp_h, src) '
              'VALUES (%s, %s, %s, %s, %s, %s, %s)')

def fetch(source, days):
    url = (BASE + '/' + os.environ['FIRMS_MAP_KEY'] + '/' + source + '/'
           + os.environ['BBOX'] + '/' + str(days))
    r = httpx.get(url, timeout=60)
    r.raise_for_status()
    text = r.text.strip()
    if not text or '\n' not in text:
        return None                      # source has no rows (for example S-NPP after 2026-11-02)
    if not text.startswith('latitude'):
        raise RuntimeError('FIRMS answered: ' + text[:200])
    return pd.read_csv(io.StringIO(text))

def rebuild_days(conn, dates):
    # Recount the stored points of these UTC days, convert them, and replace those days.
    rows = conn.execute(
        'SELECT sat, t, h3, state, frp FROM nrt_points '
        'WHERE (t AT TIME ZONE %s)::date = ANY(%s)', ('UTC', dates)).fetchall()
    pts = pd.DataFrame(rows, columns=['sat', 't', 'h3', 'state', 'frp'])
    pts['t'] = pd.to_datetime(pts['t'], utc=True)
    daily = harmonize(daily_counts(pts), REF.calibration, REF.satellites)
    conn.execute('DELETE FROM daily_h WHERE d = ANY(%s)', (dates,))
    with conn.cursor() as cur:
        cur.executemany(INSERT_DAY, [(r.h3, r.d.date(), r.n_h, r.n_lo, r.n_hi, r.frp_h, r.src)
                                     for r in daily.itertuples(index=False)])
    conn.execute('DELETE FROM state_daily WHERE d = ANY(%s)', (dates,))
    conn.execute('INSERT INTO state_daily '
                 'SELECT s.state, d.d, sum(d.n_h), sum(d.n_lo), sum(d.n_hi), sum(d.frp_h) '
                 'FROM daily_h d JOIN h3_state s USING (h3) WHERE d.d = ANY(%s) '
                 'GROUP BY s.state, d.d', (dates,))

def run_ingest():
    fetched = inserted = 0
    error = None
    dates = set()
    with psycopg.connect(os.environ['DATABASE_URL']) as conn:
        if not conn.execute('SELECT pg_try_advisory_lock(42)').fetchone()[0]:
            return
        try:
            days = int(os.environ.get('NRT_DAYS', '3'))
            for source, label in SOURCES.items():
                raw = fetch(source, days)
                if raw is None:
                    print('no rows from', source)
                    continue
                df = add_cells(clean(raw, label), REF.h3_state)
                fetched += len(df)
                dates.update(df['t'].dt.floor('D').dt.tz_localize(None).dt.date.unique())
                params = [(r.sat, r.t.to_pydatetime(), r.lat, r.lon, r.frp, r.conf,
                           r.daynight, r.h3, r.state) for r in df.itertuples(index=False)]
                with conn.cursor() as cur:
                    cur.executemany(INSERT_POINT, params)
                    inserted += max(cur.rowcount, 0)
            if dates:
                rebuild_days(conn, sorted(dates))
            conn.execute('DELETE FROM nrt_points WHERE t < now() - make_interval(days => 30)')
            conn.commit()
        except Exception as e:
            conn.rollback()
            error = str(e)
            print('ingest failed:', error)
        conn.execute('INSERT INTO ingest_log (source, fetched, inserted, error) '
                     'VALUES (%s, %s, %s, %s)', ('nrt', fetched, inserted, error))
        conn.execute('SELECT pg_advisory_unlock(42)')
    if error is None:
        try:
            from jobs.check_alerts import check_alerts      # added in Step 14
        except ImportError:
            return
        check_alerts()
