import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { toast } from 'react-hot-toast'
import { SiweMessage } from 'siwe'
import { getAddress } from 'ethers'
import { globalAuthManager } from '@/utils/global-auth-manager'

export interface User {
  walletAddress: string
  freeGenerationsRemaining?: number
  freeUntil?: string | null
}

export interface AuthResponse {
  walletAddress: string
  expiresAt: string
  refreshExpiresAt?: string
  freeGenerationsRemaining?: number
  freeUntil?: string | null
}

export interface AuthState {
  isAuthenticated: boolean
  user: User | null
  isLoading: boolean
  initialCheckDone: boolean
  error: string | null
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: false,
  initialCheckDone: false,
  error: null,
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// Async thunks
export const initializeAuth = createAsyncThunk(
  'auth/initialize',
  async () => {
    const response = await fetch(`${apiUrl}/api/auth/me`, {
      credentials: 'include',
    })
    
    if (response.ok) {
      const userData = await response.json()
      return userData
    } else if (response.status === 401) {
      throw new Error('Unauthorized')
    } else {
      throw new Error('Failed to initialize auth')
    }
  }
)



export const signInWithEthereum = createAsyncThunk(
  'auth/signInWithEthereum',
  async ({ 
    address, 
    customSigner 
  }: { 
    address: string
    customSigner: (message: string) => Promise<string>
  }) => {
    return globalAuthManager.getOrCreateAuthPromise(address, async () => {
      const checksumAddress = getAddress(address.toLowerCase())
      
      // Get nonce
      const nonceResponse = await fetch(`${apiUrl}/api/auth/nonce`, {
        method: 'GET',
        credentials: 'include',
      })

      if (!nonceResponse.ok) {
        throw new Error('Failed to get nonce')
      }

      const { nonce } = await nonceResponse.json()
      
      // Create SIWE message
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
      
      // Verify signature
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
  return authData
    })
  }
)

export const refreshAuth = createAsyncThunk(
  'auth/refreshAuth',
  async () => {
    const response = await fetch(`${apiUrl}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })

    if (response.ok) {
  const data: AuthResponse = await response.json()
  return data
    } else {
      throw new Error('Failed to refresh authentication')
    }
  }
)

export const signOut = createAsyncThunk(
  'auth/signOut',
  async () => {
    try {
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch (error) {
      // Silent fail on logout error
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Initialize Auth
      .addCase(initializeAuth.fulfilled, (state, action) => {
        state.user = {
          walletAddress: action.payload.walletAddress,
          freeGenerationsRemaining: action.payload.freeGenerationsRemaining,
          freeUntil: action.payload.freeUntil,
        }
        state.isAuthenticated = true
        state.initialCheckDone = true
        state.error = null
      })
      .addCase(initializeAuth.rejected, (state) => {
        state.isAuthenticated = false
        state.user = null
        state.initialCheckDone = true
        state.error = null // Don't show error for initial auth check
      })
      
      // Sign In
      .addCase(signInWithEthereum.pending, (state) => {
        state.isLoading = true
        state.error = null
      })
      .addCase(signInWithEthereum.fulfilled, (state, action) => {
        state.user = {
          walletAddress: action.payload.walletAddress,
          freeGenerationsRemaining: action.payload.freeGenerationsRemaining,
          freeUntil: action.payload.freeUntil,
        }
        state.isAuthenticated = true
        state.initialCheckDone = true
        state.isLoading = false
        state.error = null
        toast.success('Successfully signed in!')
      })
      .addCase(signInWithEthereum.rejected, (state, action) => {
        state.isLoading = false
        state.error = action.error.message || 'Authentication failed'
        toast.error(action.error.message || 'Authentication failed')
      })
      
      // Refresh Auth
      .addCase(refreshAuth.fulfilled, (state, action) => {
        state.user = {
          walletAddress: action.payload.walletAddress,
          freeGenerationsRemaining: action.payload.freeGenerationsRemaining,
          freeUntil: action.payload.freeUntil,
        }
        state.isAuthenticated = true
        state.error = null
      })
      .addCase(refreshAuth.rejected, (state) => {
        state.isAuthenticated = false
        state.user = null
        state.error = null
      })
      
      // Sign Out
      .addCase(signOut.fulfilled, (state) => {
        state.isAuthenticated = false
        state.user = null
        state.error = null
        toast.success('Signed out successfully')
      })
  },
})

export const { clearError } = authSlice.actions
export default authSlice.reducer