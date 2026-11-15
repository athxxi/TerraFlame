import { NavLink } from 'react-router-dom'
import './SiteFooter.css'

const footerLinks = [
  { to: '/explorer', label: 'Explorer' },
  { to: '/proof', label: 'Proof' },
  { to: '/about', label: 'About' },
] as const

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <p>© 2026 TerraFlame. All rights reserved.</p>
        <nav className="site-footer__nav" aria-label="Site">
          {footerLinks.map((item) => (
            <NavLink key={item.to} to={item.to} className="site-footer__link">
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </footer>
  )
}