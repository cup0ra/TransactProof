"use client"

import { useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/hooks/use-auth'
import { useAccount, useDisconnect, useChainId, useSwitchChain, useWalletClient } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'
import { networks } from '@/config'
import { useWalletAuth } from '@/contexts/wallet-auth-context'
import { globalAuthManager } from '@/utils/global-auth-manager'
import { resetAuth } from '@/store/authSlice'

// --- Helpers -----------------------------------------------------------------

const NETWORK_COLOR_MAP: Record<number, string> = {
  1: '#627EEA', // Ethereum Mainnet
  8453: '#0052FF', // Base Mainnet
  84532: '#0052FF', // Base Sepolia
  137: '#8247E5', // Polygon Mainnet
  10: '#FF0420', // Optimism Mainnet
  42161: '#28A0F0', // Arbitrum One
  324: '#3A7BD5', // zkSync Era
  56: '#F3BA2F', // BNB Smart Chain
  43114: '#E84142' // Avalanche C-Chain
}

const getNetworkColor = (id?: number) => (id ? NETWORK_COLOR_MAP[id] || '#627EEA' : '#627EEA')

// Safe query selector for wallet modals (kept centralized)
const queryWalletModals = () => document.querySelectorAll('w3m-modal, appkit-modal, [data-testid="w3m-modal"]')

// Remove any lingering modals (defensive cleanup)
const removeWalletModals = (hideOnly = false) => {
  const modals = queryWalletModals()
  modals.forEach(modal => {
    if (modal instanceof HTMLElement) {
      modal.style.display = 'none'
      if (!hideOnly) modal.remove()
    }
  })
}

export function ConnectButton() {
  // Auth & wallet state
  const { isAuthenticated, user, signInWithEthereum, signOut, isLoading } = useAuth()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: walletClient } = useWalletClient({
    query: { enabled: isConnected && !!address }
  })
  const { open, close } = useAppKit()
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { isAuthInProgress, startAuth, finishAuth, cancelAuth } = useWalletAuth()

  // Local UI state
  const [mounted, setMounted] = useState(false)
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [globalAuthState, setGlobalAuthState] = useState(false)
  const [modalIsOpen, setModalIsOpen] = useState(false)

  // Refs for timers to ensure cleanup
  const authTimeoutRef = useRef<number | null>(null)
  const disconnectResetRef = useRef<number | null>(null)
  const connectModalFallbackRef = useRef<number | null>(null)

  // Observe wallet modal presence
  useEffect(() => {
    const checkModalState = () => {
      const isOpen = queryWalletModals().length > 0
      if (isOpen && isDisconnecting) {
        removeWalletModals()
        close?.()
        return
      }
      setModalIsOpen(isOpen)
    }
    checkModalState()
    const observer = new MutationObserver(checkModalState)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => observer.disconnect()
  }, [isDisconnecting, close])

  // Initial mount + global auth sync
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const unsubscribe = globalAuthManager.onAuthChange((changedAddress, isAuth) => {
      if (address && changedAddress === address.toLowerCase()) {
        setGlobalAuthState(isAuth)
      }
    })
    if (address) setGlobalAuthState(globalAuthManager.isAuthenticated(address))
    return () => unsubscribe()
  }, [address])

  // Dev-only tracing (kept but silent in production)
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
  }


  const isFullyAuthenticated = isConnected && ((
    isAuthenticated && user?.walletAddress?.toLowerCase() === address?.toLowerCase()) || globalAuthState)
  
  const currentNetwork = useMemo(() => 
    networks.find(network => network.id === chainId) || networks[0],
    [chainId]
  )

  const handleAuthenticate = useCallback(async () => {
    if (!isConnected || !address || !mounted || isDisconnecting) return
    if (globalAuthManager.isAuthenticated(address)) return
    const canStart = await startAuth(address)
    if (!canStart) return
    try {
      // Retry wallet client retrieval (lightweight backoff)
      for (let attempts = 0; !walletClient && attempts < 5; attempts++) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise(r => setTimeout(r, 100))
      }
      if (!walletClient) throw new Error('Wallet client not available after retries')
      const customSigner = async (message: string) => walletClient.signMessage({
        message,
        account: address as `0x${string}`
      })
      await signInWithEthereum(address, customSigner)
      finishAuth()
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        // eslint-disable-next-line no-console
        console.log('Authentication failed:', error)
      }
      resetAuth()
      disconnect()
    }
  }, [isConnected, address, mounted, isDisconnecting, walletClient, startAuth, signInWithEthereum, finishAuth, disconnect])

  // Auto authentication when wallet connects - with debounce
  // Debounced auto-auth
  useEffect(() => {
    if (!mounted || isDisconnecting || !isConnected || !address) return
    if (isFullyAuthenticated || isLoading || isAuthInProgress) return
    authTimeoutRef.current && window.clearTimeout(authTimeoutRef.current)
    authTimeoutRef.current = window.setTimeout(() => {
      if (isConnected && address && !isDisconnecting && !isFullyAuthenticated) {
        handleAuthenticate()
      }
    }, 220) // Slightly increased for stability
    return () => {
      if (authTimeoutRef.current) window.clearTimeout(authTimeoutRef.current)
    }
  }, [mounted, isDisconnecting, isConnected, address, isFullyAuthenticated, isLoading, isAuthInProgress, handleAuthenticate])

  // Reset state on address change
  useEffect(() => { cancelAuth() }, [address, cancelAuth])

  // Auto logout on wallet disconnect with better state management
  // Auto logout on wallet disconnect
  useEffect(() => {
    if (!mounted || isDisconnecting) return
    const wasAuthenticated = isAuthenticated || globalAuthState
    if (isConnected || !wasAuthenticated) return
    const timeoutId = window.setTimeout(async () => {
      if (isConnected || isDisconnecting || !(isAuthenticated || globalAuthState)) return
      try {
        if (isAuthenticated) await signOut()
        globalAuthManager.clearAll()
        setGlobalAuthState(false)
        toast.success('Wallet disconnected - signed out automatically')
      } catch {
        globalAuthManager.clearAll()
        setGlobalAuthState(false)
      }
    }, 800)
    return () => window.clearTimeout(timeoutId)
  }, [mounted, isDisconnecting, isConnected, isAuthenticated, globalAuthState, signOut])

  const handleConnect = async () => {
    try {
      await open()
      // Fallback if modal didn't render
      connectModalFallbackRef.current = window.setTimeout(() => {
        if (queryWalletModals().length === 0) {
          const manualModal = document.createElement('w3m-modal')
            manualModal.style.position = 'fixed'
            manualModal.style.zIndex = '99999'
            manualModal.style.top = '0'
            manualModal.style.left = '0'
            manualModal.style.width = '100%'
            manualModal.style.height = '100%'
            manualModal.style.background = 'rgba(0,0,0,0.5)'
            document.body.appendChild(manualModal)
          toast.error('Wallet modal failed to open. Please try again or check browser console.')
        }
      }, 500)
    } catch (error) {
      const errorMessage = (error as Error)?.message || (typeof error === 'string' ? error : 'Unknown error')
      toast.error(`Failed to open wallet connection: ${errorMessage}`)
    }
  }

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true)
      if (modalIsOpen) close?.()
      removeWalletModals()
      cancelAuth()
      if (address) globalAuthManager.clearAddress(address)
      else globalAuthManager.clearAll()
      if (isFullyAuthenticated) await signOut()
      disconnect()
      toast.success('Wallet disconnected')
    } catch {
      toast.error('Failed to disconnect')
    } finally {
      disconnectResetRef.current = window.setTimeout(() => setIsDisconnecting(false), 180)
    }
  }

  const handleNetworkSwitch = async (networkId: number) => {
    try {
      await switchChain({ chainId: networkId })
      setShowNetworkDropdown(false)
      const name = networks.find(n => n.id === networkId)?.name || 'network'
      toast.success(`Switched to ${name}`)
    } catch {
      toast.error('Failed to switch network')
    }
  }

  useEffect(() => {
    if (!showNetworkDropdown) return
    const handleClickOutside = () => setShowNetworkDropdown(false)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showNetworkDropdown])

  // Cleanup outstanding timers on unmount
  useEffect(() => {
    return () => {
      if (authTimeoutRef.current) window.clearTimeout(authTimeoutRef.current)
      if (disconnectResetRef.current) window.clearTimeout(disconnectResetRef.current)
  if (connectModalFallbackRef.current) window.clearTimeout(connectModalFallbackRef.current)
    }
  }, [])

  if (!mounted) {
    return (
      <div className="animate-pulse">
        <div className="h-10 w-32 bg-gray-200 rounded-md"></div>
      </div>
    )
  }

  if (isConnected && isFullyAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        {/* Network Selector */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowNetworkDropdown(!showNetworkDropdown)
            }}
            aria-haspopup="listbox"
            aria-expanded={showNetworkDropdown}
            className="flex w-[180px] items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white/30 backdrop-blur-md dark:bg-black/30 text-gray-700 dark:text-gray-300 hover:border-orange-400 hover:text-orange-400 transition-all duration-300 font-light text-xs tracking-wide"
          >
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: getNetworkColor(currentNetwork?.id) }}
            />
            <span 
              className="text-sm font-medium flex-1 truncate" 
              title={currentNetwork?.name}
            >
              {currentNetwork?.name}
            </span>
            <svg 
              className={`w-4 h-4 ml-auto transition-transform ${showNetworkDropdown ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Network Dropdown */}
          {showNetworkDropdown && (
            <div className="absolute w-[180px] top-full left-0 mt-1 bg-white/30 backdrop-blur-md dark:bg-black/30 border border-gray-300 dark:border-gray-700 shadow-lg z-50">
              {networks.map((network) => (
                <button
                  key={network.id}
                  onClick={() => handleNetworkSwitch(network.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors font-light text-xs tracking-wide ${
                    network.id === chainId ? 'bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: getNetworkColor(network.id) }} />
                  <span 
                    className="flex-1 truncate" 
                    title={network.name}
                  >
                    {network.name}
                  </span>
                  {network.id === chainId && (
                    <svg className="w-3 h-3 text-orange-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white/30 backdrop-blur-md dark:bg-black/30 text-gray-700 dark:text-gray-300" aria-label="Connected wallet address">
          <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
          <span className="font-light text-xs tracking-wide">
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
          </span>
        </div>

        {/* Disconnect Button */}
        <button
          onClick={handleDisconnect}
          aria-label="Disconnect wallet"
          className="px-3 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-orange-400 hover:text-orange-400 transition-all duration-300 font-light text-xs tracking-wide"
        >
          Disconnect
        </button>
      </div>
    )
  }

  if (isConnected && !isFullyAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 border border-orange-400 bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400" aria-live="polite">
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
          <span className="font-light text-xs tracking-wide">
            {isAuthInProgress ? 'Authenticating...' : 'Authentication Required'}
          </span>
        </div>
        <button
          onClick={handleDisconnect}
          aria-label="Disconnect wallet"
          className="px-3 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-orange-400 hover:text-orange-400 transition-all duration-300 font-light text-xs tracking-wide"
        >
          Disconnect
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleConnect}
      className="btn-primary-minimal text-xs"
      disabled={isDisconnecting}
      aria-busy={isDisconnecting}
      aria-label={isDisconnecting ? 'Disconnecting' : 'Connect Wallet'}
    >
      {isDisconnecting ? 'Disconnecting...' : 'Connect Wallet'}
    </button>
  )
}
