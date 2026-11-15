import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import flameIcon from '../../assets/icons/flame.svg'
import moonIcon from '../../assets/icons/moon.svg'
import { DataFreshnessChip } from '../DataFreshnessChip'
import { useHealth } from '../../hooks/useHealth'
import { useThemeStore } from '../../lib/themeStore'
import './TopBar.css'

function SunIcon() {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" aria-hidden>
      <circle cx="8" cy="8" r="3.25" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        d="M8 1.2v1.5M8 13.3v1.5M1.2 8h1.5M13.3 8h1.5M3.05 3.05l1.06 1.06M11.9 11.9l1.06 1.06M3.05 12.95l1.06-1.06M11.9 4.1l1.06-1.06"
      />
    </svg>
  )
}

const navItems = [
  { to: '/explorer', label: 'Explorer' },
  { to: '/proof', label: 'Proof' },
  { to: '/about', label: 'About' },
] as const

export function TopBar() {
  const healthQuery = useHealth()
  const location = useLocation()
  const navigate = useNavigate()
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)
  const isDark = theme === 'dark'

  return (
    <header className="topbar">
      <div className="topbar__inner">
        <NavLink to="/" className="topbar__brand">
          <span className="topbar__logo" aria-hidden>
            <img src={flameIcon} alt="" width={20} height={20} />
          </span>
          <span className="topbar__title">TerraFlame</span>
        </NavLink>

        <div className="topbar__right">
          <DataFreshnessChip
            health={healthQuery.data}
            loading={healthQuery.isLoading}
            error={healthQuery.isError}
          />
          <label className="visually-hidden" htmlFor="topbar-section">
            Section
          </label>
          <select
            id="topbar-section"
            className="topbar__nav-mobile"
            value={location.pathname}
            onChange={(e) => navigate(e.target.value)}
            aria-label="Section"
          >
            <option value="/">Home</option>
            {navItems.map((item) => (
              <option key={item.to} value={item.to}>
                {item.label}
              </option>
            ))}
          </select>
          <nav className="topbar__nav" aria-label="Main">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `topbar__nav-link${isActive ? ' topbar__nav-link--active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <button
            type="button"
            className="topbar__theme"
            onClick={toggleTheme}
            aria-pressed={isDark}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <SunIcon /> : <img src={moonIcon} alt="" width={16} height={16} />}
          </button>
        </div>
      </div>
    </header>
  )
}