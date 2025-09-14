'use client'

import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { z } from 'zod'
import { usePayETH } from '@/hooks/use-pay-eth'
import { usePayToken } from '@/hooks/use-pay-token'
import { useGenerateReceipt } from '@/hooks/use-generate-receipt'
import { useAuth } from '@/hooks/use-auth'
import { useVerifyTransaction } from '@/hooks/use-verify-transaction'
import { useAccount, useChainId } from 'wagmi'
import { globalAuthManager } from '@/utils/global-auth-manager'
import { APP_CONFIG, getAvailablePaymentOptions, formatPaymentAmount } from '@/config'
import { useTokenBalance } from '@/hooks/use-token-balance'
import { useMultiTokenBalance } from '@/hooks/use-multi-token-balance'
import { useETHBalance } from '@/hooks/use-eth-balance'
import { formatNumber, formatPaymentAmountDisplay, formatBalanceDisplay } from '@/utils/format-numbers'

const receiptSchema = z.object({
  txHash: z.string().min(66, 'Transaction hash must be 66 characters').max(66, 'Transaction hash must be 66 characters'),
  description: z.string().optional(),
})

type ReceiptForm = z.infer<typeof receiptSchema>

export function ReceiptGenerator() {
  const { isAuthenticated, user } = useAuth()
  const { address } = useAccount()
  const chainId = useChainId()
  const [form, setForm] = useState<ReceiptForm>({ txHash: '', description: '' })
  const [step, setStep] = useState<'input' | 'verifying' | 'payment' | 'generating' | 'complete'>('input')
  const [receiptData, setReceiptData] = useState<any>(null)
  const [mounted, setMounted] = useState(false)
  const [globalAuthState, setGlobalAuthState] = useState(false)
  
  // Get available payment options for current network
  const availablePaymentOptions = getAvailablePaymentOptions(chainId || 1)
  const [selectedPayment, setSelectedPayment] = useState(availablePaymentOptions[0] || APP_CONFIG.PAYMENT_OPTIONS[0])

  const { payETH, isLoading: isPaymentETHLoading } = usePayETH()
  const { payToken, isLoading: isPaymentTokenLoading } = usePayToken()
  const { generateReceipt, isLoading: isGenerating } = useGenerateReceipt()
  const { verifyTransaction, isVerifying } = useVerifyTransaction()

  // Get balance for selected payment option
  const { balance: tokenBalance, isLoading: isTokenBalanceLoading, hasInsufficientBalance: hasInsufficientTokenBalance } = useTokenBalance(
    selectedPayment?.contractAddress || undefined,
    selectedPayment?.decimals
  )
  
  // Use multi-token balance for better token support (especially on Polygon)
  const { 
    balance: multiTokenBalance, 
    isLoading: isMultiTokenBalanceLoading, 
    hasInsufficientBalance: hasInsufficientMultiTokenBalance,
    contractAddress: detectedContractAddress,
    tokenInfo
  } = useMultiTokenBalance(
    selectedPayment?.type || '',
    selectedPayment?.decimals
  )
  
  const { balance: ethBalance, isLoading: isETHBalanceLoading, hasInsufficientBalance: hasInsufficientETHBalance } = useETHBalance()
  
  // Determine which balance and functions to use based on payment type
  const isETHPayment = selectedPayment?.type === 'ETH'
  const isTokenPayment = selectedPayment?.type === 'USDT' || selectedPayment?.type === 'USDC'
  
  const currentBalance = isETHPayment ? ethBalance : (isTokenPayment ? multiTokenBalance : tokenBalance)
  const isBalanceLoading = isETHPayment ? isETHBalanceLoading : (isTokenPayment ? isMultiTokenBalanceLoading : isTokenBalanceLoading)
  const hasInsufficientBalance = isETHPayment ? hasInsufficientETHBalance : (isTokenPayment ? hasInsufficientMultiTokenBalance : hasInsufficientTokenBalance)

  const isPaymentLoading = isPaymentETHLoading || isPaymentTokenLoading

  // Update selected payment when network changes
  useEffect(() => {
    const newAvailableOptions = getAvailablePaymentOptions(chainId || 1)
    if (newAvailableOptions.length > 0) {
      // Try to keep the same payment type if available on new network
      const currentType = selectedPayment?.type
      const newOption = newAvailableOptions.find(opt => opt.type === currentType) || newAvailableOptions[0]
      setSelectedPayment(newOption)
    }
  }, [chainId])

  // Отслеживаем глобальное состояние аутентификации
  useEffect(() => {
    const unsubscribe = globalAuthManager.onAuthChange((changedAddress, isAuth) => {
      if (address && changedAddress === address.toLowerCase()) {
        setGlobalAuthState(isAuth)
      }
    })

    if (address) {
      const currentAuthState = globalAuthManager.isAuthenticated(address)
      setGlobalAuthState(currentAuthState)
    }

    return () => {
      unsubscribe()
    }
  }, [address])

  // Вычисляем итоговое состояние аутентификации
  const isFullyAuthenticated = (
    isAuthenticated && user?.walletAddress?.toLowerCase() === address?.toLowerCase()
  ) || globalAuthState

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isFullyAuthenticated) {
      toast.error('Please connect and authenticate your wallet first')
      return
    }

    if (!form.txHash) {
      toast.error('Please enter a transaction hash')
      return
    }

    try {
      receiptSchema.parse(form)
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message)
        return
      }
    }

    if (step === 'input') {
      // Сначала проверяем существование транзакции
      setStep('verifying')
      const transactionExists = await verifyTransaction(form.txHash)
      
      if (transactionExists) {
        setStep('payment')
      } else {
        setStep('input')
      }
    }
  }

  const handlePayment = async () => {
    if (!selectedPayment) {
      toast.error('Please select a payment method')
      return
    }

    try {     
      let paymentTxHash: string | null = null
      
      if (selectedPayment.type === 'ETH') {
        paymentTxHash = await payETH(selectedPayment.amount)
      } else {
        // For tokens (USDT/USDC)
        if (!selectedPayment.contractAddress) {
          toast.error(`${selectedPayment.symbol} contract not available on this network`)
          return
        }
        
        paymentTxHash = await payToken(
          detectedContractAddress || selectedPayment.contractAddress,
          selectedPayment.amount,
          selectedPayment.symbol,
          selectedPayment.decimals
        )
      }
      
      console.log('Payment transaction hash:', paymentTxHash)
      
      if (paymentTxHash) {
        setStep('generating')
        
        // Generate receipt for the ORIGINAL transaction hash the user entered,
        // and pass the payment transaction hash for efficient verification
        const receipt = await generateReceipt({
          txHash: form.txHash, // Use the original transaction hash from form
          description: form.description || undefined,
          paymentTxHash, // Pass the payment transaction hash for efficient verification
          paymentAmount: selectedPayment.amount, // Pass the actual payment amount used
          paymentType: selectedPayment.type, // Pass the payment type (ETH, USDT, USDC)
          paymentContractAddress: selectedPayment.contractAddress || undefined, // Pass contract address for tokens
        })
        
        console.log('Receipt generated:', receipt)
        setReceiptData(receipt)
        setStep('complete')
        toast.success('Receipt generated successfully!')
      } else {
        console.log('Payment failed, staying on payment step')
        // Stay on payment step so user can try again
        setStep('payment')
      }
    } catch (error: any) {
      console.error('Payment or receipt generation error:', error)
      
      const errorMessage = error?.message || 'Failed to process payment or generate receipt'
      toast.error(errorMessage)
      // Stay on payment step so user can try again
      setStep('payment')
    }
  }

  const handleDownload = () => {
    if (receiptData?.pdfUrl) {
      const link = document.createElement('a')
      link.href = receiptData.pdfUrl
      link.download = `receipt-${receiptData.id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const resetForm = () => {
    setForm({ txHash: '', description: '' })
    setStep('input')
    setReceiptData(null)
  }

  if (!mounted) {
    return (
      <div className="border border-gray-300 dark:border-gray-800 bg-white dark:bg-black p-8 animate-pulse transition-colors duration-300">
        <div className="h-6 bg-gray-200 dark:bg-gray-800 mb-4 transition-colors duration-300"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-800 mb-6 transition-colors duration-300"></div>
        <div className="h-16 bg-gray-200 dark:bg-gray-800 mb-4 transition-colors duration-300"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-800 transition-colors duration-300"></div>
      </div>
    )
  }

  if (step === 'complete' && receiptData) {
    return (
      <div className="border border-gray-300 dark:border-gray-800 bg-white dark:bg-black p-8 transition-colors duration-300">
        <div className="text-center">
          <div className="w-12 h-12 text-orange-400 mx-auto mb-6">
            <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z" />
            </svg>
          </div>
          
          <h3 className="text-lg font-light text-black dark:text-white mb-2 tracking-wide transition-colors duration-300">Receipt Generated</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm font-light transition-colors duration-300">Your transaction receipt has been successfully created.</p>
          
          <div className="border border-gray-300 dark:border-gray-800 p-4 mb-8 transition-colors duration-300">
            <p className="text-xs text-orange-400 uppercase tracking-wider mb-2">Receipt ID</p>
            <p className="text-black dark:text-white font-mono text-xs transition-colors duration-300">{receiptData.id}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleDownload}
              className="btn-primary-minimal text-xs py-3"
            >
              Download PDF
            </button>
            <button
              onClick={resetForm}
              className="btn-secondary-minimal text-xs py-3"
            >
              Generate Another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-gray-300 dark:border-gray-800 bg-white dark:bg-black p-8 transition-colors duration-300">
      <div className="text-center mb-12">
        <h2 className="text-xl font-light text-black dark:text-white mb-4 tracking-wide transition-colors duration-300">Generate Transaction Receipt</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm font-light leading-relaxed transition-colors duration-300">
          Enter your transaction hash and pay {formatPaymentAmountDisplay(selectedPayment.amount)} {selectedPayment.symbol} to generate a verified PDF receipt
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div>
          <label htmlFor="txHash" className="block text-xs text-orange-400 uppercase tracking-wider mb-3">
            Transaction Hash *
          </label>
          <input
            id="txHash"
            type="text"
            value={form.txHash}
            onChange={(e) => setForm({ ...form, txHash: e.target.value })}
            placeholder="0x..."
            className="w-full px-4 py-3 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all duration-300 font-mono text-xs"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-xs text-orange-400 uppercase tracking-wider mb-3">
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Add a description for your receipt..."
            rows={3}
            className="w-full px-4 py-3 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all duration-300 resize-none text-xs font-light"
          />
        </div>

        {step === 'input' && (
          <button
            type="submit"
            disabled={!form.txHash || !isFullyAuthenticated}
            className={`w-full py-3 px-6 text-xs font-light tracking-wide transition-all duration-300 ${
              !form.txHash || !isFullyAuthenticated
                ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-700'
                : 'btn-primary-minimal'
            }`}
          >
            {!isFullyAuthenticated ? 'Please Connect Wallet' : 'Verify Transaction'}
          </button>
        )}

        {step === 'verifying' && (
          <div className="text-center py-8">
            <div className="w-6 h-6 border border-orange-400 border-t-transparent animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 text-xs font-light transition-colors duration-300">Verifying transaction on blockchain...</p>
            <p className="text-gray-500 text-xs font-light mt-2">This may take a few seconds</p>
          </div>
        )}

        {step === 'payment' && (
          <div className="text-center py-4">
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-xs font-light transition-colors duration-300">Choose your payment method</p>
            
            {/* Payment Method Selector */}
            <div className="mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {availablePaymentOptions.map((option) => (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => setSelectedPayment(option)}
                    className={`p-4 border rounded-lg text-sm transition-colors duration-300 ${
                      selectedPayment?.type === option.type
                        ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                        : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="font-medium">{formatPaymentAmountDisplay(option.amount)} {option.symbol}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{option.name}</div>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">on {option.networkName}</div>
                  </button>
                ))}
              </div>
              {availablePaymentOptions.length === 0 && (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-sm">
                  No payment options available on this network. Please switch to a supported network.
                </div>
              )}
            </div>
            
            {/* Balance Display */}
            {selectedPayment && (
              <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Your {selectedPayment.symbol} Balance
                  {isTokenPayment && tokenInfo && (
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {tokenInfo.name} ({tokenInfo.symbol})
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center space-x-2">
                  {isBalanceLoading ? (
                    <div className="w-4 h-4 border border-orange-400 border-t-transparent animate-spin"></div>
                  ) : (
                    <>
                      <span className="text-lg font-medium text-gray-900 dark:text-gray-100">
                        {formatBalanceDisplay(currentBalance, isETHPayment)} {selectedPayment.symbol}
                      </span>
                      {hasInsufficientBalance(selectedPayment.amount) && (
                        <span className="ml-2 px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs rounded">
                          Insufficient Balance
                        </span>
                      )}
                    </>
                  )}
                </div>
                {!isBalanceLoading && hasInsufficientBalance(selectedPayment.amount) && (
                  <div className="mt-2 text-xs text-red-600 dark:text-red-400">
                    You need {formatPaymentAmountDisplay(selectedPayment.amount)} {selectedPayment.symbol} but only have {formatBalanceDisplay(currentBalance, isETHPayment)} {selectedPayment.symbol}
                    {isETHPayment && <span className="block mt-1">(Plus gas fees)</span>}
                  </div>
                )}
                {isTokenPayment && detectedContractAddress && (
                  <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    Contract: {detectedContractAddress.slice(0, 6)}...{detectedContractAddress.slice(-4)}
                  </div>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setStep('input')}
                className="btn-secondary-minimal text-xs py-3"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handlePayment}
                disabled={
                  isPaymentLoading || 
                  hasInsufficientBalance(selectedPayment?.amount || 0)
                }
                className={`text-xs py-3 transition-all duration-300 ${
                  isPaymentLoading || 
                  hasInsufficientBalance(selectedPayment?.amount || 0)
                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-700'
                    : 'btn-primary-minimal'
                }`}
              >
                {isPaymentLoading 
                  ? 'Processing...' 
                  : hasInsufficientBalance(selectedPayment?.amount || 0)
                    ? `Insufficient ${selectedPayment?.symbol} Balance`
                    : `Pay ${formatPaymentAmountDisplay(selectedPayment.amount)} ${selectedPayment.symbol}`
                }
              </button>
            </div>
          </div>
        )}

        {step === 'generating' && (
          <div className="text-center py-8">
            <div className="w-12 h-12 border border-gray-300 dark:border-gray-600 flex items-center justify-center mx-auto mb-4 transition-colors duration-300">
              <div className="w-4 h-4 border-2 border-orange-400 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-black dark:text-white font-light text-xs tracking-wide transition-colors duration-300">Generating your receipt...</p>
            <p className="text-gray-500 text-xs font-light mt-2">This may take a few moments</p>
          </div>
        )}
      </form>
    </div>
  )
}
