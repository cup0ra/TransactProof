'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { toast } from 'react-hot-toast'
import { useChainId, useSwitchChain } from 'wagmi'
import { APP_CONFIG, getAvailablePaymentOptions } from '@/config'
import { ApiClient } from '@/lib/api-client'
import { NetworkFilter } from '@/components/network-filter'
import { AnimatedPillNav } from '@/components/animated-pill-nav'
import { usePayETH } from '@/hooks/use-pay-eth'
import { usePayToken } from '@/hooks/use-pay-token'
import { useTokenBalance } from '@/hooks/use-token-balance'
import { useMultiTokenBalance } from '@/hooks/use-multi-token-balance'
import { useETHBalance } from '@/hooks/use-eth-balance'
import { formatPaymentAmountDisplay } from '@/utils/format-numbers'

type BatchTransfer = {
  hash: string
  chainId: number
}

type BatchMeta = {
  total: number
  freeIncluded: number
  payable: number
}

type BatchResult = {
  receipts: Array<{ id: string; txHash: string; pdfUrl: string }>
  generatedCount: number
  failedTxHashes?: string[]
}

type WalletTransferBatchReceiptModalProps = {
  isOpen: boolean
  transfers: BatchTransfer[]
  batchMeta: BatchMeta | null
  onClose: () => void
  onError?: (message: string | null) => void
  onCompleted: (result: BatchResult) => void
}

