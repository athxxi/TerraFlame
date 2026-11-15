# TerraFlame: Frontend Build Brief for Cursor

> Read this whole file before writing any code. Work through the build order one stage at a time. After each stage, stop and tell me what to check in the browser. Do not start the next stage until I confirm.

## 1. What this product is

TerraFlame is a fire-hotspot calendar for India. A user picks an area (a state, all of India, a drawn shape, or a point with a radius). The app then shows:

- how many satellite fire detections happened there by day, week, month or year since Nov 2000
- whether a period is unusual compared with the same dates in earlier years
- a live map of detections from the last 24 to 72 hours
- a CSV download
- a "Proof" page showing that the old and new satellite data line up

The data is NASA FIRMS (MODIS and VIIRS). VIIRS counts are converted to MODIS-equivalent values so the 25-year series has no step when VIIRS began in 2012.

## 2. Current state (already built and tested, do not rebuild)

| Part | State |
| --- | --- |
| PostgreSQL in Docker | Running. History 2000-11-01 to 2026-11-14 imported |
| FastAPI backend (`terraflame-backend/api/main.py`) | All endpoints below work. Runs at `http://localhost:8000` |
| Live data job (`terraflame-backend/jobs/ingest_nrt.py`) | Fetches from FIRMS every 3 hours into the same database |
| Frontend (`terraflame-frontend/`) | Vite + React + TypeScript scaffold only. Packages installed. Nothing built yet |

Your job is **only the frontend** in `terraflame-frontend/`. Do not change `terraflame-backend/`. If you think the API needs a change, tell me instead of editing it.

## 3. Project layout

```
TerraFlameV1/
├── terraflame-backend/
│   ├── api/            backend (do not edit)
│   ├── db/             schema (do not edit)
│   ├── jobs/           live job (do not edit)
│   ├── reference/      calibration & proof files (in git)
│   ├── handover/       bulk daily_h CSVs for import (not in git)
│   └── .env            secrets (never read, print or commit)
├── terraflame-frontend/   YOU WORK HERE
└── CURSOR_BRIEF.md
```

Run the app with two terminals:
- Terminal 1, in `terraflame-backend/`: `source ../.venv/bin/activate && set -a; source .env; set +a && uvicorn api.main:app --reload`
- Terminal 2, in `terraflame-frontend/`: `npm run dev` (opens at `http://localhost:5173`)

`terraflame-frontend/.env` already holds `VITE_API_URL=http://localhost:8000`. Read the API address only from `import.meta.env.VITE_API_URL`. Never hard-code it.

## 4. Tech stack (already installed in `terraflame-frontend/`)

`react`, `typescript`, `vite`, `maplibre-gl`, `@mapbox/mapbox-gl-draw`, `deck.gl`, `echarts`, `@tanstack/react-query`, `zustand`, `dayjs`.

- Use TanStack Query for all API calls and zustand for shared state.
- Use ECharts for charts. Use MapLibre GL for the map and deck.gl for the points layer. If `MapboxOverlay` is not exported by `deck.gl`, run `npm install @deck.gl/mapbox`.
- Use dayjs with the `isoWeek` plugin for ISO weeks.
- Import `maplibre-gl/dist/maplibre-gl.css`.
- For development, use the free basemap style `https://demotiles.maplibre.org/style.json`.
- `@mapbox/mapbox-gl-draw` may need a small configuration fix to work with MapLibre. If it fights you, use a MapLibre-compatible draw package and tell me which.
- Install nothing else without telling me why.

## 5. The API contract (exact)

Base URL is `VITE_API_URL`. All responses are JSON unless noted. Errors come back as `{ "detail": "message" }` with status 400 or 404. Always show `detail` to the user in plain words.

### `GET /health`
```json
{ "ok": true, "last_ingest": "2026-11-15T01:09:55+00:00", "data_from": "2000-11-01", "data_to": "2026-11-14" }
```
`last_ingest` can be `null`.

### `GET /regions`
Returns an array of state names, for example `["Andhra Pradesh", "Assam", ...]`. The whole country is **not** in the list. Add "Whole India" in the UI and send `state: "India"` to `/aoi`.

### `POST /aoi`
Body: send exactly one of these forms.
```json
{ "state": "Kerala" }
{ "state": "India" }
{ "geojson": { "type": "Polygon", "coordinates": [[[76.4,9.8],[76.8,9.8],[76.8,10.2],[76.4,10.2],[76.4,9.8]]] } }
{ "lat": 9.99, "lon": 76.58, "radius_km": 30 }
```
Response: `{ "aoi_id": "a1b2c3d4e5f6", "cells": 12, "area_km2": 3036 }`.

Errors to handle:
- "No part of this area is inside India" (400)
- "Send a shape, a state, or a point with a radius" (400)

An area smaller than one map cell (about 253 km²) still works and covers one whole cell. Tell the user when the chosen area is smaller than one cell.

Every other endpoint needs the `aoi_id`. Save it in the store and reload every screen when it changes.

