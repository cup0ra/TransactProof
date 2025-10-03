'use client'

import { createContext, useContext, useLayoutEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'transactproof-theme'
const THEME_COOKIE_KEY = 'theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Lazy init: executed once on first render (client side only logic guarded)
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'system'
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
      if (saved === 'light' || saved === 'dark' || saved === 'system') return saved
    } catch {}
    return 'system'
  })
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window === 'undefined') return 'dark'
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
      const mode = (saved && (saved === 'light' || saved === 'dark')) ? saved : 'system'
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      return mode === 'system' ? (systemDark ? 'dark' : 'light') : mode
    } catch {
      return 'dark'
    }
  })

  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'dark'
  }

  const updateResolvedTheme = (newTheme: Theme) => {
    const resolved = newTheme === 'system' ? getSystemTheme() : newTheme
    setResolvedTheme(resolved)
    
    if (typeof document !== 'undefined') {
      if (resolved === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      document.documentElement.style.colorScheme = resolved
    }
  }

  const persist = (key: string, value: string | null) => {
    try {
      if (value === null) {
        localStorage.removeItem(key)
      } else {
        localStorage.setItem(key, value)
      }
    } catch {}
    try {
      if (typeof document !== 'undefined') {
        if (value === null) {
          document.cookie = `${THEME_COOKIE_KEY}=; Max-Age=0; Path=/`;
        } else {
          // 1 year
          document.cookie = `${THEME_COOKIE_KEY}=${value}; Max-Age=31536000; Path=/; SameSite=Lax`;
        }
      }
    } catch {}
  }

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    updateResolvedTheme(newTheme)
    if (typeof window !== 'undefined') {
      if (newTheme === 'system') {
        persist(THEME_STORAGE_KEY, null)
        persist(THEME_COOKIE_KEY, null)
      } else {
        persist(THEME_STORAGE_KEY, newTheme)
        persist(THEME_COOKIE_KEY, newTheme)
      }
    }
  }

  // Apply theme before paint/hydration flash
  useLayoutEffect(() => {
    updateResolvedTheme(theme)
    // Listen system changes if user selected system
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = () => {
      if (theme === 'system') updateResolvedTheme('system')
    }
    // Modern + fallback
    // Some older browsers only support addListener/removeListener
    const mqAny = mediaQuery as unknown as { addListener?: (cb: () => void) => void; removeListener?: (cb: () => void) => void }
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange)
    } else if (mqAny.addListener) {
      mqAny.addListener(handleSystemThemeChange)
    }
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange)
      } else if (mqAny.removeListener) {
        mqAny.removeListener(handleSystemThemeChange)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme])


  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }


  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, resolvedTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}