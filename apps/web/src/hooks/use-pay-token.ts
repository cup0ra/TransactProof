'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useAccount, useChainId, useWalletClient, usePublicClient } from 'wagmi'
import { parseUnits, encodeFunctionData, parseAbi, formatUnits } from 'viem'
import { formatNumber } from '@/utils/format-numbers'

// Service address for token payments
const SERVICE_ADDRESS = process.env.NEXT_PUBLIC_SERVICE_ETH_ADDRESS || '0x1234567890123456789012345678901234567890'

// ERC20 Transfer function ABI
const ERC20_TRANSFER_ABI = [
  {
    name: 'transfer',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    outputs: [{ name: '', type: 'bool' }]
  }
] as const

// ERC20 Balance check ABI
const ERC20_BALANCE_ABI = parseAbi([
  'function balanceOf(address owner) view returns (uint256)'
])

export function usePayToken() {
  const [isLoading, setIsLoading] = useState(false)
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  const payToken = async (
    contractAddress: string,
    amount: number,
    symbol: string,
    decimals: number = 6 // USDT/USDC typically have 6 decimals
  ) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet')
      return null
    }

    if (!walletClient) {
      toast.error('Wallet client not available. Please reconnect your wallet.')
      return null
    }

    if (!publicClient) {
      toast.error('Public client not available. Please check your connection.')
      return null
    }

    // Validate service address
    if (!SERVICE_ADDRESS || SERVICE_ADDRESS === '0x1234567890123456789012345678901234567890') {
      toast.error('Service configuration error. Please contact support.')
      return null
    }



    try {
      setIsLoading(true)
      
      toast.loading(`Checking ${symbol} balance...`, { id: 'payment' })
      
      // Check token balance before attempting transaction
      try {
        const balanceRaw = await publicClient.readContract({
          address: contractAddress as `0x${string}`,
          abi: ERC20_BALANCE_ABI,
          functionName: 'balanceOf',
          args: [address],
        })

        const currentBalance = parseFloat(formatUnits(balanceRaw as bigint, decimals))
        

        
        if (currentBalance < amount) {
          toast.error(`Insufficient ${symbol} balance. You have ${formatNumber(currentBalance, 6)} ${symbol}, but need ${formatNumber(amount, 6)} ${symbol}.`, { id: 'payment' })
          return null
        }
      } catch (balanceError) {
        toast.loading(`Preparing ${symbol} transaction...`, { id: 'payment' })
      }
      
      toast.loading(`Preparing ${symbol} transaction...`, { id: 'payment' })
      
      // Parse amount with correct decimals
      const amountInUnits = parseUnits(amount.toString(), decimals)
      

      
      // Encode transfer function data
      const data = encodeFunctionData({
        abi: ERC20_TRANSFER_ABI,
        functionName: 'transfer',
        args: [SERVICE_ADDRESS as `0x${string}`, amountInUnits]
      })
      
      // Send token transfer transaction
      const txHash = await walletClient.sendTransaction({
        account: address,
        to: contractAddress as `0x${string}`,
        data,
      })
      
      toast.success(`${symbol} payment successful!`, { id: 'payment' })
      return txHash
    } catch (error: any) {
      
      // Handle specific error types
      let errorMessage = `${symbol} payment failed. Please try again.`
      
      if (error?.name === 'UserRejectedRequestError' || error?.code === 4001) {
        errorMessage = 'Transaction was rejected by user'
      } else if (error?.message?.includes('insufficient funds') || error?.code === -32000) {
        errorMessage = `Insufficient ${symbol} balance for transaction`
      } else if (error?.message?.includes('allowance')) {
        errorMessage = `Insufficient ${symbol} allowance. Please approve the token first.`
      } else if (error?.message?.includes('gas')) {
        errorMessage = 'Gas estimation failed. Please try again.'
      } else if (error?.message?.includes('connector') || error?.message?.includes('getChainId')) {
        errorMessage = 'Wallet connection error. Please disconnect and reconnect your wallet.'
      } else if (error?.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection and try again.'
      } else if (error?.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage, { id: 'payment' })
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { payToken, isLoading }
}