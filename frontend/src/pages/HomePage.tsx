import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { useProof } from '../hooks/useProof'
import { HeroHeatmapSample } from '../components/home/HeroHeatmapSample'
import './HomePage.css'

const promises = [
  {
    title: 'One record across sensors',
    body: 'Old and new satellites on one harmonized scale for fair year-to-year comparison.',
    icon: 'layers' as const,
  },
  {
    title: 'This month against history',
    body: 'See whether this month is unusual compared with the same dates in earlier years.',
    icon: 'calendar' as const,
  },
  {
    title: 'Live detections',
    body: 'Fresh hotspot detections from the last 24 to 72 hours on a live map.',
    icon: 'live' as const,
  },
] as const

function MapPinIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none" aria-hidden>
      <path
        d="M8 1.5a4.5 4.5 0 0 0-4.5 4.5c0 3.375 4.5 8.5 4.5 8.5s4.5-5.125 4.5-8.5A4.5 4.5 0 0 0 8 1.5Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <circle cx="8" cy="6" r="1.5" fill="currentColor" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 14 14" fill="none" aria-hidden>
      <path
        d="M7 1.5 2.5 3.5v3.5c0 2.6 1.9 5 4.5 5.6 2.6-.6 4.5-3 4.5-5.6V3.5L7 1.5Z"
        stroke="currentColor"
        strokeWidth="1.1"
      />
      <path d="m4.5 7 1.8 1.8L9.5 5.6" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  )
}

function ChevronRight() {
  return (
    <svg className="text-link__chevron" width={14} height={14} viewBox="0 0 14 14" aria-hidden>
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

function PromiseIcon({ kind }: { kind: (typeof promises)[number]['icon'] }) {
  if (kind === 'layers') {
    return (
      <svg width={18} height={18} viewBox="0 0 18 18" aria-hidden>
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          d="M2 6.5 9 2.5l7 4M2 11.5l7 4 7-4"
        />
      </svg>
    )
  }
  if (kind === 'calendar') {
    return (
      <svg width={18} height={18} viewBox="0 0 18 18" aria-hidden>
        <rect x="2.5" y="4" width="13" height="11" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path stroke="currentColor" strokeWidth="1.2" d="M2.5 7.5h13M6 2.5v3M12 2.5v3" />
      </svg>
    )
  }
  return (
    <svg width={18} height={18} viewBox="0 0 18 18" aria-hidden>
      <circle cx="9" cy="9" r="3" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        d="M9 2v1.5M9 14.5V16M2 9h1.5M14.5 9H16"
      />
    </svg>
  )
}

export function HomePage() {
  const proofQuery = useProof()
  const pattern = proofQuery.data?.checks.pattern_match
  const monthMatch =
    pattern && typeof pattern.value === 'object' && pattern.value !== null
      ? (pattern.value as { month?: number }).month
      : undefined

  return (
    <div className="home-page">
      <div className="content-page__surface home-page__shell">
        <section className="home-hero panel" aria-labelledby="home-hero-title">
          <div className="home-hero__text">
            <p className="eyebrow">Fire history for emergency managers</p>
            <h1 id="home-hero-title" className="content-display home-hero__headline">
              One consistent fire record for India, 2000 to today
            </h1>
            <p className="content-lede home-hero__lede">
              Older and newer satellites count fires differently. Both are put on one harmonized scale,
              so this month can be compared fairly with any earlier year.
            </p>
            <div className="home-hero__actions">
              <Button to="/explorer" variant="primary" icon={<MapPinIcon />}>
                Start exploring
              </Button>
              <Link to="/proof" className="text-link">
                How do we know it is consistent?
                <ShieldIcon />
              </Link>
              <Link to="/about" className="text-link text-link--small">
                About the method
                <ChevronRight />
              </Link>
            </div>
          </div>
          <HeroHeatmapSample />
        </section>

        <section className="home-block" aria-labelledby="home-promises-title">
          <header className="home-block__head">
            <p className="eyebrow">What you get</p>
            <h2 id="home-promises-title" className="title-sm">
              Built for comparison and response
            </h2>
          </header>
          <div className="promise-grid">
            {promises.map((item) => (
              <article key={item.title} className="promise panel">
                <span className="promise__icon" aria-hidden>
                  <PromiseIcon kind={item.icon} />
                </span>
                <h3 className="promise__title">{item.title}</h3>
                <p className="promise__body caption">{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="home-proof" aria-labelledby="home-proof-title">
          {proofQuery.isError ? (
            <div className="home-proof__card home-proof__card--plain panel">
              <p id="home-proof-title" className="eyebrow">
                Proof
              </p>
              <p className="home-proof__message" role="alert">
                {proofQuery.error.message}
              </p>
            </div>
          ) : proofQuery.isLoading ? (
            <div className="home-proof__card home-proof__card--plain panel">
              <p id="home-proof-title" className="eyebrow">
                Proof
              </p>
              <p className="home-proof__message caption">Loading proof summary…</p>
            </div>
          ) : pattern ? (
            <div className="home-proof__card">
              <p id="home-proof-title" className="home-proof__eyebrow eyebrow">
                Validation · pattern match
              </p>
              <div className="home-proof__inner">
                <div className="home-proof__score" aria-label="Monthly pattern match score">
                  <span className="home-proof__stat">
                    {monthMatch !== undefined ? monthMatch.toFixed(2) : '—'}
                  </span>
                  <span className="home-proof__stat-label">Monthly correlation</span>
                </div>
                <div className="home-proof__copy">
                  <p className="home-proof__sentence">{pattern.sentence}</p>
                  <p className="home-proof__source caption">National validation dataset</p>
                </div>
                <div className="home-proof__cta">
                  <Button to="/proof" variant="secondary-ink" icon={<ShieldIcon />}>
                    See the proof
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  )
}