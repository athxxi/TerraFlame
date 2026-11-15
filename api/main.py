import os
import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from psycopg_pool import ConnectionPool

app = FastAPI()
app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(CORSMiddleware,
                   allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
                   allow_methods=['*'], allow_headers=['*'])
pool = ConnectionPool(os.environ['DATABASE_URL'], open=True)

@app.get('/health')
def health():
    with pool.connection() as conn:
        last = conn.execute(
            'SELECT max(started_at) FROM ingest_log WHERE error IS NULL').fetchone()[0]
        rng = conn.execute('SELECT min(d), max(d) FROM daily_h').fetchone()
    return {'ok': True, 'last_ingest': last, 'data_from': rng[0], 'data_to': rng[1]}

@app.get('/regions')
def regions():
    with pool.connection() as conn:
        rows = conn.execute('SELECT DISTINCT state FROM h3_state ORDER BY state').fetchall()
    return [r[0] for r in rows]


import hashlib, json, h3
from pydantic import BaseModel
from shapely.geometry import shape, mapping, Point
from shapely.validation import make_valid

CELL_KM2 = 253.0

class AoiIn(BaseModel):
    geojson: dict | None = None
    state: str | None = None
    lat: float | None = None
    lon: float | None = None
    radius_km: float | None = None

def get_aoi(aoi_id: str):
    with pool.connection() as conn:
        row = conn.execute('SELECT cells, state FROM aoi WHERE id = %s', (aoi_id,)).fetchone()
    if not row:
        raise HTTPException(404, 'Unknown area')
    return {'cells': row[0], 'state': row[1]}

@app.post('/aoi')
def create_aoi(body: AoiIn):
    with pool.connection() as conn:
        state = body.state
        if state:
            if state == 'India':
                cells = [r[0] for r in conn.execute('SELECT h3 FROM h3_state')]
            else:
                cells = [r[0] for r in conn.execute(
                    'SELECT h3 FROM h3_state WHERE state = %s', (state,))]
            geojson = {'state': state}
        else:
            if body.geojson:
                geom = make_valid(shape(body.geojson))
            elif body.lat is not None and body.lon is not None and body.radius_km:
                geom = Point(body.lon, body.lat).buffer(body.radius_km / 111.0)
            else:
                raise HTTPException(400, 'Send a shape, a state, or a point with a radius')
            cells = list(h3.geo_to_cells(mapping(geom), 5))
            if not cells:
                c = geom.centroid
                cells = [h3.latlng_to_cell(c.y, c.x, 5)]
            geojson = mapping(geom)
        known = conn.execute('SELECT count(*) FROM h3_state WHERE h3 = ANY(%s)',
                             (cells,)).fetchone()[0]
        if not known:
            raise HTTPException(400, 'No part of this area is inside India')
        aoi_id = hashlib.sha1(json.dumps(geojson, sort_keys=True).encode()).hexdigest()[:12]
        conn.execute(
            'INSERT INTO aoi (id, geojson, cells, state, area_km2) VALUES (%s, %s, %s, %s, %s) '
            'ON CONFLICT DO NOTHING',
            (aoi_id, json.dumps(geojson), cells, state, known * CELL_KM2))
    return {'aoi_id': aoi_id, 'cells': known, 'area_km2': known * CELL_KM2}


FREQ = {'day': 'D', 'week': 'W-MON', 'month': 'MS', 'year': 'YS'}
PERIOD = {'day': 'D', 'week': 'W-SUN', 'month': 'M', 'year': 'Y'}
MAX_DAYS = {'day': 800, 'week': 3700, 'month': 10**6, 'year': 10**6}

