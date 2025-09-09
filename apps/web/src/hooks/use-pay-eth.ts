'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useAccount, useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'

// Service address for ETH payments
const SERVICE_ADDRESS = process.env.NEXT_PUBLIC_SERVICE_ETH_ADDRESS || '0x1234567890123456789012345678901234567890'

export function usePayETH() {
  const [isLoading, setIsLoading] = useState(false)
  const { isConnected, address } = useAccount()
  const { sendTransactionAsync } = useSendTransaction()

  const payETH = async (amount: number = 0.0000001) => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet')
      return null
    }

    // Validate service address
    if (!SERVICE_ADDRESS || SERVICE_ADDRESS === '0x1234567890123456789012345678901234567890') {
      console.error('Invalid service address:', SERVICE_ADDRESS)
      toast.error('Service configuration error. Please contact support.')
      return null
    }

    console.log('Starting ETH payment:', {
      amount,
      serviceAddress: SERVICE_ADDRESS,
      isConnected,
      userAddress: address
    })

    try {
      setIsLoading(true)
      
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
      
      console.log('Amount conversion:', {
        originalAmount: amount,
        amountString,
        isScientific: amount.toString().includes('e')
      })
      
      const txData = {
        to: SERVICE_ADDRESS as `0x${string}`,
        value: parseEther(amountString),
      }
      
      console.log('Transaction data:', txData)
      
      // Send ETH transaction using wagmi async method
      const txHash = await sendTransactionAsync(txData)
      
      console.log('Transaction sent successfully:', txHash)
      toast.success('Payment successful!', { id: 'payment' })
      return txHash
    } catch (error: any) {
      console.error('Payment error:', error)
      
      // Handle specific error types
      let errorMessage = 'Payment failed. Please try again.'
      
      if (error?.name === 'UserRejectedRequestError') {
        errorMessage = 'Transaction was rejected by user'
      } else if (error?.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for transaction'
      } else if (error?.message?.includes('gas')) {
        errorMessage = 'Gas estimation failed. Please try again.'
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