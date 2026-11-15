import { Link } from 'react-router-dom'
import { ApiError } from '../api'
import { Button } from '../components/ui/Button'
import { ProofChart } from '../components/proof/ProofChart'
import { ProofCheckTiles } from '../components/proof/ProofCheckTiles'
import { useProof } from '../hooks/useProof'
import './ProofPage.css'

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

export function ProofPage() {
  const proofQuery = useProof()
  const pattern = proofQuery.data?.checks.pattern_match
  const monthMatch =
    pattern && typeof pattern.value === 'object' && pattern.value !== null
      ? (pattern.value as { month?: number }).month
      : undefined

  return (
    <div className="proof-page">
      <div className="content-page__surface proof-page__shell">
        <header className="proof-page__hero panel">
          <div className="proof-page__hero-main">
            <p className="eyebrow">Proof</p>
            <h1 className="content-display">How the long record lines up across satellites</h1>
            <p className="content-lede proof-page__lede">
              TerraFlame shows <strong>satellite hotspot detections</strong>, not a count of fires or
              burned area. The chart compares raw MODIS and VIIRS S-NPP with the harmonized series used
              in Explorer — converted counts with an uncertainty band.
            </p>
            <p className="proof-page__hero-link">
              <Link to="/about" className="text-link">
                Read the full method
                <ChevronRight />
              </Link>
            </p>
          </div>
          {pattern && !proofQuery.isLoading && !proofQuery.isError ? (
            <aside className="proof-page__spotlight" aria-label="Pattern match summary">
              <p className="eyebrow">Pattern match</p>
              <p className="proof-page__spotlight-stat">
                {monthMatch !== undefined ? monthMatch.toFixed(2) : '—'}
              </p>
              <p className="proof-page__spotlight-sentence">{pattern.sentence}</p>
              <p className="caption">National validation dataset</p>
            </aside>
          ) : null}
        </header>

        {proofQuery.isLoading ? (
          <p className="caption proof-page__status panel">Loading proof data…</p>
        ) : null}

        {proofQuery.isError ? (
          <p className="proof-page__error panel" role="alert">
            {proofQuery.error instanceof ApiError
              ? proofQuery.error.message
              : 'Could not load proof data.'}
          </p>
        ) : null}

        {proofQuery.data ? (
          <>
            <section className="proof-page__chart panel" aria-labelledby="proof-chart-title">
              <header className="proof-page__chart-head">
                <div id="proof-chart-title">
                  <h2 className="title-sm">National validation series</h2>
                  <p className="caption">
                    Monthly MODIS (raw), VIIRS S-NPP (raw), converted harmonized counts, and range band.
                  </p>
                </div>
              </header>
              <ProofChart series={proofQuery.data.series} height={380} />
            </section>

            <section className="proof-page__checks-wrap" aria-labelledby="proof-checks-title">
              <header className="proof-page__checks-head">
                <p id="proof-checks-title" className="eyebrow">
                  Validation checks
                </p>
                <p className="caption proof-page__checks-lede">
                  Five automated checks summarise how well the conversion behaves on held-out periods.
                </p>
              </header>
              <ProofCheckTiles checks={proofQuery.data.checks} />
            </section>

            <footer className="proof-page__footer panel">
              <p className="proof-page__footer-text">
                Ready to explore detections for your own area?
              </p>
              <Button to="/explorer" variant="primary">
                Open Explorer
              </Button>
            </footer>
          </>
        ) : null}
      </div>
    </div>
  )
}