### `GET /series?aoi_id=&granularity=&date_from=&date_to=`
`granularity` is `day`, `week`, `month` or `year`. Dates are `YYYY-MM-DD` and optional.
```json
{
  "points": [ { "t": "2024-01-01", "n": 123.4, "lo": 100.1, "hi": 150.2, "frp": 980.5 } ],
  "meta": { "granularity": "month", "data_from": "2000-11-01", "data_to": "2026-11-14", "partial_last": true }
}
```
- `t` is the start of the period (weeks start on Monday). `n` is the converted count, `lo` and `hi` are its range, `frp` is fire radiative power.
- Periods with no detections are returned as `0`, not missing. Draw them as a light cell, not as a gap.
- `partial_last` is `true` when the last period is not finished. Label it "so far".
- Limits: the day view allows about 800 days, the week view about 3,700 days, month and year have no limit. If you exceed this the API returns "Choose a shorter range for the day view". Switching to Day should set the range to the last 12 months.

### `GET /anomaly?aoi_id=&granularity=&date=`
`date` is optional and defaults to the last complete day.
```json
{
  "granularity": "month", "period_start": "2026-11-01", "day": "2026-11-13",
  "current": 5400.0, "median": 3100.0, "partial": true,
  "ratio_to_median": 1.74, "percentile": 85.0, "rank": 4, "n_compared": 25,
  "robust_z": 1.2,
  "same_period_by_year": { "2025": 3000.0, "2024": 2800.0 }
}
```
`ratio_to_median` and `robust_z` can be `null` when the usual value is 0. Show a friendly message in that case. When `partial` is true, label the card "month so far" (or "week so far", "year so far").

### `GET /live/points?aoi_id=&hours=24|48|72`
```json
{ "too_many": false, "points": [ { "sensor": "VN20", "lat": 11.9, "lon": 75.7, "time": "2026-11-13T08:41:00+00:00", "frp": 5.15, "conf": "n" } ] }
```
`sensor` is one of `MODIS`, `VN20`, `VN21` (and `VNPP`, which currently has no live data). When `too_many` is `true` the points are cut off at 20,000, so ask the user to zoom in or pick a smaller area.

### `GET /live/summary?aoi_id=`
`{ "points_24h": 3128, "last_fetch": "2026-11-15T01:09:55+00:00" }`

### `GET /landcover?aoi_id=`
`{ "months": [ { "ym": "2024-03", "agri": 10.0, "forest": 4.0, "other": 2.0 } ] }`. It is currently an empty list because the data file has not arrived. **Hide the whole card when the list is empty.**

### `GET /proof`
```json
{
  "series": [ { "month": "2000-11-01", "MODIS": 313, "VN20": 0, "VN21": 0, "VNPP": 0, "n_h": 313, "n_lo": 313, "n_hi": 313 } ],
  "checks": {
    "pattern_match":      { "value": { "day": 0.92, "week": 0.97, "month": 0.99 }, "sentence": "..." },
    "typical_difference": { "value": 8.1, "sentence": "..." },
    "busiest_months":     { "value": 5, "sentence": "..." },
    "gap_closed":         { "value": [5.7, 1.03], "sentence": "..." },
    "peak_season":        { "value": 0.88, "sentence": "..." }
  }
}
```
Draw three lines on the Proof chart: raw MODIS (`MODIS`), raw VIIRS S-NPP (`VNPP`), and converted (`n_h`) with the `n_lo` to `n_hi` band. Show the five checks as tiles using their `sentence` text exactly as given.

### `GET /export/csv?aoi_id=&granularity=&date_from=&date_to=&level=`
Returns a CSV file (not JSON). `level` is `area` (one row per period at the chosen granularity), `cell` (one row per map cell and day) or `points` (raw live detections). Do not fetch it with TanStack Query. Open it as a normal download link. Warn the user before a large `cell` download (a whole state or India over many years can be millions of rows).

## 6. Rules that apply to every stage

1. **Real data only.** Never write mock or placeholder data into the app. If something has no data yet, show an empty state.
2. **Wording.** Say "hotspot detections", never "fires". The counts are a proxy for fire activity, not a count of fires or burned area. Add a short note about this on the Proof page.
3. **Weekly and monthly views are more reliable than daily ones.** The Day view is noisier. Say so near the Day view.
4. **Today is partial.** The newest day is incomplete until all satellite passes arrive. Mark the last period "so far".
5. **Colours.** Use a colour-blind-safe sequential scale (viridis or cividis) with a square-root scale as the default. Zero-detection days are a light neutral cell.
6. **Every screen needs three states:** loading, empty and error. Show the API's `detail` message in the error state.
7. **Responsive.** It must work on a phone and at projector size.
8. **Code quality.** TypeScript with no `any`. One typed function per endpoint in `src/api.ts`. Keep components small, and keep data fetching in hooks, not in the chart components.
9. **Do not touch secrets.** Never open or print `.env`. Do not commit large `handover/daily_h_*.csv` files.
10. **Stay in `terraflame-frontend/`.** If you need a backend change, stop and ask me.

## 7. Shared state (zustand store)

