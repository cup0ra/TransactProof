'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'transactproof-theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('dark')
  const [mounted, setMounted] = useState(false)

  // Определяем системную тему
  const getSystemTheme = (): 'light' | 'dark' => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    return 'dark'
  }

  // Обновляем resolved theme
  const updateResolvedTheme = (newTheme: Theme) => {
    const resolved = newTheme === 'system' ? getSystemTheme() : newTheme
    setResolvedTheme(resolved)
    
    // Применяем dark class к документу
    if (typeof document !== 'undefined') {
      if (resolved === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }
  }

  // Устанавливаем тему
  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    updateResolvedTheme(newTheme)
    
    // Сохраняем в localStorage
    if (typeof window !== 'undefined') {
      if (newTheme === 'system') {
        localStorage.removeItem(THEME_STORAGE_KEY)
      } else {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme)
      }
    }
  }

  // Инициализация при монтировании
  useEffect(() => {
    // Получаем текущее состояние темы из DOM (уже установленное скриптом)
    const isDarkFromDOM = document.documentElement.classList.contains('dark')
    const savedTheme = typeof window !== 'undefined' 
      ? localStorage.getItem(THEME_STORAGE_KEY) as Theme
      : null
    
    const initialTheme = savedTheme || 'system'
    const initialResolvedTheme = initialTheme === 'system' ? getSystemTheme() : initialTheme
    
    setThemeState(initialTheme)
    setResolvedTheme(initialResolvedTheme)
    setMounted(true)

    // Слушаем изменения системной темы
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleSystemThemeChange = () => {
      if (theme === 'system') {
        updateResolvedTheme('system')
      }
    }

    mediaQuery.addEventListener('change', handleSystemThemeChange)
    return () => mediaQuery.removeEventListener('change', handleSystemThemeChange)
  }, [])

  // Обновляем resolved theme при изменении theme (но только после монтирования)
  useEffect(() => {
    if (mounted) {
      updateResolvedTheme(theme)
    }
  }, [theme, mounted])

  // Функция для переключения темы по циклу: light -> dark -> system -> light
  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  // Предотвращаем flash of incorrect theme
  if (!mounted) {
    return <div className="contents">{children}</div>
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