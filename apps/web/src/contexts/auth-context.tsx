'use client'

import { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react'
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
}

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  isLoading: boolean
  initialCheckDone: boolean
  signInWithEthereum: (address: string, customSigner?: (message: string) => Promise<string>) => Promise<AuthResponse>
  signOut: () => Promise<void>
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Глобальный singleton для предотвращения множественных инициализаций
class AuthInitManager {
  private static instance: AuthInitManager | null = null
  private initPromise: Promise<any> | null = null
  private isInitialized = false
  
  static getInstance(): AuthInitManager {
    if (!AuthInitManager.instance) {
      AuthInitManager.instance = new AuthInitManager()
    }
    return AuthInitManager.instance
  }

  async initialize(initFn: () => Promise<any>): Promise<any> {
    if (this.isInitialized) {
      return
    }

    if (this.initPromise) {
      return this.initPromise
    }

    this.initPromise = initFn()
    
    try {
      const result = await this.initPromise
      this.isInitialized = true
      return result
    } finally {
      this.initPromise = null
    }
  }

  reset() {
    this.isInitialized = false
    this.initPromise = null
  }
}

const authInitManager = AuthInitManager.getInstance()

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [initialCheckDone, setInitialCheckDone] = useState(false)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

  // Единственный useEffect для инициализации
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
        } else {
          setIsAuthenticated(false)
          setUser(null)
        }
      } catch (error) {
        setIsAuthenticated(false)
        setUser(null)
      } finally {
        setInitialCheckDone(true)
      }
    }

    // Используем глобальный менеджер для предотвращения дублирования
    authInitManager.initialize(initializeAuth)
  }, [])

  const checkAuth = useCallback(async () => {
    // Предотвращаем дублирование если уже идет проверка
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

  const signInWithEthereum = async (address: string, customSigner?: (message: string) => Promise<string>) => {
    // Используем глобальный менеджер для предотвращения дублирования
    return globalAuthManager.getOrCreateAuthPromise(address, async () => {
      // Предотвращаем множественные попытки входа
      if (isLoading) {
        throw new Error('Authentication already in progress')
      }

      setIsLoading(true)
      try {
        // 1. Приводим адрес к checksum формату
        const checksumAddress = getAddress(address.toLowerCase())
        
        // 2. Получаем nonce
        const nonceResponse = await fetch(`${apiUrl}/api/auth/nonce`, {
          method: 'GET',
          credentials: 'include',
        })

        if (!nonceResponse.ok) {
          throw new Error('Failed to get nonce')
        }

        const { nonce } = await nonceResponse.json()

        // 3. Создаем SIWE сообщение
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

        // 4. Подписываем сообщение
        let signature: string
        
        if (customSigner) {
          // Используем переданную функцию подписи (например, WalletConnect)
          signature = await customSigner(message)
        } else {
          // Используем MetaMask через window.ethereum (если доступен)
          if (typeof window !== 'undefined' && (window as any).ethereum) {
            signature = await (window as any).ethereum.request({
              method: 'personal_sign',
              params: [message, checksumAddress],
            })
          } else {
            throw new Error('Wallet not found')
          }
        }

        // 5. Отправляем на сервер для верификации
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
        
        // 6. Обновляем состояние
        setUser({ walletAddress: authData.walletAddress })
        setIsAuthenticated(true)
        setInitialCheckDone(true)
        
        toast.success('Successfully signed in!')
        
        return authData
      } catch (error: any) {
        toast.error(error.message || 'Authentication failed')
        throw error
      } finally {
        setIsLoading(false)
      }
    })
  }

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
      // Сбрасываем состояние глобального менеджера
      authInitManager.reset()
      // Очищаем глобальный менеджер аутентификации
      globalAuthManager.clearAll()
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
