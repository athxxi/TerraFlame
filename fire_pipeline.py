from types import SimpleNamespace
import h3
import numpy as np
import pandas as pd

H3_RES = 5                         # map cells of about 250 square km
VIIRS = ['VNPP', 'VN20', 'VN21']   # S-NPP, NOAA-20, NOAA-21

def clean(df, label):
    # Raw FIRMS rows to standard columns. label: MODIS, VNPP, VN20 or VN21.
    if 'type' in df.columns:
        df = df[df['type'] == 0]                      # presumed vegetation fire only
    conf = df['confidence']
    if label == 'MODIS':
        conf = pd.to_numeric(conf, errors='coerce')
        keep = conf >= 30                             # drop low confidence
        df, conf = df[keep], conf[keep]
        conf = np.where(conf >= 80, 'h', 'n')
    else:
        conf = conf.astype(str).str.lower().str[0]
        keep = conf.isin(['n', 'h'])                  # drop low confidence
        df, conf = df[keep], conf[keep]
    hhmm = df['acq_time'].astype(int).astype(str).str.zfill(4)
    t = pd.to_datetime(df['acq_date'].astype(str) + ' ' + hhmm,
                       format='%Y-%m-%d %H%M', utc=True)
    out = pd.DataFrame({'t': t, 'lat': df['latitude'], 'lon': df['longitude'],
                        'frp': df['frp'], 'daynight': df['daynight']})
    out['conf'] = np.asarray(conf)
    out['sat'] = label
    return out

def add_cells(df, h3_state):
    # Adds the map cell and the state; drops detections outside India.
    key = list(zip(df['lat'].round(2), df['lon'].round(2)))
    cache = {k: h3.latlng_to_cell(k[0], k[1], H3_RES) for k in set(key)}
    out = df.assign(h3=[cache[k] for k in key])
    out['state'] = out['h3'].map(h3_state)
    return out[out['state'].notna()]

def daily_counts(df):
    # One row per cell, state, UTC day and satellite.
    d = df['t'].dt.floor('D').dt.tz_localize(None)
    return (df.assign(d=d).groupby(['h3', 'state', 'd', 'sat'], as_index=False)
              .agg(n=('frp', 'size'), frp=('frp', 'sum')))

def harmonize(counts, calibration, satellites):
    # Daily counts to MODIS-equivalent daily values: h3, d, n_h, n_lo, n_hi, frp_h, src.
    c = counts.copy()
    c['month'] = c['d'].dt.month
    c = c.merge(calibration, on=['state', 'month', 'sat'], how='left')
    for col in ('factor', 'factor_lo', 'factor_hi'):
        c[col] = c[col].fillna(1.0)                   # MODIS has no row: factor 1
    c['n_h'] = c['n'] * c['factor']
    c['n_lo'] = c['n'] * c['factor_lo']
    c['n_hi'] = c['n'] * c['factor_hi']
    c['frp_h'] = c['frp'] * c['factor']
    cols = ['n_h', 'n_lo', 'n_hi', 'frp_h']
    first = satellites.set_index('sat')['first_date']
    viirs_first = first[VIIRS].min()
    viirs_days = set(c.loc[(c['sat'] != 'MODIS') & (c['d'] >= viirs_first), 'd'])
    # After VIIRS launch: prefer converted VIIRS when it has detections that day.
    # Use MODIS on days with no VIIRS (for example when only MODIS NRT still returns rows).
    m = c[
        (c['sat'] == 'MODIS')
        & ((c['d'] < viirs_first) | ((c['d'] >= viirs_first) & (~c['d'].isin(viirs_days))))
    ]
    v = c[(c['sat'] != 'MODIS') & (c['d'] >= viirs_first)].copy()
    present = v.groupby('d')['sat'].nunique()         # VIIRS satellites that have data that day
    k = v['d'].map(present)                            # VIIRS satellites flying that day
    for col in cols:
        v[col] = v[col] / k                           # average, so two satellites are not added up
    out_m = m.groupby(['h3', 'd'], as_index=False)[cols].sum().assign(src='MODIS')
    out_v = v.groupby(['h3', 'd'], as_index=False)[cols].sum().assign(src='VIIRS')
    return pd.concat([out_m, out_v], ignore_index=True)

def load_h3_state(folder):
    return pd.read_csv(folder + '/h3_state.csv').set_index('h3')['state'].to_dict()

def load_reference(folder):
    return SimpleNamespace(
        h3_state=load_h3_state(folder),
        calibration=pd.read_csv(folder + '/calibration.csv'),
        satellites=pd.read_csv(folder + '/satellites.csv', parse_dates=['first_date']))