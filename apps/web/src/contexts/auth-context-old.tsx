'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { toast } from 'react-hot-toast'
import { SiweMessage } from 'siwe'
import { getAddress } from 'ethers'

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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [initialCheckDone, setInitialCheckDone] = useState(false)
  const [initInProgress, setInitInProgress] = useState(false) // Новый флаг

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

  // Инициализация - проверяем авторизацию при загрузке
  useEffect(() => {
    let isMounted = true
    
    const initAuth = async () => {
      // Предотвращаем множественные запросы
      if (initInProgress || initialCheckDone) {
        console.log('Auth init skipped - already in progress or done')
        return
      }

      console.log('Starting auth initialization')
      setInitInProgress(true)
      
      try {
        const response = await fetch(`${apiUrl}/api/auth/me`, {
          credentials: 'include',
        })

        if (isMounted) {
          if (response.ok) {
            const userData = await response.json()
            setUser(userData)
            setIsAuthenticated(true)
            console.log('Auth init successful:', userData)
          } else {
            setIsAuthenticated(false)
            setUser(null)
            console.log('Auth init - no valid session')
          }
          setInitialCheckDone(true)
        }
      } catch (error) {
        console.error('Auth init error:', error)
        if (isMounted) {
          setIsAuthenticated(false)
          setUser(null)
          setInitialCheckDone(true)
        }
      } finally {
        if (isMounted) {
          setInitInProgress(false)
        }
      }
    }

    initAuth()

    return () => {
      isMounted = false
    }
  }, [apiUrl]) // Убираем initialCheckDone и initInProgress из зависимостей

  // Отслеживаем изменения аккаунта - теперь это будет делать Wagmi
  useEffect(() => {
    // Очистим эту логику, так как Wagmi будет управлять подключениями
  }, [isAuthenticated, user])

  const checkAuth = async () => {
    // Предотвращаем дублирование если уже идет проверка
    if (isLoading || initInProgress) {
      console.log('checkAuth skipped - already in progress')
      return
    }

    console.log('Manual auth check started')
    setIsLoading(true)
    
    try {
      const response = await fetch(`${apiUrl}/api/auth/me`, {
        credentials: 'include',
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        setIsAuthenticated(true)
        console.log('Manual auth check successful:', userData)
      } else {
        setIsAuthenticated(false)
        setUser(null)
        console.log('Manual auth check - no valid session')
      }
      setInitialCheckDone(true)
    } catch (error) {
      console.error('Manual auth check error:', error)
      setIsAuthenticated(false)
      setUser(null)
      setInitialCheckDone(true)
    } finally {
      setIsLoading(false)
    }
  }

  const signInWithEthereum = async (address: string, customSigner?: (message: string) => Promise<string>) => {
    // Предотвращаем множественные попытки входа
    if (isLoading) {
      console.log('signInWithEthereum skipped - already in progress')
      throw new Error('Authentication already in progress')
    }

    console.log('SIWE authentication started for:', address)
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
        chainId: 84532, // Base Sepolia
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