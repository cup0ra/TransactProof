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
import { AnimatedPillNav } from '@/components/animated-pill-nav'

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

interface ReceiptGeneratorProps {
  initialTxHash?: string
  txChainId?: number
  startFromPayment?: boolean
  forcePayment?: boolean
  batchPayableRemaining?: number
  onBusyChange?: (isBusy: boolean) => void
  compactMode?: boolean
  onReceiptGenerated?: (data: { txHash: string; receiptId: string; pdfUrl: string }) => void
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

export function ReceiptGenerator({
  initialTxHash,
  txChainId,
  startFromPayment = false,
  forcePayment = false,
  batchPayableRemaining = 0,
  onBusyChange,
  compactMode = false,
  onReceiptGenerated,
}: ReceiptGeneratorProps) {
  const { isAuthenticated, user, checkAuth } = useAuth()
  const { address, isConnected } = useAccount()
  const chainId = useChainId()
  const [form, setForm] = useState<ReceiptForm>({ txHash: initialTxHash || '', description: '' })
  const [step, setStep] = useState<Step>(Step.INPUT)
  const freeInfo = computeFreeInfo(user || undefined)
  const canUseFreeStep = freeInfo.hasFree && !forcePayment
  interface GeneratedReceipt { id: string; pdfUrl: string }
  const [receiptData, setReceiptData] = useState<GeneratedReceipt | null>(null)
  const [mounted, setMounted] = useState(false)
  const [globalAuthState, setGlobalAuthState] = useState(false)
  const [isFreeGenerating, setIsFreeGenerating] = useState(false)
  
  // Get available payment options for current network
  const availablePaymentOptions = useMemo(() => getAvailablePaymentOptions(chainId || 1), [chainId])
  const [selectedPayment, setSelectedPayment] = useState(availablePaymentOptions[0] || APP_CONFIG.PAYMENT_OPTIONS[0])

  const { payETH, isLoading: isPaymentETHLoading } = usePayETH()
  const { payToken, isLoading: isPaymentTokenLoading } = usePayToken()
  const { generateReceipt } = useGenerateReceipt()
  const { verifyTransaction } = useVerifyTransaction()

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
  } = useMultiTokenBalance(
    selectedPayment?.type || '',
    selectedPayment?.decimals
  )
  
  const { balance: ethBalance, isLoading: isEthBalanceLoading, hasInsufficientBalance: hasInsufficientETHBalance } = useETHBalance()
  
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
  const isBusy = step === Step.VERIFYING || step === Step.GENERATING || isPaymentLoading || isFreeGenerating
  const actionButtonBaseClass = 'rounded-2xl text-[12px] py-1.5 transition-all duration-300'
  const actionButtonWidthClass = compactMode ? 'w-auto min-w-[190px] mx-auto' : 'w-full'

  const selectedBalance = useMemo(() => {
    if (!selectedPayment) {
      return { value: '0', loading: false }
    }

    if (selectedPayment.type === 'ETH') {
      return { value: ethBalance, loading: isEthBalanceLoading }
    }

    return {
      value: multiTokenBalance || tokenBalance,
      loading: isMultiTokenBalanceLoading || isTokenBalanceLoading,
    }
  }, [
    selectedPayment,
    ethBalance,
    isEthBalanceLoading,
    multiTokenBalance,
    tokenBalance,
    isMultiTokenBalanceLoading,
    isTokenBalanceLoading,
  ])

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
    if (!initialTxHash) {
      return
    }

