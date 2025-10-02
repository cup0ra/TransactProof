'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from 'react-hot-toast'
import { z } from 'zod'
import { usePayETH } from '@/hooks/use-pay-eth'
import { usePayToken } from '@/hooks/use-pay-token'
import { useGenerateReceipt } from '@/hooks/use-generate-receipt'
import { useAuth } from '@/hooks/use-auth'
import { useVerifyTransaction } from '@/hooks/use-verify-transaction'
import { useAccount, useChainId } from 'wagmi'
import { globalAuthManager } from '@/utils/global-auth-manager'
import { APP_CONFIG, getAvailablePaymentOptions } from '@/config'
import { useTokenBalance } from '@/hooks/use-token-balance'
import { useMultiTokenBalance } from '@/hooks/use-multi-token-balance'
import { useETHBalance } from '@/hooks/use-eth-balance'
import {  formatPaymentAmountDisplay } from '@/utils/format-numbers'

const receiptSchema = z.object({
  txHash: z.string().min(66, 'Transaction hash must be 66 characters').max(66, 'Transaction hash must be 66 characters'),
  description: z.string().optional(),
})

type ReceiptForm = z.infer<typeof receiptSchema>

// Refactored for readability & maintainability: introduced Step enum, helper utilities, and decomposed rendering.
enum Step {
  INPUT = 'input',
  VERIFYING = 'verifying',
  FREE = 'free',
  PAYMENT = 'payment',
  GENERATING = 'generating',
  COMPLETE = 'complete'
}

interface FreeGenerationInfo {
  hasFree: boolean
  count: number
  dateActive: boolean
}

// Narrow user type locally to avoid 'any' while remaining flexible
interface MinimalUser {
  freeGenerationsRemaining?: number
  freeUntil?: string | Date | null
  walletAddress?: string
}

function computeFreeInfo(user: MinimalUser | undefined): FreeGenerationInfo {
  if (!user) return { hasFree: false, count: 0, dateActive: false }
  const count = typeof user.freeGenerationsRemaining === 'number' ? user.freeGenerationsRemaining : 0
  const freeUntilDate = user.freeUntil ? new Date(user.freeUntil) : null
  const dateActive = !!freeUntilDate && freeUntilDate > new Date()
  return { hasFree: count > 0 || dateActive, count, dateActive }
}

