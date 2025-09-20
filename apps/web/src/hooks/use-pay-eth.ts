'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useAccount, useChainId, useWalletClient, usePublicClient } from 'wagmi'
import { parseEther, formatEther } from 'viem'
import { formatNumber } from '@/utils/format-numbers'

// Service address for ETH payments
const SERVICE_ADDRESS = process.env.NEXT_PUBLIC_SERVICE_ETH_ADDRESS || '0x1234567890123456789012345678901234567890'

export function usePayETH() {
  const [isLoading, setIsLoading] = useState(false)
  const { isConnected, address } = useAccount()
  const chainId = useChainId()
  const { data: walletClient } = useWalletClient()
  const publicClient = usePublicClient()

  const payETH = async (amount: number = 0.0000001) => {
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
      
      toast.loading('Checking ETH balance...', { id: 'payment' })
      
      // Check ETH balance before attempting transaction
      try {
        const balanceRaw = await publicClient.getBalance({
          address: address,
        })

        const currentBalance = parseFloat(formatEther(balanceRaw))
        const gasBuffer = chainId === 1 ? 0.001 : 0.0001 // Mainnet vs L2 networks
        const totalRequired = amount + gasBuffer
        
        if (currentBalance < totalRequired) {
          toast.error(`Insufficient ETH balance. You have ${formatNumber(currentBalance, 8)} ETH, but need ${formatNumber(totalRequired, 8)} ETH (including gas).`, { id: 'payment' })
          return null
        }
      } catch (balanceError) {
        // Could not check balance, proceed with transaction
      }
      
      toast.loading('Preparing transaction...', { id: 'payment' })
      
      // Prepare transaction data
      // Handle very small numbers that might be in scientific notation
      let amountString: string
      if (amount < 0.000001) {
        // For very small amounts, use fixed notation with enough decimal places
        amountString = amount.toFixed(10)
      } else {
        amountString = amount.toString()
      }
      
      // Send ETH transaction using wallet client directly
      const txHash = await walletClient.sendTransaction({
        account: address,
        to: SERVICE_ADDRESS as `0x${string}`,
        value: parseEther(amountString),
      })
      
      toast.success('Payment successful!', { id: 'payment' })
      return txHash
    } catch (error: any) {
      
      // Handle specific error types
      let errorMessage = 'Payment failed. Please try again.'
      
      if (error?.name === 'UserRejectedRequestError' || error?.code === 4001) {
        errorMessage = 'Transaction was rejected by user'
      } else if (error?.message?.includes('insufficient funds') || error?.code === -32000) {
        errorMessage = 'Insufficient funds for transaction'
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

  return { payETH, isLoading }
}