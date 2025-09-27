'use client'

import { useState, useEffect } from 'react'
import { useAccount, useChainId, usePublicClient } from 'wagmi'
import { formatEther } from 'viem'

export function useETHBalance() {
  const [balance, setBalance] = useState<string>('0')
  const [isLoading, setIsLoading] = useState(false)
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()

  useEffect(() => {
    async function fetchBalance() {
      if (!isConnected || !address || !publicClient) {
        setBalance('0')
        return
      }

      try {
        setIsLoading(true)
        const balanceRaw = await publicClient.getBalance({
          address: address,
        })

        const formattedBalance = formatEther(balanceRaw)
        setBalance(formattedBalance)
      } catch (error) {
        setBalance('0')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBalance()
  }, [isConnected, address, publicClient, chainId])

  const hasInsufficientBalance = (requiredAmount: number): boolean => {
    const balanceNumber = parseFloat(balance)
    // Add smaller buffer for gas costs - different for different networks
    // Mainnet has highest gas costs, L2s and other chains have lower costs
    let gasBuffer = 0.0001 // Default L2 buffer
    
    if (chainId === 1) { // Ethereum Mainnet
      gasBuffer = 0.001
    } else if (chainId === 56) { // BNB Smart Chain
      gasBuffer = 0.0005 // Higher than other L2s but lower than mainnet
    } else if (chainId === 43114) { // Avalanche C-Chain
      gasBuffer = 0.0003 // Moderate gas costs
    } // zkSync Era and other L2s use default 0.0001
    
    const totalRequired = requiredAmount + gasBuffer
    const hasEnough = balanceNumber >= totalRequired
    
    return !hasEnough
  }

  return {
    balance,
    isLoading,
    hasInsufficientBalance
  }
}