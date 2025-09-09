'use client'

import { useEffect, useState } from 'react'
import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected, walletConnect } from 'wagmi/connectors'
import { toast } from 'react-hot-toast'

export function SimpleConnectButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, error, isPending } = useConnect()
  const { disconnect } = useDisconnect()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleConnect = async () => {
    try {
      // Сначала попробуем MetaMask/injected wallet
      const injectedConnector = connectors.find(c => c.type === 'injected')
      if (injectedConnector) {
        console.log('Connecting with injected connector:', injectedConnector)
        connect({ connector: injectedConnector })
      } else {
        console.log('No injected connector found, available connectors:', connectors)
        toast.error('No wallet found. Please install MetaMask or another Web3 wallet.')
      }
    } catch (error) {
      console.error('Connection error:', error)
      toast.error('Failed to connect wallet')
    }
  }

  const handleDisconnect = () => {
    disconnect()
    toast.success('Wallet disconnected')
  }

  if (!mounted) {
    return (
      <div className="animate-pulse">
        <div className="h-10 w-32 bg-gray-200 rounded-md"></div>
      </div>
    )
  }

  if (error) {
    console.error('Wallet connection error:', error)
  }

  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-black text-gray-700 dark:text-gray-300">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span className="font-light text-xs tracking-wide">
            {address.slice(0, 6)}...{address.slice(-4)}
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
      disabled={isPending}
      className="btn-primary-minimal text-xs"
    >
      {isPending ? 'Connecting...' : 'Connect Wallet (Simple)'}
    </button>
  )
}