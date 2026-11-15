import type { ProofResponse } from '../../api'
import './ProofCheckTiles.css'

const CHECK_ORDER: (keyof ProofResponse['checks'])[] = [
  'pattern_match',
  'typical_difference',
  'busiest_months',
  'gap_closed',
  'peak_season',
]

const CHECK_TITLES: Record<keyof ProofResponse['checks'], string> = {
  pattern_match: 'Pattern match',
  typical_difference: 'Typical difference',
  busiest_months: 'Busiest months',
  gap_closed: 'Gap closed',
  peak_season: 'Peak season',
}

type Props = {
  checks: ProofResponse['checks']
}

function CheckCard({
  id,
  title,
  sentence,
  featured,
}: {
  id: string
  title: string
  sentence: string
  featured?: boolean
}) {
  return (
    <article
      className={`proof-check panel${featured ? ' proof-check--featured' : ''}`}
      data-check={id}
    >
      <p className="eyebrow">{title}</p>
      <p className="proof-check__sentence">{sentence}</p>
    </article>
  )
}

export function ProofCheckTiles({ checks }: Props) {
  const [featuredKey, ...restKeys] = CHECK_ORDER
  const featured = checks[featuredKey]

  return (
    <div className="proof-checks">
      <CheckCard
        id={featuredKey}
        title={CHECK_TITLES[featuredKey]}
        sentence={featured.sentence}
        featured
      />
      <div className="proof-checks__grid">
        {restKeys.map((key) => (
          <CheckCard
            key={key}
            id={key}
            title={CHECK_TITLES[key]}
            sentence={checks[key].sentence}
          />
        ))}
      </div>
    </div>
  )
}