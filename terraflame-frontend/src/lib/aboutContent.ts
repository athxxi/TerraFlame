export type AboutTocItem = { id: string; label: string }

export const ABOUT_TOC: AboutTocItem[] = [
  { id: 'what-this-is', label: 'What this is' },
  { id: 'data', label: 'Where the data comes from' },
  { id: 'method', label: 'How the sensors are made comparable' },
  { id: 'current', label: 'How current data is added' },
  { id: 'limits', label: 'Limits' },
  { id: 'glossary', label: 'Glossary' },
  { id: 'credits', label: 'Credits and licence' },
]

export const SENSOR_ROWS = [
  {
    kind: 'modis' as const,
    sensor: 'MODIS',
    satellites: 'Terra, Aqua',
    detail: 'From 2000. The long record that all history is measured against.',
  },
  {
    kind: 'viirs' as const,
    sensor: 'VIIRS',
    satellites: 'Suomi NPP, NOAA-20, NOAA-21',
    detail: 'From 2012. Sees smaller and cooler fires; converted to MODIS-equivalent counts.',
  },
  {
    kind: 'source' as const,
    sensor: 'Source',
    satellites: 'NASA FIRMS',
    detail: 'Open data. Near-real-time detections are fetched every 3 hours.',
  },
]

export const METHOD_STEPS = [
  {
    n: 1,
    title: 'Clean the detections',
    body: 'Remove repeats and weak detections.',
  },
  {
    n: 2,
    title: 'Compare the sensors',
    body: 'Line them up in the years they overlap.',
  },
  {
    n: 3,
    title: 'Convert and join',
    body: 'Convert VIIRS to MODIS-equivalent and join the series.',
  },
]

export const NRT_PIPELINE_STEPS = [
  {
    n: 1,
    title: 'Fetch',
    body: 'New detections are pulled from NASA FIRMS about every three hours.',
  },
  {
    n: 2,
    title: 'Clean',
    body: 'Duplicates and weak detections are removed using the same rules as the archive.',
  },
  {
    n: 3,
    title: 'Harmonize',
    body: 'VIIRS counts are converted to the same MODIS-equivalent scale as the history.',
  },
  {
    n: 4,
    title: 'Serve',
    body: 'Results are stored in the database. Charts and maps only read from there — not live from NASA.',
  },
] as const

export type LimitGroup = {
  id: string
  title: string
  intro?: string
  items: string[]
}

export const LIMIT_GROUPS: LimitGroup[] = [
  {
    id: 'meaning',
    title: 'What the numbers mean',
    intro: 'Treat counts as a signal of activity, not a full inventory of fires.',
    items: [
      'Each value is a hotspot detection. One fire can produce several detections.',
      'Cropland hotspots suggest burning but do not confirm crop residue fires on their own.',
      'There is no burned-area or emissions estimate in TerraFlame.',
    ],
  },
  {
    id: 'satellites',
    title: 'Satellites and weather',
    items: [
      'Overpass times differ by satellite, so a “day” is incomplete until passes finish.',
      'Clouds and smoke can hide fires, especially in the humid season.',
      'Terra and Aqua have drifted from their original orbits, which can affect the newest MODIS days.',
    ],
  },
  {
    id: 'harmonization',
    title: 'Matching old and new sensors',
    items: [
      'VIIRS sees smaller and cooler fires than MODIS, so counts need conversion.',
      'Conversion assumes the relationship between sensors stays steady over time.',
      'Proof checks only the years both sensors flew together — not every future season.',
    ],
  },
  {
    id: 'time-place',
    title: 'Time, place, and live view',
    items: [
      'Days use UTC. Map cells are about 250 km², so small areas still reflect whole hexagons.',
      'Daily totals are noisier than weekly or monthly ones.',
      'Live map dots are raw detections; recent harmonized days use the same ratios as since 2012.',
    ],
  },
]

export const GLOSSARY: { term: string; def: string }[] = [
  {
    term: 'Hotspot detection',
    def: 'A spot where a satellite sensed heat that looks like a fire. One fire can make several detections.',
  },
  {
    term: 'FRP (fire radiative power)',
    def: 'The heat energy a detection gives off, in megawatts. Bigger means a stronger fire.',
  },
  {
    term: 'Confidence',
    def: 'How sure the sensor is that a detection is a real fire: low, nominal or high.',
  },
  {
    term: 'Harmonized',
    def: 'Put on one scale. Counts from both sensors are converted so they can be compared.',
  },
  {
    term: 'Median',
    def: 'The middle value. Half of the years were higher and half were lower.',
  },
  {
    term: 'Percentile',
    def: 'Where a value ranks. 96% means higher than 96 of every 100 earlier values.',
  },
  {
    term: 'NRT (near real time)',
    def: 'Detections that arrive within hours of the satellite pass.',
  },
  {
    term: 'H3 map cell',
    def: 'A hexagon of about 250 km² used to count detections on the map.',
  },
]