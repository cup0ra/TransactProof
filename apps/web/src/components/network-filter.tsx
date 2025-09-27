'use client'

import { useState, useEffect } from 'react'
import { networks } from '@/config'

interface NetworkFilterProps {
  selectedChainId: number | null
  onChainIdChange: (chainId: number | null) => void
  availableNetworks?: number[]
  className?: string
}

export function NetworkFilter({ 
  selectedChainId, 
  onChainIdChange, 
  availableNetworks,
  className = '' 
}: NetworkFilterProps) {
  const [showDropdown, setShowDropdown] = useState(false)

  // Always show all networks unless specifically filtered
  const filteredNetworks = availableNetworks 
    ? networks.filter(network => availableNetworks.includes(network.id))
    : networks

  // Add "All Networks" option
  const networkOptions = [
    { id: null, name: 'All Networks' },
    ...filteredNetworks.map(network => ({
      id: network.id,
      name: network.name
    }))
  ]

  const selectedNetwork = networkOptions.find(option => option.id === selectedChainId)

  const getNetworkColor = (chainId: number | null) => {
    if (chainId === null) return '#f59e0b' // Orange for "All Networks"
    
    switch (chainId) {
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

  useEffect(() => {
    const handleClickOutside = () => setShowDropdown(false)
    if (showDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showDropdown])

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={(e) => {
          e.stopPropagation()
          setShowDropdown(!showDropdown)
        }}
        className="flex w-48 items-center gap-2 px-3 py-2 border border-gray-300 dark:border-gray-700 bg-white/30 backdrop-blur-md dark:bg-black/30 text-gray-700 dark:text-gray-300 hover:border-orange-400 hover:text-orange-400 transition-all duration-300 font-light text-xs tracking-wide"
      >
        <div 
          className="w-4 h-4 rounded-full" 
          style={{ backgroundColor: getNetworkColor(selectedChainId) }}
        />
        <span 
          className="text-xs font-medium flex-1 truncate" 
          title={selectedNetwork?.name || 'All Networks'}
        >
          {selectedNetwork?.name || 'All Networks'}
        </span>
        <svg 
          className={`w-4 h-4 ml-auto transition-transform ${showDropdown ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Network Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 mt-1 w-48 bg-white/30 backdrop-blur-md dark:bg-black/30 border border-gray-300 dark:border-gray-700 shadow-lg z-50">
          {networkOptions.map((option) => (
            <button
              key={option.id || 'all'}
              onClick={() => {
                onChainIdChange(option.id)
                setShowDropdown(false)
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors font-light text-xs tracking-wide ${
                option.id === selectedChainId ? 'bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              <div 
                className="w-4 h-4 rounded-full flex-shrink-0" 
                style={{ backgroundColor: getNetworkColor(option.id) }}
              />
              <span 
                className="flex-1 truncate" 
                title={option.name}
              >
                {option.name}
              </span>
              {option.id === selectedChainId && (
                <svg className="w-3 h-3 text-orange-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}