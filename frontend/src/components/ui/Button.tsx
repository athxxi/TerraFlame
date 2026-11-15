import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import './Button.css'

type ButtonVariant = 'primary' | 'secondary' | 'secondary-ink'

type CommonProps = {
  children: ReactNode
  variant?: ButtonVariant
  className?: string
  icon?: ReactNode
}

type ButtonAsButton = CommonProps & {
  to?: undefined
  onClick?: () => void
  type?: 'button' | 'submit'
  disabled?: boolean
}

type ButtonAsLink = CommonProps & {
  to: string
}

export function Button(props: ButtonAsButton | ButtonAsLink) {
  const { children, variant = 'primary', className = '', icon } = props
  const classes = `btn btn--${variant} ${className}`.trim()

  const inner = (
    <>
      {icon ? <span className="btn__icon">{icon}</span> : null}
      <span>{children}</span>
    </>
  )

  if ('to' in props && props.to !== undefined) {
    return (
      <Link to={props.to} className={classes}>
        {inner}
      </Link>
    )
  }

  const { onClick, type = 'button', disabled } = props as ButtonAsButton
  return (
    <button type={type} className={classes} onClick={onClick} disabled={disabled}>
      {inner}
    </button>
  )
}