import { create } from 'zustand'
import { applyTheme, initTheme, type Theme } from './theme'

type ThemeStore = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const bootTheme = initTheme()

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: bootTheme,
  setTheme: (theme) => {
    applyTheme(theme)
    set({ theme })
  },
  toggleTheme: () => {
    const next = get().theme === 'dark' ? 'light' : 'dark'
    get().setTheme(next)
  },
}))