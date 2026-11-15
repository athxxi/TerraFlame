import { Outlet } from 'react-router-dom'
import { useSyncCatalogDates } from '../../hooks/useSyncCatalogDates'
import { TopBar } from './TopBar'
import { SiteFooter } from './SiteFooter'
import './AppShell.css'

export function AppShell() {
  useSyncCatalogDates()

  return (
    <div className="app-shell">
      <TopBar />
      <main className="app-shell__main">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}