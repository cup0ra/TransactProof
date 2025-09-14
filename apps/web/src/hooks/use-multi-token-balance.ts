'use client'

import { useState, useEffect } from 'react'
import { useAccount, useChainId, usePublicClient } from 'wagmi'
import { formatUnits, parseAbi } from 'viem'
import { getAlternativeTokenAddresses } from '@/config'

const ERC20_BALANCE_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)',
  'function symbol() view returns (string)',
  'function name() view returns (string)'
])

export function useMultiTokenBalance(tokenType: string, decimals: number = 6) {
  const [balance, setBalance] = useState<string>('0')
  const [isLoading, setIsLoading] = useState(false)
  const [contractAddress, setContractAddress] = useState<string | null>(null)
  const [tokenInfo, setTokenInfo] = useState<{symbol: string, name: string} | null>(null)
  const { address } = useAccount()
  const chainId = useChainId()
  const publicClient = usePublicClient()

  useEffect(() => {
    async function fetchBalance() {
      if (!address || !publicClient || !tokenType || tokenType === 'ETH') {
        setBalance('0')
        setContractAddress(null)
        setTokenInfo(null)
        return
      }

      try {
        setIsLoading(true)
        
        const alternativeAddresses = getAlternativeTokenAddresses(tokenType, chainId || 1)
        console.log(`Checking ${tokenType} balance on chain ${chainId}:`, alternativeAddresses)
        
        let foundBalance = '0'
        let foundAddress: string | null = null
        let foundTokenInfo: {symbol: string, name: string} | null = null
        
        // Try each possible contract address
        for (const contractAddr of alternativeAddresses) {
          try {
            console.log(`Trying ${tokenType} contract:`, contractAddr)
            
            // Get balance
            const balanceRaw = await publicClient.readContract({
              address: contractAddr as `0x${string}`,
              abi: ERC20_BALANCE_ABI,
              functionName: 'balanceOf',
              args: [address],
            })

            const formattedBalance = formatUnits(balanceRaw as bigint, decimals)
            
            // Get token info for verification
            const [symbol, name] = await Promise.all([
              publicClient.readContract({
                address: contractAddr as `0x${string}`,
                abi: ERC20_BALANCE_ABI,
                functionName: 'symbol',
              }),
              publicClient.readContract({
                address: contractAddr as `0x${string}`,
                abi: ERC20_BALANCE_ABI,
                functionName: 'name',
              })
            ])
            
            console.log(`Found ${tokenType} contract ${contractAddr}:`, {
              balance: formattedBalance,
              symbol,
              name,
              balanceRaw: balanceRaw.toString()
            })
            
            // If we found a balance > 0, use this contract
            if (parseFloat(formattedBalance) > 0) {
              foundBalance = formattedBalance
              foundAddress = contractAddr
              foundTokenInfo = { symbol: symbol as string, name: name as string }
              break
            }
            
            // If no balance found yet, still save the first working contract
            if (!foundAddress) {
              foundBalance = formattedBalance
              foundAddress = contractAddr
              foundTokenInfo = { symbol: symbol as string, name: name as string }
            }
            
          } catch (contractError) {
            console.warn(`Contract ${contractAddr} failed:`, contractError)
            continue
          }
        }
        
        setBalance(foundBalance)
        setContractAddress(foundAddress)
        setTokenInfo(foundTokenInfo)
        
      } catch (error) {
        console.error(`Error fetching ${tokenType} balance:`, {
          error,
          address,
          chainId,
          decimals
        })
        setBalance('0')
        setContractAddress(null)
        setTokenInfo(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchBalance()
  }, [address, tokenType, decimals, publicClient, chainId])

  const hasInsufficientBalance = (requiredAmount: number): boolean => {
    const balanceNumber = parseFloat(balance)
    return balanceNumber < requiredAmount
  }

  return {
    balance,
    isLoading,
    hasInsufficientBalance,
    contractAddress,
    tokenInfo
  }
}