    setForm((prev) => ({ ...prev, txHash: initialTxHash }))
    if (startFromPayment) {
      setStep(canUseFreeStep ? Step.FREE : Step.PAYMENT)
    } else {
      setStep(Step.INPUT)
    }
    setReceiptData(null)
  }, [initialTxHash, startFromPayment, canUseFreeStep])

  useEffect(() => {
    if (!startFromPayment || !initialTxHash) {
      return
    }

    if (canUseFreeStep && step === Step.PAYMENT) {
      setStep(Step.FREE)
    }
  }, [startFromPayment, initialTxHash, canUseFreeStep, step])

  useEffect(() => {
    if (!isConnected && (step === Step.PAYMENT || step === Step.GENERATING)) {
      setStep(Step.INPUT)
      toast.error('Wallet disconnected. Please reconnect to continue.')
    }
  }, [isConnected, step])

  useEffect(() => {
    if (!onBusyChange) {
      return
    }

    onBusyChange(isBusy)
    return () => onBusyChange(false)
  }, [isBusy, onBusyChange])

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
        if (canUseFreeStep) {
          setStep(Step.FREE)
          return
        }
        setStep(Step.PAYMENT)
      } else {
        setStep(Step.INPUT)
      }
    }
  }, [isFullyAuthenticated, form, step, verifyTransaction, canUseFreeStep])

  const handleFreeGenerate = useCallback(async () => {
    if (isFreeGenerating) return
    setIsFreeGenerating(true)
    setStep(Step.GENERATING)
    try {
      const receipt = await generateReceipt({
        txHash: form.txHash,
        txChainId,
        description: form.description || undefined,
      })
      if (receipt) {
        setReceiptData(receipt)
        onReceiptGenerated?.({ txHash: form.txHash, receiptId: receipt.id, pdfUrl: receipt.pdfUrl })
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
  }, [isFreeGenerating, generateReceipt, form, txChainId, checkAuth, onReceiptGenerated])

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
          txChainId,
          description: form.description || undefined,
          paymentTxHash, // Pass the payment transaction hash for efficient verification
          paymentAmount: selectedPayment.amount, // Pass the actual payment amount used
          paymentType: selectedPayment.type, // Pass the payment type (ETH, USDT, USDC)
          paymentContractAddress: selectedPayment.contractAddress || undefined, // Pass contract address for tokens
        })
        
        if (receipt) {
          setReceiptData(receipt)
          onReceiptGenerated?.({ txHash: form.txHash, receiptId: receipt.id, pdfUrl: receipt.pdfUrl })
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
  }, [selectedPayment, payETH, payToken, detectedContractAddress, generateReceipt, form, txChainId, checkAuth, onReceiptGenerated])

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
      <div className="border border-gray-300 dark:border-gray-800 rounded-2xl bg-white/30 backdrop-blur-md dark:bg-black/30 p-8 animate-pulse transition-colors duration-300">
        <div className="h-6 bg-gray-200 dark:bg-gray-800 mb-4 transition-colors duration-300"></div>
        <div className="h-3 bg-gray-200 dark:bg-gray-800 mb-6 transition-colors duration-300"></div>
        <div className="h-16 bg-gray-200 dark:bg-gray-800 mb-4 transition-colors duration-300"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-800 transition-colors duration-300"></div>
      </div>
    )
  }

  if (step === Step.COMPLETE && receiptData) {
    return (
      <div className="border rounded-2xl  border-gray-300/50 dark:border-gray-800/50 bg-white/20 dark:bg-black/20 backdrop-blur-sm p-6 sm:p-8 transition-colors duration-300">
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
          
          <div className={compactMode ? 'grid grid-cols-1' : 'grid grid-cols-2 gap-3 sm:gap-4'}>
            <button
              onClick={handleDownload}
              className={`${actionButtonBaseClass} ${actionButtonWidthClass} btn-primary-minimal`}
            >
              Download PDF
            </button>
            {!compactMode && (
              <button
                onClick={resetForm}
                className={`${actionButtonBaseClass} ${actionButtonWidthClass} btn-secondary-minimal`}
              >
                Generate Another
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="border border-gray-300 dark:border-gray-800 rounded-2xl bg-white/20 backdrop-blur-md dark:bg-black/30 p-6 sm:p-8 transition-colors duration-300">
      {!compactMode && (
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
      ''
          )}
        </p>
      </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
        {!compactMode && (
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
            readOnly={startFromPayment}
            className="w-full px-3 py-1.5 rounded-xl border border-gray-300/50 dark:border-gray-800/50 bg-white/20 dark:bg-black/20 backdrop-blur-sm text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all duration-300 font-mono text-[12px]"
            required
          />
        </div>
        )}

        {!startFromPayment && (
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
            className="w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border rounded-2xl  border-gray-300/50 dark:border-gray-800/50 bg-white/20 dark:bg-black/20 backdrop-blur-sm text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all duration-300 resize-none text-xs sm:text-sm font-light"
          />
        </div>
        )}

        {step === Step.INPUT && (
          <button
            type="submit"
            disabled={!form.txHash || !isFullyAuthenticated}
            className={`${actionButtonBaseClass} w-auto min-w-[190px] mx-auto px-4 sm:px-6 font-light tracking-wide ${
              !form.txHash || !isFullyAuthenticated
                ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300 dark:border-gray-700'
                : 'btn-primary-minimal'
            }`}
          >
            {!isFullyAuthenticated ? 'Please Connect Wallet' : 'Verify Transaction'}
          </button>
        )}

        {step === Step.VERIFYING && (
          <div className="text-center py-6 sm:py-8">
            <div className="w-5 h-5 sm:w-6 sm:h-6 border border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-3 sm:mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-light transition-colors duration-300">Verifying transaction on blockchain...</p>
            <p className="text-gray-500 text-xs font-light mt-2">This may take a few seconds</p>
          </div>
        )}

        {step === Step.PAYMENT && (
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4 sm:mb-4 text-xs sm:text-sm font-light transition-colors duration-300">Choose your payment method</p>
            {batchPayableRemaining > 0 && (
              <p className="text-[11px] text-orange-500 dark:text-orange-400 mb-3">
                Remaining payable receipts in batch: {batchPayableRemaining}
              </p>
            )}
            
            {/* Payment Method Selector */}
            <div className="mb-4 sm:mb-4">
              <AnimatedPillNav
                items={availablePaymentOptions.map((option) => ({
                  key: option.type,
                  label: `${formatPaymentAmountDisplay(option.amount)} ${option.symbol}`,
                  onClick: () => setSelectedPayment(option),
                }))}
                activeKey={selectedPayment?.type || null}
                className="relative grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3"
                itemBaseClassName="relative overflow-hidden rounded-xl px-3 py-1.5 text-[12px] transition-colors duration-300 font-light"
                itemActiveClassName="text-orange-400 dark:text-orange-400"
                itemInactiveClassName="text-gray-900 dark:text-gray-300 hover:text-orange-400 dark:hover:text-orange-400"
                pillClassName="absolute inset-0 rounded-2xl border border-orange-400/90 bg-orange-400/10 shadow-[0_0_0_1px_rgba(251,146,60,0.25),0_8px_20px_rgba(251,146,60,0.18)]"
              />
              {availablePaymentOptions.length === 0 && (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400 text-xs sm:text-sm">
                  No payment options available on this network. Please switch to a supported network.
                </div>
              )}

              {selectedPayment && (
                <p className="mt-3 text-[11px] text-gray-500 dark:text-gray-400">
                  Balance:{' '}
                  <span className="text-gray-700 dark:text-gray-300">
                    {selectedBalance.loading ? 'Loading...' : `${formatPaymentAmountDisplay(Number(selectedBalance.value || 0))} ${selectedPayment.symbol}`}
                  </span>
                </p>
              )}
            </div>
            
            <div className={startFromPayment ? 'grid grid-cols-1' : 'grid grid-cols-2 gap-3'}>
              {!startFromPayment && (
              <button
                type="button"
                onClick={() => setStep(Step.INPUT)}
                className={`${actionButtonBaseClass} ${actionButtonWidthClass} btn-secondary-minimal`}
              >
                Back
              </button>
              )}
              <button
                type="button"
                onClick={handlePayment}
                disabled={
                  isPaymentLoading || insufficientBalance
                }
                className={`${actionButtonBaseClass} ${actionButtonWidthClass} ${
                  isPaymentLoading || insufficientBalance
                    ? 'bg-transparent text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300/70 dark:border-gray-700'
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
              {batchPayableRemaining > 0 && (
                <span className="block mt-2 text-[11px] text-orange-500 dark:text-orange-400">
                  Payment will still be required for {batchPayableRemaining} receipt{batchPayableRemaining !== 1 ? 's' : ''} in this batch.
                </span>
              )}
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
            <div className={startFromPayment ? 'grid grid-cols-1' : 'grid grid-cols-2 gap-3 sm:gap-4'}>
              {!startFromPayment && (
              <button
                type="button"
                onClick={() => setStep(Step.INPUT)}
                className={`${actionButtonBaseClass} ${actionButtonWidthClass} btn-secondary-minimal`}
                disabled={isFreeGenerating}
              >
                Back
              </button>
              )}
              <button
                type="button"
                onClick={handleFreeGenerate}
                disabled={isFreeGenerating}
                className={`${actionButtonBaseClass} ${actionButtonWidthClass} ${
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
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-orange-400 border-t-transparent animate-spin mx-auto mb-3 sm:mb-4"></div>
            <p className="text-black dark:text-white font-light text-xs sm:text-sm tracking-wide transition-colors duration-300">Generating your receipt...</p>
            <p className="text-gray-500 text-xs font-light mt-2">This may take a few moments</p>
          </div>
        )}
      </form>
    </div>
  )
}
