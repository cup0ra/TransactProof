'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useChainId, useSwitchChain } from 'wagmi'
import { APP_CONFIG } from '@/config'
import { NetworkFilter } from '@/components/network-filter'
import { ReceiptGenerator } from '@/components/receipt-generator'

type TransferForModal = {
  hash: string
  chainId: number
}

type WalletTransferReceiptModalProps = {
  transfer: TransferForModal | null
  onClose: () => void
  onError?: (message: string | null) => void
  onReceiptGenerated?: (data: { txHash: string; receiptId: string; pdfUrl: string }) => void
  batchMeta?: {
    total: number
    freeIncluded: number
    payable: number
  } | null
  batchPosition?: number | null
  batchPayableRemaining?: number
  forcePayment?: boolean
}

export function WalletTransferReceiptModal({
  transfer,
  onClose,
  onError,
  onReceiptGenerated,
  batchMeta,
  batchPosition,
  batchPayableRemaining = 0,
  forcePayment = false,
}: WalletTransferReceiptModalProps) {
  const currentChainId = useChainId()
  const { switchChain } = useSwitchChain()
  const [isPortalReady, setIsPortalReady] = useState(false)
  const [isReceiptFlowBusy, setIsReceiptFlowBusy] = useState(false)
  const [isSwitchingChain, setIsSwitchingChain] = useState(false)

  useEffect(() => {
    setIsPortalReady(true)
  }, [])

  useEffect(() => {
    if (!transfer) {
      setIsReceiptFlowBusy(false)
      setIsSwitchingChain(false)
    }
  }, [transfer])

  useEffect(() => {
    if (!transfer) {
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
  }, [transfer])

  const handleModalNetworkChange = async (chainId: number | null) => {
    if (!chainId) {
      return
    }

    if (chainId === currentChainId) {
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

  const isModalLocked = isReceiptFlowBusy || isSwitchingChain

  if (!transfer || !isPortalReady) {
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
            <h4 className="text-sm font-medium text-black dark:text-white">Generate Receipt</h4>
            <p className="mt-1 max-w-full truncate whitespace-nowrap text-[11px] text-gray-500 dark:text-gray-400 font-mono">{transfer.hash}</p>
            {batchMeta && (
              <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                Batch {batchPosition || 1}/{batchMeta.total} • Free: {batchMeta.freeIncluded} • Paid: {batchMeta.payable}
              </p>
            )}
            {batchMeta && batchPayableRemaining > 0 && (
              <p className="mt-1 text-[11px] text-orange-500 dark:text-orange-400">
                Payment pending for {batchPayableRemaining} receipt{batchPayableRemaining !== 1 ? 's' : ''}
              </p>
            )}
            {forcePayment && (
              <p className="mt-1 text-[11px] text-orange-500 dark:text-orange-400">
                Payment required for this receipt
              </p>
            )}
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

        <ReceiptGenerator
          initialTxHash={transfer.hash}
          txChainId={transfer.chainId}
          startFromPayment
          forcePayment={forcePayment}
          batchPayableRemaining={batchPayableRemaining}
          compactMode
          onBusyChange={setIsReceiptFlowBusy}
          onReceiptGenerated={onReceiptGenerated}
        />
      </div>
    </div>,
    document.body,
  )
}
