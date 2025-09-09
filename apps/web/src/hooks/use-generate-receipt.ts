'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { ApiClient } from '@/lib/api-client'

interface GenerateReceiptParams {
  txHash: string
  description?: string
}

interface ReceiptResponse {
  id: string
  txHash: string
  sender: string
  receiver: string
  amount: string
  token: 'USDT'
  chainId: number
  pdfUrl: string
  createdAt: string
}

export function useGenerateReceipt() {
  const [isLoading, setIsLoading] = useState(false)

  const generateReceipt = async (params: GenerateReceiptParams): Promise<ReceiptResponse | null> => {
    try {
      setIsLoading(true)
      
      toast.loading('Generating receipt...', { id: 'generate' })
      
      const response = await ApiClient.post('/api/receipts/pay-and-generate', params)
      const receipt = await response.json()
      
      toast.success('Receipt generated successfully!', { id: 'generate' })
      return receipt
    } catch (error) {
      // Не показываем toast для ошибки аутентификации, так как ApiClient уже перенаправил
      if (error instanceof Error && error.message !== 'Authentication required') {
        toast.error(error.message || 'Failed to generate receipt', { id: 'generate' })
      }
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return { generateReceipt, isLoading }
}