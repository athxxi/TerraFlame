import glob, os
import psycopg

DB = os.environ['DATABASE_URL']
COPY_CSV = 'WITH (FORMAT csv, HEADER true)'

def copy_file(cur, table, columns, path):
    with open(path) as f, cur.copy('COPY %s (%s) FROM STDIN %s' % (table, columns, COPY_CSV)) as cp:
        while chunk := f.read(1 << 20):
            cp.write(chunk)

with psycopg.connect(DB) as conn, conn.cursor() as cur:
    for path in sorted(glob.glob('handover/daily_h_*.csv')):
        copy_file(cur, 'daily_h', 'h3, d, n_h, n_lo, n_hi, frp_h, src', path)
        print('imported', path)
    copy_file(cur, 'h3_state', 'h3, state', 'reference/h3_state.csv')
    if os.path.exists('handover/lc_monthly_h.csv'):
        copy_file(cur, 'lc_monthly', 'h3, ym, agri_h, forest_h, other_h', 'handover/lc_monthly_h.csv')
    cur.execute('INSERT INTO state_daily '
                'SELECT s.state, d.d, sum(d.n_h), sum(d.n_lo), sum(d.n_hi), sum(d.frp_h) '
                'FROM daily_h d JOIN h3_state s USING (h3) GROUP BY s.state, d.d')
    conn.commit()
    conn.autocommit = True
    cur.execute('ANALYZE')
