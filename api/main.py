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