def load_series(aoi_id, granularity, date_from, date_to, limit=True):
    if granularity not in FREQ:
        raise HTTPException(400, 'granularity must be day, week, month or year')
    a = get_aoi(aoi_id)
    with pool.connection() as conn:
        data_from, data_to = conn.execute('SELECT min(d), max(d) FROM daily_h').fetchone()
        start = max(pd.Timestamp(date_from), pd.Timestamp(data_from))
        end = min(pd.Timestamp(date_to), pd.Timestamp(data_to))
        if limit and (end - start).days > MAX_DAYS[granularity]:
            raise HTTPException(400, 'Choose a shorter range for the %s view' % granularity)
        if a['state']:
            where = '' if a['state'] == 'India' else 'state = %s AND '
            extra = [] if a['state'] == 'India' else [a['state']]
            sql = ('SELECT date_trunc(%s, d)::date, sum(n_h), sum(n_lo), sum(n_hi), sum(frp_h) '
                   'FROM state_daily WHERE ' + where + 'd BETWEEN %s AND %s GROUP BY 1 ORDER BY 1')
            params = [granularity] + extra + [start.date(), end.date()]
        else:
            sql = ('SELECT date_trunc(%s, d)::date, sum(n_h), sum(n_lo), sum(n_hi), sum(frp_h) '
                   'FROM daily_h WHERE h3 = ANY(%s) AND d BETWEEN %s AND %s GROUP BY 1 ORDER BY 1')
            params = [granularity, a['cells'], start.date(), end.date()]
        rows = conn.execute(sql, params).fetchall()
    df = pd.DataFrame(rows, columns=['t', 'n', 'lo', 'hi', 'frp'])
    df['t'] = pd.to_datetime(df['t'])
    df = df.set_index('t').astype(float)
    first = start.to_period(PERIOD[granularity]).start_time
    df = df.reindex(pd.date_range(first, end, freq=FREQ[granularity]), fill_value=0.0)
    df.index.name = 't'
    last_end = df.index[-1].to_period(PERIOD[granularity]).end_time.normalize()
    return df, pd.Timestamp(data_from), pd.Timestamp(data_to), bool(last_end > pd.Timestamp(data_to))

@app.get('/series')
def series(aoi_id: str, granularity: str = 'month',
           date_from: str = '2000-01-01', date_to: str = '2100-01-01'):
    df, data_from, data_to, partial = load_series(aoi_id, granularity, date_from, date_to)
    points = [{'t': t.date().isoformat(), 'n': r.n, 'lo': r.lo, 'hi': r.hi, 'frp': r.frp}
              for t, r in df.iterrows()]
    return {'points': points, 'meta': {
        'granularity': granularity, 'data_from': data_from.date().isoformat(),
        'data_to': data_to.date().isoformat(), 'partial_last': partial}}


def period_start(day, g):
    if g == 'day':
        return day
    if g == 'week':
        return day - pd.Timedelta(days=day.weekday())
    if g == 'month':
        return day.replace(day=1)
    return day.replace(month=1, day=1)

def years_back(day, k):
    try:
        return day.replace(year=day.year - k)
    except ValueError:                        # 29 February
        return day.replace(year=day.year - k, day=28)

@app.get('/anomaly')
def anomaly(aoi_id: str, granularity: str = 'month', date: str | None = None):
    df, data_from, data_to, _ = load_series(aoi_id, 'day', '2000-01-01', '2100-01-01', limit=False)
    s = df['n']
    day = pd.Timestamp(date) if date else data_to - pd.Timedelta(days=1)
    if granularity not in FREQ or day > data_to or day < data_from:
        raise HTTPException(400, 'Unknown granularity or a date outside the data')
    start = period_start(day, granularity)
    current = float(s[start:day].sum())
    values, by_year = [], {}
    for k in range(1, day.year - s.index[0].year + 1):
        d2, s2 = years_back(day, k), years_back(start, k)
        if s2 < s.index[0]:
            break
        if granularity == 'day':
            window = s[d2 - pd.Timedelta(days=7): d2 + pd.Timedelta(days=7)]
            values.extend(window.tolist())
            by_year[str(d2.year)] = float(s[d2]) if d2 in s.index else 0.0
        else:
            total = float(s[s2:d2].sum())
            values.append(total)
            by_year[str(d2.year)] = total
    if len(values) < 3:
        raise HTTPException(400, 'Not enough history for this area')
    base = np.array(values)
    med = float(np.median(base))
    mad = float(np.median(np.abs(base - med)) * 1.4826)
    ends = {'day': day, 'week': start + pd.Timedelta(days=6),
            'month': start + pd.offsets.MonthEnd(0), 'year': start.replace(month=12, day=31)}
    return {
        'granularity': granularity, 'period_start': start.date().isoformat(),
        'day': day.date().isoformat(), 'current': current, 'median': med,
        'partial': bool(day < ends[granularity]),
        'ratio_to_median': current / med if med else None,
        'percentile': float((base < current).mean() * 100),
        'rank': int((base > current).sum()) + 1, 'n_compared': len(base),
        'robust_z': (current - med) / mad if mad else None,
        'same_period_by_year': by_year}


