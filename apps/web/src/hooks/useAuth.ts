import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux'
import { RootState, AppDispatch } from '@/store'
import { 
  signInWithEthereum, 
  signOut, 
  initializeAuth, 
  refreshAuth,
  clearError 
} from '@/store/authSlice'

// Typed hooks for Redux
export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector

// Auth hook that replaces the old useAuth
export const useAuth = () => {
  const dispatch = useAppDispatch()
  const auth = useAppSelector((state) => state.auth)

  const handleSignInWithEthereum = async (
    address: string, 
    customSigner: (message: string) => Promise<string>
  ) => {
    const result = await dispatch(signInWithEthereum({ address, customSigner }))
    if (signInWithEthereum.fulfilled.match(result)) {
      return result.payload
    }
    throw new Error(result.error?.message || 'Authentication failed')
  }

  const handleSignOut = async () => {
    await dispatch(signOut())
  }

  const handleCheckAuth = async () => {
    await dispatch(initializeAuth())
  }

  const handleRefreshAuth = async (): Promise<boolean> => {
    const result = await dispatch(refreshAuth())
    return refreshAuth.fulfilled.match(result)
  }

  const clearAuthError = () => {
    dispatch(clearError())
  }

  return {
    isAuthenticated: auth.isAuthenticated,
    user: auth.user,
    isLoading: auth.isLoading,
    initialCheckDone: auth.initialCheckDone,
    error: auth.error,
    signInWithEthereum: handleSignInWithEthereum,
    signOut: handleSignOut,
    checkAuth: handleCheckAuth,
    refreshAuth: handleRefreshAuth,
    clearError: clearAuthError,
  }
}