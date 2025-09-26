'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { SiweMessage } from 'siwe'
import { getAddress } from 'ethers'
import { globalAuthManager } from '@/utils/global-auth-manager'

interface User {
  walletAddress: string
}

interface AuthResponse {
  walletAddress: string
  expiresAt: string
  refreshExpiresAt?: string
}

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  isLoading: boolean
  initialCheckDone: boolean
  signInWithEthereum: (address: string, customSigner: (message: string) => Promise<string>) => Promise<AuthResponse>
  signOut: () => Promise<void>
  checkAuth: () => Promise<void>
  refreshAuth: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [initialCheckDone, setInitialCheckDone] = useState(false)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  useEffect(() => {
    const initializeAuth = async () => {      
      try {
        const response = await fetch(`${apiUrl}/api/auth/me`, {
          credentials: 'include',
        })
        
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
          setIsAuthenticated(true)
        } else if (response.status === 401) {
          setIsAuthenticated(false)
          setUser(null)
        } else {
          setIsAuthenticated(false)
          setUser(null)
        }
      } catch (error) {
        console.error('Auth error:', error)
        setIsAuthenticated(false)
        setUser(null)
      } finally {
        setInitialCheckDone(true)
      }
    }

    initializeAuth()
  }, [apiUrl])

  const checkAuth = useCallback(async () => {
    if (isLoading) {
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch(`${apiUrl}/api/auth/me`, {
        credentials: 'include',
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
        setUser(null)
      }
    } catch (error) {
      setIsAuthenticated(false)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [apiUrl, isLoading])

  const signInWithEthereum = async (address: string, customSigner: (message: string) => Promise<string>) => {
    return globalAuthManager.getOrCreateAuthPromise(address, async () => {
      if (isLoading) {
        throw new Error('Authentication already in progress')
      }

      setIsLoading(true)
      try {
        const checksumAddress = getAddress(address.toLowerCase())
        const nonceResponse = await fetch(`${apiUrl}/api/auth/nonce`, {
          method: 'GET',
          credentials: 'include',
        })

        if (!nonceResponse.ok) {
          throw new Error('Failed to get nonce')
        }

        const { nonce } = await nonceResponse.json()
        const siweMessage = new SiweMessage({
          domain: window.location.host,
          address: checksumAddress,
          statement: 'Sign in to TransactProof to generate PDF receipts',
          uri: window.location.origin,
          version: '1',
          chainId: Number(process.env.NEXT_PUBLIC_BASE_CHAIN_ID || 84532),
          nonce: nonce,
          issuedAt: new Date().toISOString(),
          expirationTime: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
        })

        const message = siweMessage.prepareMessage()
        const signature = await customSigner(message)
        const verifyResponse = await fetch(`${apiUrl}/api/auth/verify`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({
            message,
            signature,
          }),
        })

        if (!verifyResponse.ok) {
          const error = await verifyResponse.json()
          throw new Error(error.message || 'Authentication failed')
        }

        const authData: AuthResponse = await verifyResponse.json()
        
        setUser({ walletAddress: authData.walletAddress })
        setIsAuthenticated(true)
        setInitialCheckDone(true)
        
        toast.success('Successfully signed in!')
        
        return authData
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Authentication failed'
        toast.error(errorMessage)
        throw error
      } finally {
        setIsLoading(false)
      }
    })
  }

  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${apiUrl}/api/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        setUser({ walletAddress: data.walletAddress })
        setIsAuthenticated(true)
        return true
      } else {
        setIsAuthenticated(false)
        setUser(null)
        return false
      }
    } catch (error) {
      setIsAuthenticated(false)
      setUser(null)
      return false
    }
  }, [apiUrl])

  const signOut = async () => {
    try {
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      // Silent fail on logout error
    } finally {
      setIsAuthenticated(false)
      setUser(null)
      toast.success('Signed out successfully')
    }
  }

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isLoading,
        initialCheckDone,
        signInWithEthereum,
        signOut,
        checkAuth,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