@app.get('/live/points')
def live_points(aoi_id: str, hours: int = 24):
    if hours not in (24, 48, 72):
        raise HTTPException(400, 'hours must be 24, 48 or 72')
    a = get_aoi(aoi_id)
    with pool.connection() as conn:
        rows = conn.execute(
            'SELECT sat, lat, lon, t, frp, conf FROM nrt_points '
            'WHERE t > now() - make_interval(hours => %s) AND h3 = ANY(%s) LIMIT 20001',
            (hours, a['cells'])).fetchall()
    return {'too_many': len(rows) > 20000, 'points': [
        {'sensor': r[0], 'lat': r[1], 'lon': r[2], 'time': r[3].isoformat(),
         'frp': r[4], 'conf': r[5]} for r in rows[:20000]]}

@app.get('/live/summary')
def live_summary(aoi_id: str):
    a = get_aoi(aoi_id)
    with pool.connection() as conn:
        points24 = conn.execute(
            'SELECT count(*) FROM nrt_points '
            'WHERE h3 = ANY(%s) AND t > now() - make_interval(hours => 24)',
            (a['cells'],)).fetchone()[0]
        last_fetch = conn.execute(
            'SELECT max(started_at) FROM ingest_log WHERE error IS NULL').fetchone()[0]
    return {'points_24h': points24, 'last_fetch': last_fetch}


import csv, io
from fastapi.responses import Response, StreamingResponse

@app.get('/export/csv')
def export_csv(aoi_id: str, granularity: str = 'day', date_from: str = '2000-01-01',
               date_to: str = '2100-01-01', level: str = 'area'):
    a = get_aoi(aoi_id)
    headers = {'Content-Disposition': 'attachment; filename=fire_hotspots_' + level + '.csv'}
    if level == 'area':
        df = load_series(aoi_id, granularity, date_from, date_to, limit=False)[0]
        return Response(df.reset_index().to_csv(index=False, float_format='%.3f'),
                        media_type='text/csv', headers=headers)
    if level == 'cell':
        sql = ('SELECT h3, d, n_h, n_lo, n_hi, frp_h, src FROM daily_h '
               'WHERE h3 = ANY(%s) AND d BETWEEN %s AND %s ORDER BY d, h3')
        head = ['h3', 'date', 'n_converted', 'n_low', 'n_high', 'frp_converted', 'source']
    elif level == 'points':
        sql = ('SELECT sat, t, lat, lon, frp, conf, daynight, h3, state FROM nrt_points '
               'WHERE h3 = ANY(%s) AND t >= %s AND t < (%s::date + 1) ORDER BY t')
        head = ['sensor', 'time_utc', 'latitude', 'longitude', 'frp_mw', 'confidence',
                'daynight', 'h3', 'state']
    else:
        raise HTTPException(400, 'level must be area, cell or points')
    def rows():
        buf = io.StringIO()
        w = csv.writer(buf)
        w.writerow(head)
        yield buf.getvalue(); buf.seek(0); buf.truncate()
        with pool.connection() as conn, conn.cursor(name='export') as cur:
            cur.execute(sql, (a['cells'], date_from, date_to))
            for r in cur:
                w.writerow(r); yield buf.getvalue(); buf.seek(0); buf.truncate()
    return StreamingResponse(rows(), media_type='text/csv', headers=headers)


PROOF = pd.read_csv('handover/proof_series.csv')
PROOF = PROOF.astype(object).where(PROOF.notna(), None)
CHECKS = json.load(open('handover/validation.json'))

@app.get('/proof')
def proof():
    return {'series': PROOF.to_dict(orient='records'), 'checks': CHECKS}

@app.get('/landcover')
def landcover(aoi_id: str):
    a = get_aoi(aoi_id)
    with pool.connection() as conn:
        rows = conn.execute(
            'SELECT ym, sum(agri_h), sum(forest_h), sum(other_h) FROM lc_monthly '
            'WHERE h3 = ANY(%s) GROUP BY ym ORDER BY ym', (a['cells'],)).fetchall()
    return {'months': [{'ym': r[0].strftime('%Y-%m'), 'agri': r[1], 'forest': r[2], 'other': r[3]}
                       for r in rows]}


from datetime import datetime, timezone
from apscheduler.schedulers.background import BackgroundScheduler
from jobs.ingest_nrt import run_ingest

if os.environ.get('RUN_SCHEDULER', '1') == '1':
    scheduler = BackgroundScheduler(timezone='UTC')
    scheduler.add_job(run_ingest, 'interval',
                      hours=int(os.environ.get('NRT_INTERVAL_HOURS', '3')),
                      next_run_time=datetime.now(timezone.utc), max_instances=1, coalesce=True)
    scheduler.start()
