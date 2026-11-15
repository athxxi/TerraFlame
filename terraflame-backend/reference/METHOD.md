# Method note: daily fire detections, MODIS-equivalent, India

## What this data is
Daily satellite fire detections over India, counted per map cell and converted to
**MODIS-equivalent values**, so the series runs from 2000 to 2026 without a step when the
sharper VIIRS sensors began in 2012. The values are a proxy for fire activity, not a count
of individual fires.

Source: NASA FIRMS. Sensors and the period each covers in this data:

| Label | Sensor | Data from |
| --- | --- | --- |
| MODIS | Terra and Aqua together, C6.1 | 2000-11-01 |
| VNPP | VIIRS S-NPP, C2 | 2012-01-20 |
| VN20 | VIIRS NOAA-20, C2 | 2018-04-01 |
| VN21 | VIIRS NOAA-21, C2 | 2023-03-01 |

Data runs to **2026-11-14** (S-NPP's near-real-time file ends earlier, on 2026-11-02).
The live job takes over from the day after the last day in the files. <<CHECK: compare this
with "Last day" printed by finish_handover.py and correct it if different>>

## How the conversion works
1. **Cleaning.** Only presumed vegetation fires are kept (FIRMS type 0). Low-confidence
   detections are dropped: MODIS confidence below 30, and VIIRS "low". Nominal and high
   confidence stay.
2. **Days.** All days are UTC days.
3. **Map cells and states.** Each detection goes to an H3 cell (resolution 5, about 250 km²).
   A cell belongs to a state when its centre lies inside the state. Detections whose cell
   centre is outside every state (neighbouring countries, sea, a few coastal and border
   cells) are dropped.
4. **Daily counts.** Detections are counted per cell, UTC day and sensor.
5. **Exchange ratios.** For each state, calendar month and VIIRS satellite, the ratio
   MODIS ÷ VIIRS is calculated from monthly totals in the years both sensors flew. A month
   is used only if both sensors have at least 10 detections. The median of these ratios is
   the exchange ratio; the 10th and 90th percentiles give the range (`n_lo`, `n_hi`).
   Where a state has fewer than 3 usable years, the national ratio for that month is used.
6. **Combining.** Before VIIRS starts (before 2012-01-20) MODIS is used as measured
   (`src` = MODIS). From then on, the converted VIIRS values are averaged over the VIIRS
   satellites that have data that day (`src` = VIIRS), so two satellites are never added up.
   On a day when a satellite has no data, the average uses the others.
7. **Joining files.** Each sensor's archive and near-real-time (NRT) files follow each other
   without a gap. Where they overlapped, the NRT version of the shared day was used.

## Files
| File | Content |
| --- | --- |
| `daily_h_YYYY.csv` | One row per map cell and day with detections: `h3`, `d` (UTC date), `n_h` (converted count), `n_lo`, `n_hi` (range), `frp_h` (converted fire power), `src` |
| `h3_state.csv` | Every map cell of India and its state |
| `calibration.csv` | Exchange ratios per state, month and VIIRS satellite |
| `satellites.csv` | First date of each satellite |
| `proof_series.csv` | National monthly series: raw counts per sensor and the converted series with its range |
| `validation.json` | Five checks, each with a plain sentence |
| `data_gaps.txt` | Days with no data, per sensor |
| `fire_pipeline.py` | The shared cleaning and conversion code; the live job must import this same file |

Days and cells with no detections have no row.

## Limits
- Counts are a proxy for fire activity, not a count of fires or of burned area.
- VIIRS sees smaller fires than MODIS. The conversion adjusts totals but cannot recover
  fire sizes.
- The sensors pass over at different times of day, and clouds and smoke hide fires.
- Daily values are noisy. Weekly or monthly views are more reliable.
- Some days have no data from one or more sensors (satellite outages or missing source
  data); the full list is in `data_gaps.txt`. MODIS has missing days mainly in 2001, before
  Aqua. S-NPP's longest gap is 2022-07-27 to 2022-08-10.
- S-NPP's NRT file ends on 2026-11-02, so the most recent days use NOAA-20 and NOAA-21 only.
- Terra and Aqua orbits have drifted, which may lower recent MODIS counts and therefore the
  converted values.
- A few coastal and border detections are dropped (see step 3).
- Land-cover split (agricultural vs forest): <<CHECK: write "not included in this version"
  unless you completed the bonus step and `lc_monthly_h.csv` is in this folder>>
- The five checks in `validation.json` compare the sensors in the years both flew, which are
  also the years used to set the exchange ratios. They show how well the sensors line up,
  not how well the method predicts other years.

## Sources and credits
- Fire data: NASA FIRMS (MODIS C6.1; VIIRS S-NPP, NOAA-20 and NOAA-21, collection 2).
- State boundaries: geoBoundaries gbOpen, licence CC BY 4.0, downloaded on the date the file
  `india_states.geojson` was saved. Disputed border areas follow this boundary file.