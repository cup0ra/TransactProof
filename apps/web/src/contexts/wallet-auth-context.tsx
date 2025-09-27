'use client'

import { createContext, useContext, useState, useCallback, ReactNode, useRef } from 'react'

interface WalletAuthContextType {
  isAuthInProgress: boolean
  startAuth: (address: string) => Promise<boolean>
  finishAuth: () => void
  cancelAuth: () => void
}

const WalletAuthContext = createContext<WalletAuthContextType | undefined>(undefined)

export function WalletAuthProvider({ children }: { children: ReactNode }) {
  const [isAuthInProgress, setIsAuthInProgress] = useState(false)
  const currentAuthAddress = useRef<string | null>(null)

  const startAuth = useCallback(async (address: string): Promise<boolean> => {
    
    if (isAuthInProgress && currentAuthAddress.current === address) {
      return false
    }
    
    if (isAuthInProgress && currentAuthAddress.current !== address) {
      return false
    }
    
    setIsAuthInProgress(true)
    currentAuthAddress.current = address
    return true
  }, [isAuthInProgress])

  const finishAuth = useCallback(() => {
    setIsAuthInProgress(false)
    currentAuthAddress.current = null
  }, [])

  const cancelAuth = useCallback(() => {
    setIsAuthInProgress(false)
    currentAuthAddress.current = null
  }, [])

  return (
    <WalletAuthContext.Provider value={{ isAuthInProgress, startAuth, finishAuth, cancelAuth }}>
      {children}
    </WalletAuthContext.Provider>
  )
}

export function useWalletAuth() {
  const context = useContext(WalletAuthContext)
  if (context === undefined) {
    throw new Error('useWalletAuth must be used within a WalletAuthProvider')
  }
  return context
}