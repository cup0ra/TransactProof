'use client'

import { Provider } from 'react-redux'
import { useEffect, ReactNode } from 'react'
import { store } from './index'
import { initializeAuth } from './authSlice'

interface ReduxProviderProps {
  children: ReactNode
}

export function ReduxProvider({ children }: ReduxProviderProps) {
  useEffect(() => {
    // Initialize auth on app startup
    store.dispatch(initializeAuth())
  }, [])

  return (
    <Provider store={store}>
      {children}
    </Provider>
  )
}