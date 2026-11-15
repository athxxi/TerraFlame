import type { ReactNode } from 'react'
import './InfoCallout.css'

type InfoCalloutVariant = 'info' | 'warning'

type InfoCalloutProps = {
  variant?: InfoCalloutVariant
  children: ReactNode
}

export function InfoCallout({ variant = 'info', children }: InfoCalloutProps) {
  return (
    <div
      className={`info-callout info-callout--${variant}`}
      role={variant === 'warning' ? 'note' : undefined}
    >
      <svg className="info-callout__icon" width="16" height="16" viewBox="0 0 16 16" aria-hidden>
        <circle cx="8" cy="8" r="7" fill="none" stroke="currentColor" strokeWidth="1.2" />
        <path fill="currentColor" d="M7.25 7h1.5v5h-1.5zm0-2.5h1.5V7h-1.5z" />
      </svg>
      <div className="info-callout__body">{children}</div>
    </div>
  )
}