```
aoiId: string | null
granularity: 'day' | 'week' | 'month' | 'year'   (default 'month')
dateFrom: string  (default '2000-01-01')
dateTo: string    (default today)
selectedDate: string | null   (set by clicking a chart cell or bar)
```
Changing `aoiId` reloads everything. Changing `granularity` reloads the chart and the anomaly cards. Setting `selectedDate` reloads the anomaly cards.

## 8. Build order (stop after each stage)

For each stage I list what to build and the acceptance checks I will run. Tell me exactly what to look at.

### Stage A: Foundation
Build `src/api.ts` (typed functions for every endpoint above), the store, the TanStack Query provider and a basic page layout (header, main area). Show `GET /health` as a chip: "Data to 2026-11-14 · updated N hours ago" (or "live updates pending" when `last_ingest` is null).
**Check:** the page loads and the chip shows the real dates. Stopping the backend shows a clear error, not a blank page.

### Stage B: Area picker
A dropdown of states from `/regions` plus "Whole India". Choosing one calls `POST /aoi` and stores `aoiId`. Show the cell count and area in km² under the picker.
**Check:** Kerala, Punjab and Whole India each return an id and sensible cell counts (India is about 13,000 cells).

### Stage C: Time controls and the main chart
Day / Week / Month / Year buttons and a date-range control with presets (last 12 months, last 5 years, all). Main chart reading `/series`:
- **Year:** one bar per year with a thin range line (`lo` to `hi`).
- **Month:** a heatmap with years across and months down.
- Mark the last period "so far" when `meta.partial_last` is true. Tooltips show the value with its range.
- Switching to Day sets the range to the last 12 months. Show the API's "choose a shorter range" message if a longer range is picked.

**Check:** for a busy state (Punjab or Madhya Pradesh) the year bars and month heatmap show clear seasons. Years 2016, 2017 and 2022 show real values, not zeros.

### Stage D: Week and Day views
- **Week:** heatmap with years across and ISO weeks 1 to 53 down.
- **Day:** a calendar heatmap for one chosen year (weeks across, weekdays down) plus a line chart with a range brush.
- Clicking a cell or bar sets `selectedDate`.

**Check:** all four granularities work for one area. A week's value equals the sum of its seven days.

### Stage E: Anomaly cards
Cards from `/anomaly` using the chosen granularity and `selectedDate`. Show the ratio to the median (for example "1.7 times the usual"), the percentile, the period label ("month so far" when `partial`), and a small bar chart of `same_period_by_year`. Handle `null` ratio gracefully.
**Check:** clicking a different month updates the cards. A quiet area (small Kerala box) shows a friendly message, not an error.

### Stage F: Live map and live panel
- MapLibre map showing points from `/live/points` with a deck.gl layer. Buttons for 24, 48 and 72 hours. Refresh every 5 minutes. Point size scaled by `frp`. Fit the map to the chosen area.
- "Updated at" from `/live/summary.last_fetch`.
- When `too_many` is true, show "Zoom in or pick a smaller area".
- Live panel: the count of points in the last 24 hours, plus daily bars for the last 14 days from `/series?granularity=day`, today flagged as partial.

**Check:** India shows thousands of points, Kerala only a handful. The 24/48/72 buttons change the count.

### Stage G: Drawing and radius on the map
Polygon drawing and "point with radius" tools on the map. Both call `POST /aoi` and set the new `aoiId`. Show the "area is smaller than one cell" note when relevant, and the API's error when the shape is outside India.
**Check:** draw a polygon over Punjab, draw a circle, and draw one in the sea.

### Stage H: CSV dialog, Proof page, land cover card
- CSV dialog: choose the time step and level (area, cell, points) and the range, warn before big downloads, then download.
- Proof page (separate route or tab): the line chart and five check tiles from `/proof`.
- Land cover card from `/landcover` (stacked share per month). Hide when empty.

**Check:** the downloaded `area` CSV total matches the chart. The Proof chart shows converted VIIRS following MODIS closely.

### Stage I: Polish
Loading, empty and error messages everywhere, mobile layout, projector size, accessible colours and labels, no console errors, no mock data left. Remove unused Vite starter files.
**Check:** run through the whole flow on a phone-sized window.

## 9. Known data facts (so you do not "fix" things that are correct)

- History runs 2000-11-01 to 2026-11-14. The last live day is always incomplete.
- The VIIRS S-NPP live feed stopped on 2026-11-02, so `VNPP` has no recent live points. This is a data source issue, not a bug. Do not hide the sensor, but do not show an error either.
- Days and cells with no detections are zero, not missing.
- Kerala has very few fires. Test charts with busy states such as Punjab or Madhya Pradesh.
- The land cover endpoint returns an empty list until a data file arrives.
- Daily values are noisy. Weekly and monthly views are more reliable.

## 10. How to work with me

1. Start with Stage A only.
2. After each stage, give me a short list of: files created or changed, the commands to run, and exactly what I should see.
3. If a command or package fails, show me the full error and propose the fix. Do not silently work around it.
4. When I say the stage passes, suggest a one-line git commit message, then continue to the next stage.
