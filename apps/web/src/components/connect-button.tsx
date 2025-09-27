'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { toast } from 'react-hot-toast'
import { useAuth } from '@/hooks/use-auth'
import { useAccount, useDisconnect, useChainId, useSwitchChain, useWalletClient } from 'wagmi'
import { useAppKit } from '@reown/appkit/react'
import { networks } from '@/config'
import { useWalletAuth } from '@/contexts/wallet-auth-context'
import { globalAuthManager } from '@/utils/global-auth-manager'

export function ConnectButton() {
  const { isAuthenticated, user, signInWithEthereum, signOut, isLoading } = useAuth()
  const { address, isConnected } = useAccount()
  const { disconnect } = useDisconnect()
  // Only get wallet client when actually connected
  const { data: walletClient } = useWalletClient({ 
    query: { 
      enabled: isConnected && !!address 
    } 
  })
  const { open, close } = useAppKit()
  const [modalIsOpen, setModalIsOpen] = useState(false)
  const chainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { isAuthInProgress, startAuth, finishAuth, cancelAuth } = useWalletAuth()
  const [mounted, setMounted] = useState(false)
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false)
  const [isDisconnecting, setIsDisconnecting] = useState(false)
  const [globalAuthState, setGlobalAuthState] = useState(false)
  const [recentlyDisconnected, setRecentlyDisconnected] = useState(false)
  const [wasConnectedBefore, setWasConnectedBefore] = useState(false)

  useEffect(() => {
    const checkModalState = () => {
      const modals = document.querySelectorAll('w3m-modal, appkit-modal, [data-testid="w3m-modal"]')
      const isOpen = modals.length > 0
      

      if (isOpen && isDisconnecting) {
        modals.forEach(modal => {
          if (modal instanceof HTMLElement) {
            modal.style.display = 'none'
            modal.remove()
          }
        })
        if (close) {
          close()
        }
        return
      }
      
      setModalIsOpen(isOpen)
    }
    
    checkModalState()
    
    const observer = new MutationObserver(checkModalState)
    observer.observe(document.body, { childList: true, subtree: true })
    
    return () => observer.disconnect()
  }, [isDisconnecting, recentlyDisconnected, close])

  useEffect(() => {
    setMounted(true)
    
    const unsubscribe = globalAuthManager.onAuthChange((changedAddress, isAuth) => {
      if (address && changedAddress === address.toLowerCase()) {
        setGlobalAuthState(isAuth)
      }
    })

    if (address) {
      const currentAuthState = globalAuthManager.isAuthenticated(address)
      setGlobalAuthState(currentAuthState)
    }

    return () => {
      unsubscribe()
    }
  }, [address])

  useEffect(() => {
    if (isConnected && address) {
      setWasConnectedBefore(true)
    } else if (!isConnected) {
      const timeoutId = setTimeout(() => {
        setWasConnectedBefore(false)
      }, 1000)
      return () => clearTimeout(timeoutId)
    }
  }, [isConnected, address])


  const isFullyAuthenticated = isConnected && (
    (isAuthenticated && user?.walletAddress?.toLowerCase() === address?.toLowerCase()) ||
    globalAuthState
  )
  
  const currentNetwork = useMemo(() => 
    networks.find(network => network.id === chainId) || networks[0],
    [chainId]
  )

  const handleAuthenticate = useCallback(async () => {
    // Early returns to prevent unnecessary calls
    if (!isConnected || !address || !mounted) {
      return
    }

    if (globalAuthManager.isAuthenticated(address)) {
      return
    }

    if (isFullyAuthenticated) {
      return
    }

    if (isDisconnecting || recentlyDisconnected) {
      return
    }

    const canStartAuth = await startAuth(address)
    if (!canStartAuth) {
      return
    }
    
    try {
      // Wait for wallet client if not available yet
      let attempts = 0
      while (!walletClient && attempts < 5) {
        await new Promise(resolve => setTimeout(resolve, 100))
        attempts++
      }

      const customSigner = async (message: string) => {
        if (!walletClient) {
          throw new Error('Wallet client not available after retries')
        }
        
        const signature = await walletClient.signMessage({
          message,
          account: address as `0x${string}`,
        })
        
        return signature
      }

      await signInWithEthereum(address, customSigner)
      finishAuth()
    } catch (error) {
      cancelAuth()
    }
  }, [isConnected, address, isFullyAuthenticated, signInWithEthereum, startAuth, finishAuth, cancelAuth, walletClient, mounted, isDisconnecting, recentlyDisconnected])

  // Auto authentication when wallet connects - with debounce
  useEffect(() => {
    if (!mounted || isDisconnecting || recentlyDisconnected || !isConnected || !address) {
      return
    }
    
    if (isFullyAuthenticated || isLoading || isAuthInProgress) {
      return
    }
    
    const timeoutId = setTimeout(() => {
      if (isConnected && address && !isDisconnecting && !recentlyDisconnected && !isFullyAuthenticated) {
        handleAuthenticate()
      }
    }, 200) // Increased delay to prevent rapid calls
      
    return () => clearTimeout(timeoutId)
  }, [mounted, isConnected, address, isFullyAuthenticated, isLoading, isAuthInProgress, isDisconnecting, recentlyDisconnected, handleAuthenticate])

  // Reset state on address change
  useEffect(() => {
    cancelAuth()
  }, [address, cancelAuth])

  // Auto logout on wallet disconnect with better state management
  useEffect(() => {
    if (!mounted || isDisconnecting || recentlyDisconnected || !wasConnectedBefore) {
      return
    }

    const wasAuthenticated = isAuthenticated || globalAuthState
    
    if (!isConnected && wasAuthenticated) {
      const timeoutId = setTimeout(async () => {
        // Double check state before cleanup
        if (!isConnected && !isDisconnecting && (isAuthenticated || globalAuthState)) {
          try {
            if (isAuthenticated) {
              await signOut()
            }
            
            globalAuthManager.clearAll()
            setGlobalAuthState(false)
            
            toast.success('Wallet disconnected - signed out automatically')
          } catch (error) {
            // Silent cleanup on error
            globalAuthManager.clearAll()
            setGlobalAuthState(false)
          }
        }
      }, 800) // Increased delay for stability
      
      return () => clearTimeout(timeoutId)
    }
  }, [isConnected, isAuthenticated, globalAuthState, signOut, mounted, isDisconnecting, recentlyDisconnected, wasConnectedBefore])

  const handleConnect = async () => {
    try {      
      if (!open) {
        toast.error('Wallet connection not initialized. Please check your WalletConnect Project ID.')
        return
      }
      
      setRecentlyDisconnected(false)
      setIsDisconnecting(false)
      
      if (modalIsOpen && close) {
        close()
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      cancelAuth()
      
      if (isConnected) {
        disconnect()
        await new Promise(resolve => setTimeout(resolve, 300))
      }
      
      await open()
      
      setTimeout(() => {
        const modal = document.querySelector('w3m-modal, appkit-modal, [data-testid="w3m-modal"]')
        
        if (modal) {

        } else {
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
      const errorDetails = error as Error
      const errorMessage = errorDetails?.message || (typeof error === 'string' ? error : 'Unknown error')
      toast.error(`Failed to open wallet connection: ${errorMessage}`)
    }
  }

  const handleDisconnect = async () => {
    try {
      setIsDisconnecting(true)
      setRecentlyDisconnected(true)
      setWasConnectedBefore(false)
      
      if (modalIsOpen && close) {
        close()
      }
      
      const modals = document.querySelectorAll('w3m-modal, appkit-modal, [data-testid="w3m-modal"]')
      modals.forEach(modal => {
        if (modal instanceof HTMLElement) {
          modal.style.display = 'none'
          modal.remove()
        }
      })
      
      cancelAuth()
      
      if (address) {
        globalAuthManager.clearAddress(address)
      } else {
        globalAuthManager.clearAll()
      }
      
      if (isFullyAuthenticated) {
        await signOut()
      }
    
      disconnect()
      
      toast.success('Wallet disconnected')
      
      setTimeout(() => {
        setIsDisconnecting(false)
      }, 200)
      
      setTimeout(() => {
        setRecentlyDisconnected(false)
      }, 500)
    } catch (error) {
      toast.error('Failed to disconnect')
      setIsDisconnecting(false)
      setRecentlyDisconnected(false)
    }
  }

  const handleNetworkSwitch = async (networkId: number) => {
    try {
      await switchChain({ chainId: networkId })
      setShowNetworkDropdown(false)
      toast.success(`Switched to ${networks.find(n => n.id === networkId)?.name}`)
    } catch (error) {
      toast.error('Failed to switch network')
    }
  }

  useEffect(() => {
    const handleClickOutside = () => setShowNetworkDropdown(false)
    if (showNetworkDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showNetworkDropdown])

  const getNetworkColor = (network: { id?: number }) => {
    switch (network?.id) {
      case 1: // Ethereum Mainnet
        return '#627EEA'
      case 8453: // Base Mainnet
        return '#0052FF'
      case 84532: // Base Sepolia
        return '#0052FF'
      case 137: // Polygon Mainnet
        return '#8247E5'
      case 10: // Optimism Mainnet
        return '#FF0420'
      case 42161: // Arbitrum One
        return '#28A0F0'
      case 324: // zkSync Era
        return '#3A7BD5'
      case 56: // BNB Smart Chain
        return '#F3BA2F'
      case 43114: // Avalanche C-Chain
        return '#E84142'
      default:
        return '#627EEA' // Default to Ethereum blue
    }
  }

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
            className="flex w-[180px] items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white/30 backdrop-blur-md dark:bg-black/30 text-gray-700 dark:text-gray-300 hover:border-orange-400 hover:text-orange-400 transition-all duration-300 font-light text-xs tracking-wide"
          >
            <div 
              className="w-4 h-4 rounded-full" 
              style={{ backgroundColor: getNetworkColor(currentNetwork) }}
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
                  <div 
                    className="w-4 h-4 rounded-full flex-shrink-0" 
                    style={{ backgroundColor: getNetworkColor(network) }}
                  />
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
        <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white/30 backdrop-blur-md dark:bg-black/30 text-gray-700 dark:text-gray-300">
          <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
          <span className="font-light text-xs tracking-wide">
            {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connected'}
          </span>
        </div>

        {/* Disconnect Button */}
        <button
          onClick={handleDisconnect}
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
        <div className="flex items-center gap-2 px-3 py-2 border border-orange-400 bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400">
          <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
          <span className="font-light text-xs tracking-wide">
            {isAuthInProgress ? 'Authenticating...' : 'Authentication Required'}
          </span>
        </div>
        <button
          onClick={handleDisconnect}
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
    >
      {isDisconnecting ? 'Disconnecting...' : 'Connect Wallet'}
    </button>
  )
}
