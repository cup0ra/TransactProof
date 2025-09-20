'use client'

import { useState, useEffect } from 'react'
import { useAccount, useChainId, usePublicClient } from 'wagmi'
import { formatEther } from 'viem'

export function useETHBalance() {
  const [balance, setBalance] = useState<string>('0')
  const [isLoading, setIsLoading] = useState(false)
  const { address } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()

  useEffect(() => {
    async function fetchBalance() {
      if (!address || !publicClient) {
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
  }, [address, publicClient, chainId])

  const hasInsufficientBalance = (requiredAmount: number): boolean => {
    const balanceNumber = parseFloat(balance)
    // Add smaller buffer for gas costs - different for different networks
    // Optimism and other L2s have much lower gas costs than mainnet
    const gasBuffer = chainId === 1 ? 0.001 : 0.0001 // Mainnet vs L2 networks
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