export function WalletTransferBatchReceiptModal({
  isOpen,
  transfers,
  batchMeta,
  onClose,
  onError,
  onCompleted,
}: WalletTransferBatchReceiptModalProps) {
  const currentChainId = useChainId()
  const { switchChain } = useSwitchChain()
  const { payETH, isLoading: isPayingETH } = usePayETH()
  const { payToken, isLoading: isPayingToken } = usePayToken()

  const [isPortalReady, setIsPortalReady] = useState(false)
  const [isSwitchingChain, setIsSwitchingChain] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const availablePaymentOptions = useMemo(
    () => getAvailablePaymentOptions(currentChainId || 1),
    [currentChainId],
  )

  const [selectedPaymentType, setSelectedPaymentType] = useState<string | null>(null)

  const selectedPayment = useMemo(
    () => availablePaymentOptions.find((option) => option.type === selectedPaymentType) || availablePaymentOptions[0] || null,
    [availablePaymentOptions, selectedPaymentType],
  )

  useEffect(() => {
    setIsPortalReady(true)
  }, [])

  useEffect(() => {
    if (selectedPayment) {
      setSelectedPaymentType(selectedPayment.type)
      return
    }

    if (availablePaymentOptions.length > 0) {
      setSelectedPaymentType(availablePaymentOptions[0].type)
    } else {
      setSelectedPaymentType(null)
    }
  }, [availablePaymentOptions, selectedPayment])

  useEffect(() => {
    if (!isOpen) {
      setIsSubmitting(false)
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const scrollY = window.scrollY
    const previousHtmlOverflow = document.documentElement.style.overflow
    const previousBodyOverflow = document.body.style.overflow
    const previousBodyPosition = document.body.style.position
    const previousBodyTop = document.body.style.top
    const previousBodyWidth = document.body.style.width

    document.documentElement.style.overflow = 'hidden'
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'

    return () => {
      document.documentElement.style.overflow = previousHtmlOverflow
      document.body.style.overflow = previousBodyOverflow
      document.body.style.position = previousBodyPosition
      document.body.style.top = previousBodyTop
      document.body.style.width = previousBodyWidth
      window.scrollTo(0, scrollY)
    }
  }, [isOpen])

  const payableCount = batchMeta?.payable || 0
  const totalCount = batchMeta?.total || transfers.length
  const isModalLocked = isSubmitting || isSwitchingChain || isPayingETH || isPayingToken

  const { balance: ethBalance, isLoading: isEthBalanceLoading } = useETHBalance()
  const { balance: tokenBalance, isLoading: isTokenBalanceLoading } = useTokenBalance(
    selectedPayment?.contractAddress || undefined,
    selectedPayment?.decimals,
  )
  const { balance: multiTokenBalance, isLoading: isMultiTokenBalanceLoading } = useMultiTokenBalance(
    selectedPayment?.type || '',
    selectedPayment?.decimals,
  )

  const selectedBalance = selectedPayment?.type === 'ETH'
    ? { value: ethBalance, loading: isEthBalanceLoading }
    : { value: multiTokenBalance || tokenBalance, loading: isMultiTokenBalanceLoading || isTokenBalanceLoading }

  const handleModalNetworkChange = async (chainId: number | null) => {
    if (!chainId || chainId === currentChainId) {
      return
    }

    try {
      setIsSwitchingChain(true)
      await switchChain({ chainId })
    } catch {
      onError?.('Failed to switch network in wallet')
    } finally {
      setIsSwitchingChain(false)
    }
  }

  const handleSubmit = async () => {
    if (!batchMeta || transfers.length === 0) {
      return
    }

    const toastId = 'batch-generate'

    try {
      setIsSubmitting(true)
      onError?.(null)
      toast.loading('Preparing batch request...', { id: toastId, duration: Infinity })

      let paymentTxHash: string | undefined
      let paymentAmount: number | undefined
      let paymentType: string | undefined
      let paymentContractAddress: string | undefined

      if (payableCount > 0) {
        if (!selectedPayment) {
          throw new Error('No payment method is available on selected network')
        }

        paymentAmount = selectedPayment.amount * payableCount
        paymentType = selectedPayment.type
        paymentContractAddress = selectedPayment.contractAddress || undefined

        toast.loading(`Processing one payment for ${payableCount} receipt(s)...`, { id: toastId, duration: Infinity })

        if (selectedPayment.type === 'ETH') {
          paymentTxHash = (await payETH(paymentAmount)) || undefined
        } else {
          if (!selectedPayment.contractAddress) {
            throw new Error(`${selectedPayment.symbol} is not supported on selected network`)
          }
          paymentTxHash = (await payToken(
            selectedPayment.contractAddress,
            paymentAmount,
            selectedPayment.symbol,
            selectedPayment.decimals,
          )) || undefined
        }

        if (!paymentTxHash) {
          toast.dismiss(toastId)
          return
        }
      }

      toast.loading(`Generating ${totalCount} receipt(s)`, { id: toastId, duration: Infinity })

      const response = await ApiClient.post('/api/receipts/pay-and-generate-batch', {
        transactions: transfers.map((transfer) => ({ hash: transfer.hash, chainId: transfer.chainId })),
        paymentTxHash,
        paymentAmount,
        paymentType,
        paymentContractAddress,
      })

      const result: BatchResult = await response.json()
      onCompleted(result)
      toast.dismiss(toastId)

      if (result.failedTxHashes && result.failedTxHashes.length > 0) {
        toast.error(`Generated ${result.generatedCount}/${totalCount}. Failed: ${result.failedTxHashes.length}`, {
          id: `${toastId}-done`,
          duration: 5000,
        })
      } else {
        toast.success(`Generated ${result.generatedCount} receipt(s)`, {
          id: `${toastId}-done`,
          duration: 4000,
        })
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to generate batch receipts'
      onError?.(message)
      toast.dismiss(toastId)
      toast.error(message, { id: `${toastId}-done`, duration: 5000 })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !isPortalReady || !batchMeta) {
    return null
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
      onClick={() => {
        if (!isModalLocked) {
          onClose()
        }
      }}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-gray-300/50 dark:border-gray-800/50 bg-white/70 dark:bg-black/60 p-4 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h4 className="text-sm font-medium text-black dark:text-white">Batch Generate Receipts</h4>
            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
              Total: {batchMeta.total} • Free: {batchMeta.freeIncluded} • Paid: {batchMeta.payable}
            </p>
          </div>
          <button
            type="button"
            className="rounded-xl border border-gray-300/70 dark:border-gray-700 px-2.5 py-1 text-xs text-gray-600 dark:text-gray-300 hover:text-orange-400 hover:border-orange-400 dark:hover:text-orange-400 dark:hover:text-orange-400 dark:hover:border-orange-400 transition-colors"
            disabled={isModalLocked}
            onClick={onClose}
          >
            Close
          </button>
        </div>

        <div className="mb-4 flex items-center justify-between gap-3">
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Payment network: {APP_CONFIG.NETWORK_NAMES[currentChainId] || `Chain ${currentChainId}`}
          </p>
          <NetworkFilter
            selectedChainId={currentChainId}
            onChainIdChange={(chainId) => {
              void handleModalNetworkChange(chainId)
            }}
            availableNetworks={Object.keys(APP_CONFIG.NETWORK_NAMES).map((id) => Number(id))}
            className="shrink-0"
          />
        </div>

        <div className="border border-gray-300/50 dark:border-gray-800/50 rounded-2xl bg-white/20 dark:bg-black/20 backdrop-blur-sm p-5">
          {payableCount > 0 ? (
            <>
              <p className="text-gray-600 text-center dark:text-gray-400 mb-3 text-xs sm:text-sm font-light">
                Choose payment token
              </p>
              <div className="mb-4">
                <AnimatedPillNav
                  items={availablePaymentOptions.map((option) => ({
                    key: option.type,
                    label: `${formatPaymentAmountDisplay(option.amount * payableCount)} ${option.symbol}`,
                    onClick: () => setSelectedPaymentType(option.type),
                  }))}
                  activeKey={selectedPayment?.type || null}
                  className="relative grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3"
                  itemBaseClassName="relative overflow-hidden rounded-xl px-3 py-1.5 text-[12px] transition-colors duration-300 font-light"
                  itemActiveClassName="text-orange-400 dark:text-orange-400"
                  itemInactiveClassName="text-gray-900 dark:text-gray-300 hover:text-orange-400 dark:hover:text-orange-400"
                  pillClassName="absolute inset-0 rounded-2xl border border-orange-400/90 bg-orange-400/10 shadow-[0_0_0_1px_rgba(251,146,60,0.25),0_8px_20px_rgba(251,146,60,0.18)]"
                />

                {selectedPayment && (
                  <p className="mt-3 text-center text-[11px] text-gray-500 dark:text-gray-400">
                    Balance:{' '}
                    <span className="text-gray-700 dark:text-gray-300">
                      {selectedBalance.loading
                        ? 'Loading...'
                        : `${formatPaymentAmountDisplay(Number(selectedBalance.value || 0))} ${selectedPayment.symbol}`}
                    </span>
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-xs sm:text-sm font-light">
              All selected receipts are covered by free generations. No payment is required.
            </p>
          )}

          <button
            type="button"
            onClick={() => { void handleSubmit() }}
            disabled={isModalLocked || (payableCount > 0 && !selectedPayment)}
            className={`flex w-fit mx-auto min-w-[280px] justify-center rounded-2xl text-[12px] px-5 py-2 transition-all duration-300 ${
              isModalLocked || (payableCount > 0 && !selectedPayment)
                ? 'bg-transparent text-gray-400 dark:text-gray-500 cursor-not-allowed border border-gray-300/70 dark:border-gray-700'
                : 'btn-primary-minimal'
            }`}
          >
            {isModalLocked
              ? 'Processing...'
              : payableCount > 0 && selectedPayment
                ? `Pay ${formatPaymentAmountDisplay(selectedPayment.amount * payableCount)} ${selectedPayment.symbol} and Generate ${totalCount}`
                : `Generate ${totalCount} PDFs`}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
