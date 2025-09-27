'use client'

import { useState, useEffect } from 'react'
import { useAccount, useChainId, usePublicClient } from 'wagmi'
import { parseAbi, formatUnits } from 'viem'

const ERC20_BALANCE_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)'
])

export function useTokenBalance(contractAddress?: string, decimals: number = 6) {
  const [balance, setBalance] = useState<string>('0')
  const [isLoading, setIsLoading] = useState(false)
  const { address } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()

  useEffect(() => {
    async function fetchBalance() {
      if (!address || !contractAddress || !publicClient) {
        setBalance('0')
        return
      }

      try {
        setIsLoading(true)
        
        const balanceRaw = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: ERC20_BALANCE_ABI,
          functionName: 'balanceOf',
          args: [address],
        })

        const formattedBalance = formatUnits(balanceRaw as bigint, decimals)
        setBalance(formattedBalance)
      } catch (error) {
        setBalance('0')
      } finally {
        setIsLoading(false)
      }
    }

    fetchBalance()
  }, [address, contractAddress, decimals, publicClient, chainId])

  const hasInsufficientBalance = (requiredAmount: number): boolean => {
    const balanceNumber = parseFloat(balance)
    return balanceNumber < requiredAmount
  }

  return {
    balance,
    isLoading,
    hasInsufficientBalance
  }
}