'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { ApiClient } from '@/lib/api-client'

interface VerifyTransactionResult {
  exists: boolean
  txHash: string
}

export function useVerifyTransaction() {
  const [isVerifying, setIsVerifying] = useState(false)

  const verifyTransaction = async (txHash: string): Promise<boolean> => {
    try {
      setIsVerifying(true)
      
      const response = await ApiClient.get(`/api/receipts/verify-transaction/${txHash}`)
      const result: VerifyTransactionResult = await response.json()
      
      if (!result.exists) {
        toast.error('Transaction hash not found on blockchain. Please check your transaction hash.')
        return false
      }

      return true
    } catch (error) {
      if (error instanceof Error && error.message !== 'Authentication required') {
        toast.error('Failed to verify transaction. Please try again.')
      }
      return false
    } finally {
      setIsVerifying(false)
    }
  }

  return { verifyTransaction, isVerifying }
}