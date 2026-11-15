import { Link } from 'react-router-dom'
import {
  GLOSSARY,
  LIMIT_GROUPS,
  METHOD_STEPS,
  NRT_PIPELINE_STEPS,
  SENSOR_ROWS,
} from '../lib/aboutContent'
import './AboutPage.css'

function ChevronRight() {
  return (
    <svg className="text-link__chevron" width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m5 3 4 4-4 4"
      />
    </svg>
  )
}

function glossaryPairs() {
  const pairs: (typeof GLOSSARY)[] = []
  for (let i = 0; i < GLOSSARY.length; i += 2) {
    pairs.push(GLOSSARY.slice(i, i + 2))
  }
  return pairs
}

function SensorRow({ row }: { row: (typeof SENSOR_ROWS)[number] }) {
  return (
    <div className="about-sensor-table__row">
      <div className="about-sensor-table__sensor">
        {row.kind === 'modis' ? (
          <span className="about-sensor-marker about-sensor-marker--modis" aria-hidden />
        ) : null}
        {row.kind === 'viirs' ? (
          <span className="about-sensor-marker about-sensor-marker--viirs" aria-hidden />
        ) : null}
        <span className="about-sensor-table__sensor-name">{row.sensor}</span>
      </div>
      <span className="about-sensor-table__sat">{row.satellites}</span>
      <span className="about-sensor-table__detail">{row.detail}</span>
    </div>
  )
}

function SectionHead({ title }: { title: string }) {
  return (
    <div className="about-section__head">
      <h2 className="content-section__title">{title}</h2>
    </div>
  )
}

export function AboutPage() {
  return (
    <div className="about-page">
      <div className="content-page__surface about-page__shell">
        <header className="about-page__hero panel">
          <p className="eyebrow">About</p>
          <h1 className="content-display">About and method</h1>
          <p className="content-lede about-page__hero-lede">
            How the numbers are made, where they come from, and what they cannot tell you.
          </p>
          <p className="about-page__hero-actions">
            <Link to="/proof" className="text-link">
              See harmonization proof
              <ChevronRight />
            </Link>
          </p>
        </header>

        <div className="about-page__layout">
          <div className="about-page__sections">
            <section id="what-this-is" className="about-section panel content-section">
              <SectionHead title="What this is" />
              <div className="about-section__prose">
                <p className="content-section__body">
                  TerraFlame gives emergency managers one consistent record of satellite hotspot
                  detections for any area of India, from 2000 to today, by day, week, month or year.
                </p>
                <p className="content-section__body">
                  It shows how a chosen period compares with the same time in earlier years, what was
                  detected in the last few days, and why the switch from older to newer sensors does
                  not distort the history.
                </p>
              </div>
            </section>

            <section id="data" className="about-section panel content-section">
              <SectionHead title="Where the data comes from" />
              <p className="content-section__body">
                Detections come from NASA FIRMS. History runs from November 2000; the newest days are
                updated every 3 hours from live data.
              </p>
              <div className="about-sensor-table">
                <div className="about-sensor-table__head eyebrow">
                  <span>Sensor</span>
                  <span>Satellites</span>
                  <span>Period and role</span>
                </div>
                {SENSOR_ROWS.map((row) => (
                  <SensorRow key={row.sensor} row={row} />
                ))}
              </div>
            </section>

            <section id="method" className="about-section panel content-section about-section--method">
              <SectionHead title="How the sensors are made comparable" />
              <p className="content-section__body">
                The two sensors count fires differently, so both are put on one scale in three steps.
                Each state and calendar month gets its own conversion.
              </p>
              <div className="about-steps">
                {METHOD_STEPS.map((step) => (
                  <article key={step.n} className="about-step">
                    <span className="about-step__n">{step.n}</span>
                    <h3 className="about-step__title">{step.title}</h3>
                    <p className="about-step__body caption">{step.body}</p>
                  </article>
                ))}
              </div>
              <div className="about-proof-cta">
                <p className="caption">Independent checks on the national validation dataset.</p>
                <Link to="/proof" className="text-link">
                  See the evidence on the Proof page
                  <ChevronRight />
                </Link>
              </div>
            </section>

            <div className="about-section-duo">
              <section
                id="current"
                className="about-section panel content-section about-section-duo__item about-section--current"
              >
                <SectionHead title="How current data is added" />
                <p className="content-section__body about-current__lede">
                  Live and recent days follow the same path as the archive. Your browser never talks to
                  NASA directly — it only reads our database after each ingest run.
                </p>
                <ol className="about-pipeline">
                  {NRT_PIPELINE_STEPS.map((step) => (
                    <li key={step.n} className="about-pipeline__step">
                      <span className="about-pipeline__n" aria-hidden>
                        {step.n}
                      </span>
                      <h3 className="about-pipeline__title">{step.title}</h3>
                      <p className="about-pipeline__body caption">{step.body}</p>
                    </li>
                  ))}
                </ol>
              </section>

              <section
                id="limits"
                className="about-section panel content-section about-section-duo__item about-section--limits"
              >
                <SectionHead title="Limits" />
                <p className="content-section__body about-limits__lede">
                  TerraFlame is built for comparison and early situational awareness. Keep these
                  limits in mind when you interpret charts, rankings, and the live map.
                </p>
                <div className="about-limits-grid">
                  {LIMIT_GROUPS.map((group) => (
                    <article key={group.id} className="about-limit-card">
                      <h3 className="about-limit-card__title">{group.title}</h3>
                      {group.intro ? <p className="about-limit-card__intro caption">{group.intro}</p> : null}
                      <ul className="about-limit-card__list">
                        {group.items.map((item) => (
                          <li key={item.slice(0, 40)}>{item}</li>
                        ))}
                      </ul>
                    </article>
                  ))}
                </div>
              </section>
            </div>

            <section id="glossary" className="about-section panel content-section">
              <SectionHead title="Glossary" />
              <div className="about-glossary">
                {glossaryPairs().map((pair) => (
                  <div className="about-glossary__row" key={pair[0]?.term}>
                    {pair.map((entry) => (
                      <article key={entry.term} className="about-glossary__term">
                        <h3 className="about-glossary__name">{entry.term}</h3>
                        <p className="about-glossary__def caption">{entry.def}</p>
                      </article>
                    ))}
                  </div>
                ))}
              </div>
            </section>

            <section id="credits" className="about-section panel content-section about-section--credits">
              <SectionHead title="Credits and licence" />
              <p className="content-section__body">
                Detections: NASA FIRMS (open data). Built by DarkNova for the hackathon. Code
                repository link to be published with the release.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}