export function ReceiptGenerator() {
  const { isAuthenticated, user, checkAuth } = useAuth()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const [form, setForm] = useState<ReceiptForm>({ txHash: '', description: '' })
  const [step, setStep] = useState<Step>(Step.INPUT)
  const freeInfo = computeFreeInfo(user || undefined)
  interface GeneratedReceipt { id: string; pdfUrl: string }
  const [receiptData, setReceiptData] = useState<GeneratedReceipt | null>(null)
  const [mounted, setMounted] = useState(false)
  const [globalAuthState, setGlobalAuthState] = useState(false)
  
  // Get available payment options for current network
  const availablePaymentOptions = useMemo(() => getAvailablePaymentOptions(chainId || 1), [chainId])
  const [selectedPayment, setSelectedPayment] = useState(availablePaymentOptions[0] || APP_CONFIG.PAYMENT_OPTIONS[0])

  const { payETH, isLoading: isPaymentETHLoading } = usePayETH()
  const { payToken, isLoading: isPaymentTokenLoading } = usePayToken()
  const { generateReceipt } = useGenerateReceipt()
  const { verifyTransaction } = useVerifyTransaction()

  // Get balance for selected payment option
  const { hasInsufficientBalance: hasInsufficientTokenBalance } = useTokenBalance(
    selectedPayment?.contractAddress || undefined,
    selectedPayment?.decimals
  )
  
  // Use multi-token balance for better token support (especially on Polygon)
  const { 
    hasInsufficientBalance: hasInsufficientMultiTokenBalance,
    contractAddress: detectedContractAddress,
  } = useMultiTokenBalance(
    selectedPayment?.type || '',
    selectedPayment?.decimals
  )
  
  const { hasInsufficientBalance: hasInsufficientETHBalance } = useETHBalance()
  
  // Determine which balance and functions to use based on payment type
  const isETHPayment = selectedPayment?.type === 'ETH'
  const isTokenPayment = selectedPayment?.type === 'USDT' || selectedPayment?.type === 'USDC'
  
  // Consolidated insufficient balance flag (normalize possible function/boolean variants from hooks)
  const insufficientBalance: boolean = useMemo(() => {
    const raw = isETHPayment
      ? hasInsufficientETHBalance
      : (isTokenPayment ? hasInsufficientMultiTokenBalance : hasInsufficientTokenBalance)
    if (typeof raw === 'function') {
      try {
        return raw(selectedPayment?.amount || 0)
      } catch {
        return true
      }
    }
    return !!raw
  }, [isETHPayment, isTokenPayment, hasInsufficientETHBalance, hasInsufficientMultiTokenBalance, hasInsufficientTokenBalance, selectedPayment?.amount])

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
  }, [chainId, selectedPayment?.type])

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

  const isFullyAuthenticated = isConnected && (
    (isAuthenticated && user?.walletAddress?.toLowerCase() === address?.toLowerCase()) ||
    globalAuthState
  )

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!isConnected && (step === Step.PAYMENT || step === Step.GENERATING)) {
      setStep(Step.INPUT)
      toast.error('Wallet disconnected. Please reconnect to continue.')
    }
  }, [isConnected, step])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
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

    if (step === Step.INPUT) {
      setStep(Step.VERIFYING)
      const transactionExists = await verifyTransaction(form.txHash)
      
      if (transactionExists) {
        if (freeInfo.hasFree) {
          setStep(Step.FREE)
          return
        }
        setStep(Step.PAYMENT)
      } else {
        setStep(Step.INPUT)
      }
    }
  }, [isFullyAuthenticated, form, step, verifyTransaction, freeInfo.hasFree])

  const [isFreeGenerating, setIsFreeGenerating] = useState(false)

  const handleFreeGenerate = useCallback(async () => {
    if (isFreeGenerating) return
    setIsFreeGenerating(true)
    setStep(Step.GENERATING)
    try {
      const receipt = await generateReceipt({
        txHash: form.txHash,
        description: form.description || undefined,
      })
      if (receipt) {
        setReceiptData(receipt)
        try { await checkAuth() } catch { /* ignore */ }
        setStep(Step.COMPLETE)
        toast.success('Receipt generated for free!')
      } else {
        setStep(Step.FREE)
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate receipt'
      toast.error(message)
      setStep(Step.FREE)
    } finally {
      setIsFreeGenerating(false)
    }
  }, [isFreeGenerating, generateReceipt, form, checkAuth])

  const handlePayment = useCallback(async () => {
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
      
      
      if (paymentTxHash) {
  setStep(Step.GENERATING)
        
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
        
        if (receipt) {
          setReceiptData(receipt)
          // Update user state (in case future paid logic adjusts counters/promos)
          try { await checkAuth() } catch { /* ignore */ }
          setStep(Step.COMPLETE)
          toast.success('Receipt generated successfully!')
        } else {
          setStep(Step.PAYMENT)
        }
      } else {
        setStep(Step.PAYMENT)
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to process payment or generate receipt'
      toast.error(errorMessage)
      setStep(Step.PAYMENT)
    }
  }, [selectedPayment, payETH, payToken, detectedContractAddress, generateReceipt, form, checkAuth])

  const handleDownload = useCallback(() => {
    if (receiptData?.pdfUrl) {
      const link = document.createElement('a')
      link.href = receiptData.pdfUrl
      link.download = `receipt-${receiptData.id}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }, [receiptData])

  const resetForm = useCallback(() => {
    setForm({ txHash: '', description: '' })
    setStep(Step.INPUT)
    setReceiptData(null)
  }, [])

  if (!mounted) {
    return (
      <div className="border border-gray-300 dark:border-gray-800 bg-white/30 backdrop-blur-md dark:bg-black/30 p-8 animate-pulse transition-colors duration-300">
        <div className="h-6 bg-gray-200 dark:bg-gray-800 mb-4 transition-colors duration-300"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-800 mb-6 transition-colors duration-300"></div>
        <div className="h-16 bg-gray-200 dark:bg-gray-800 mb-4 transition-colors duration-300"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-800 transition-colors duration-300"></div>
      </div>
    )
  }

  if (step === Step.COMPLETE && receiptData) {
    return (
      <div className="border border-gray-300 dark:border-gray-800 bg-white/20 backdrop-blur-md dark:bg-black/30 p-6 sm:p-8 transition-colors duration-300">
        <div className="text-center">
          <div className="w-10 h-10 sm:w-12 sm:h-12 text-orange-400 mx-auto mb-4 sm:mb-6">
            <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M11,16.5L18,9.5L16.59,8.09L11,13.67L7.91,10.59L6.5,12L11,16.5Z" />
            </svg>
          </div>
          
          <h3 className="text-base sm:text-lg md:text-xl font-light text-black dark:text-white mb-2 tracking-wide transition-colors duration-300">Receipt Generated</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 text-xs sm:text-sm font-light transition-colors duration-300">Your transaction receipt has been successfully created.</p>
          
          <div className="border border-gray-300 dark:border-gray-800 p-3 sm:p-4 mb-6 sm:mb-8 transition-colors duration-300">
            <p className="text-xs text-orange-400 uppercase tracking-wider mb-2">Receipt ID</p>
            <p className="text-black dark:text-white font-mono text-xs sm:text-sm transition-colors duration-300">{receiptData.id}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <button
              onClick={handleDownload}
              className="btn-primary-minimal text-xs sm:text-sm py-2.5 sm:py-3"
            >
              Download PDF
            </button>
            <button
              onClick={resetForm}
              className="btn-secondary-minimal text-xs sm:text-sm py-2.5 sm:py-3"
            >
              Generate Another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-gray-300 dark:border-gray-800 bg-white/20 backdrop-blur-md dark:bg-black/30 p-6 sm:p-8 transition-colors duration-300">
      <div className="text-center mb-4">
        {/* <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-4 sm:mb-6 p-2 border border-orange-400 bg-orange-50 dark:bg-orange-900/20">
          <svg className="w-full h-full text-orange-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
          </svg>
        </div> */}
        <h2 className="text-lg sm:text-xl md:text-2xl font-light text-black dark:text-white mb-3 sm:mb-4 tracking-wide transition-colors duration-300">Generate Transaction Receipt</h2>
        <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-light leading-relaxed transition-colors duration-300">
          {freeInfo.hasFree ? (
            <span>You have a free receipt available. Enter a transaction hash to generate it without payment.</span>
          ) : (
            <span>Enter your transaction hash and pay {formatPaymentAmountDisplay(selectedPayment.amount)} {selectedPayment.symbol} to generate a verified PDF receipt</span>
          )}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        <div>
          <label htmlFor="txHash" className="block text-xs sm:text-sm text-orange-400 uppercase tracking-wider mb-2 sm:mb-3">
            Transaction Hash *
          </label>
          <input
            id="txHash"
            type="text"
            value={form.txHash}
            onChange={(e) => setForm({ ...form, txHash: e.target.value })}
            placeholder="0x..."
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all duration-300 font-mono text-xs sm:text-sm"
            required
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-xs sm:text-sm text-orange-400 uppercase tracking-wider mb-2 sm:mb-3">
            Description (Optional)
          </label>
          <textarea
            id="description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Add a description for your receipt..."
            rows={3}
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-white dark:bg-black border border-gray-300 dark:border-gray-700 text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all duration-300 resize-none text-xs sm:text-sm font-light"
          />
        </div>

        {step === Step.INPUT && (
          <button
            type="submit"
            disabled={!form.txHash || !isFullyAuthenticated}
            className={`w-full py-2.5 sm:py-3 px-4 sm:px-6 text-xs sm:text-sm font-light tracking-wide transition-all duration-300 ${
              !form.txHash || !isFullyAuthenticated
                ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-700'
                : 'btn-primary-minimal'
            }`}
          >
            {!isFullyAuthenticated ? 'Please Connect Wallet' : 'Verify Transaction'}
          </button>
        )}

        {step === Step.VERIFYING && (
          <div className="text-center py-6 sm:py-8">
            <div className="w-5 h-5 sm:w-6 sm:h-6 border border-orange-400 border-t-transparent animate-spin mx-auto mb-3 sm:mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-light transition-colors duration-300">Verifying transaction on blockchain...</p>
            <p className="text-gray-500 text-xs font-light mt-2">This may take a few seconds</p>
          </div>
        )}

        {step === Step.PAYMENT && (
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-4 text-xs sm:text-sm font-light transition-colors duration-300">Choose your payment method</p>
            
            {/* Payment Method Selector */}
            <div className="mb-4 sm:mb-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                {availablePaymentOptions.map((option) => (
                  <button
                    key={option.type}
                    type="button"
                    onClick={() => setSelectedPayment(option)}
                    className={`p-3 sm:p-4 border rounded-lg text-xs sm:text-sm transition-colors duration-300 ${
                      selectedPayment?.type === option.type
                        ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                        : 'border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600'
                    }`}
                  >
                    <div className="font-medium text-sm sm:text-base">{formatPaymentAmountDisplay(option.amount)} {option.symbol}</div>
                  </button>
                ))}
              </div>
              {availablePaymentOptions.length === 0 && (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                  No payment options available on this network. Please switch to a supported network.
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setStep(Step.INPUT)}
                className="btn-secondary-minimal text-xs sm:text-sm py-2.5 sm:py-3"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handlePayment}
                disabled={
                  isPaymentLoading || insufficientBalance
                }
                className={`text-xs sm:text-sm py-2.5 sm:py-3 transition-all duration-300 ${
                  isPaymentLoading || insufficientBalance
                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-700'
                    : 'btn-primary-minimal'
                }`}
              >
                {isPaymentLoading 
                  ? 'Processing...' 
                  : insufficientBalance
                    ? `Insufficient ${selectedPayment?.symbol} Balance`
                    : `Pay ${formatPaymentAmountDisplay(selectedPayment.amount)} ${selectedPayment.symbol}`
                }
              </button>
            </div>
          </div>
        )}

        {step === Step.FREE && (
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-4 text-xs sm:text-sm font-light transition-colors duration-300">
              You have a free receipt available. Generate it now without payment.
              {freeInfo.count > 0 && (
                <span className="block mt-2 text-[11px] tracking-wide text-orange-500 dark:text-orange-400">
                  Free receipts left: <span className="font-medium">{freeInfo.count}</span>
                </span>
              )}
              {user?.freeUntil && (
                <span className="block mt-1 text-[10px] text-gray-500 dark:text-gray-500">
                  Free access until: {new Date(user.freeUntil).toLocaleString()}
                </span>
              )}
            </p>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <button
                type="button"
                onClick={() => setStep(Step.INPUT)}
                className="btn-secondary-minimal text-xs sm:text-sm py-2.5 sm:py-3"
                disabled={isFreeGenerating}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleFreeGenerate}
                disabled={isFreeGenerating}
                className={`text-xs sm:text-sm py-2.5 sm:py-3 transition-all duration-300 ${
                  isFreeGenerating
                    ? 'bg-gray-200 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-700'
                    : 'btn-primary-minimal'
                }`}
              >
                {isFreeGenerating ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        )}

        {step === Step.GENERATING && (
          <div className="text-center py-6 sm:py-8">
            <div className="w-10 h-10 sm:w-12 sm:h-12 border border-gray-300 dark:border-gray-600 flex items-center justify-center mx-auto mb-3 sm:mb-4 transition-colors duration-300">
              <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-orange-400 border-t-transparent animate-spin"></div>
            </div>
            <p className="text-black dark:text-white font-light text-xs sm:text-sm tracking-wide transition-colors duration-300">Generating your receipt...</p>
            <p className="text-gray-500 text-xs font-light mt-2">This may take a few moments</p>
          </div>
        )}
      </form>
    </div>
  )
}
