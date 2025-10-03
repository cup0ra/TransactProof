'use client'

import { Provider } from 'react-redux'
import { useEffect, ReactNode, useRef } from 'react'
import { store } from './index'
import { initializeAuth } from './authSlice'

interface ReduxProviderProps {
  children: ReactNode
}

export function ReduxProvider({ children }: ReduxProviderProps) {
  const didInitRef = useRef(false)

  useEffect(() => {
    // В режиме разработки React 18 StrictMode дважды монтирует компонент (effect cleanup + повторный запуск)
    // что приводит к двойному запросу /api/auth/me. Используем ref, чтобы гарантировать один dispatch.
    if (!didInitRef.current) {
      didInitRef.current = true
      store.dispatch(initializeAuth())
    }
  }, [])

  return (
    <Provider store={store}>
      {children}
    </Provider>
  )
}