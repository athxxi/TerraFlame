CREATE TABLE daily_h (
  h3 text NOT NULL, d date NOT NULL,
  n_h real NOT NULL, n_lo real NOT NULL, n_hi real NOT NULL, frp_h real NOT NULL,
  src text NOT NULL, PRIMARY KEY (h3, d));
CREATE INDEX daily_h_d ON daily_h (d);

CREATE TABLE h3_state (h3 text PRIMARY KEY, state text NOT NULL);

CREATE TABLE state_daily (
  state text NOT NULL, d date NOT NULL,
  n_h real NOT NULL, n_lo real NOT NULL, n_hi real NOT NULL, frp_h real NOT NULL,
  PRIMARY KEY (state, d));

CREATE TABLE lc_monthly (
  h3 text NOT NULL, ym date NOT NULL,
  agri_h real, forest_h real, other_h real, PRIMARY KEY (h3, ym));

CREATE TABLE nrt_points (
  id bigserial PRIMARY KEY, sat text NOT NULL, t timestamptz NOT NULL,
  lat real NOT NULL, lon real NOT NULL, frp real, conf char(1), daynight char(1),
  h3 text NOT NULL, state text NOT NULL, fetched_at timestamptz NOT NULL DEFAULT now());
CREATE UNIQUE INDEX nrt_points_uq ON nrt_points (sat, t, lat, lon);
CREATE INDEX nrt_points_t ON nrt_points (t);
CREATE INDEX nrt_points_h3 ON nrt_points (h3);

CREATE TABLE aoi (
  id text PRIMARY KEY, geojson jsonb NOT NULL, cells text[] NOT NULL,
  state text, area_km2 real, created_at timestamptz DEFAULT now());

CREATE TABLE alert_subscriptions (
  id serial PRIMARY KEY, chat_id bigint NOT NULL, aoi_id text REFERENCES aoi(id),
  min_hotspots int NOT NULL DEFAULT 20, last_alert_at timestamptz,
  created_at timestamptz DEFAULT now());

CREATE TABLE ingest_log (
  id serial PRIMARY KEY, started_at timestamptz DEFAULT now(),
  source text, fetched int, inserted int, error text);
