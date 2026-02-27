'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAccount } from 'wagmi'
import { ApiClient } from '@/lib/api-client'
import { NetworkFilter } from '@/components/network-filter'
import { WalletTransferReceiptModal } from '@/components/wallet-transfer-receipt-modal'

interface WalletTransfer {
  hash: string
  from: string
  to: string
  value: number
  timestamp?: string
  asset: string
  category: 'external' | 'internal' | 'erc20' | 'erc721' | 'erc1155'
  blockNum: number
  chainId: number
  networkName: string
  explorerUrl: string
  receiptId?: string | null
  receiptPdfUrl?: string | null
  rawContract?: {
    address: string
    decimals: number
  }
}

interface TransfersResponse {
  address: string
  chainId: number | null
  count: number
  transfers: WalletTransfer[]
}

const CATEGORY_LABELS: Record<string, string> = {
  external: 'Native',
  internal: 'Internal',
  erc20: 'ERC-20',
  erc721: 'NFT',
  erc1155: 'Multi',
}

function truncateAddress(addr: string) {
  if (!addr) return ''
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

function formatValue(val: number) {
  if (val === 0) return '0'
  if (val < 0.0001) return '< 0.0001'
  if (val < 1) return val.toPrecision(4)
  if (val < 10000) return val.toLocaleString(undefined, { maximumFractionDigits: 4 })
  return val.toLocaleString(undefined, { maximumFractionDigits: 2 })
}

function formatTimestamp(timestamp?: string) {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return '-'

  const now = new Date()
  const sameYear = date.getFullYear() === now.getFullYear()

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: '2-digit' }),
  }).format(date)
}

function OverflowSafeTooltip({
  content,
  children,
  tooltipClassName = '',
}: {
  content: string
  children: React.ReactNode
  tooltipClassName?: string
}) {
  const triggerRef = useRef<HTMLSpanElement | null>(null)
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })

  const updatePosition = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setPosition({
      top: rect.bottom + 8,
      left: rect.left + rect.width / 2,
    })
  }, [])

  const show = useCallback(() => {
    updatePosition()
    setVisible(true)
  }, [updatePosition])

  const hide = useCallback(() => setVisible(false), [])

  return (
    <>
      <span
        ref={triggerRef}
        className="inline-block max-w-full"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </span>
      {visible && typeof window !== 'undefined' && createPortal(
        <span
          className={`pointer-events-none fixed z-[9999] -translate-x-1/2 whitespace-nowrap rounded-md border border-gray-300/70 dark:border-gray-700 bg-white/95 dark:bg-black/95 px-2 py-1 text-[10px] text-gray-700 dark:text-gray-200 ${tooltipClassName}`}
          style={{ top: `${position.top}px`, left: `${position.left}px` }}
        >
          {content}
        </span>,
        document.body,
      )}
    </>
  )
}

export function WalletTransfers() {
  const { address, isConnected } = useAccount()
  const [selectedChainId, setSelectedChainId] = useState<number | null>(1)
  const [transfers, setTransfers] = useState<WalletTransfer[]>([])
  const [loading, setLoading] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedTransfer, setSelectedTransfer] = useState<WalletTransfer | null>(null)

  const fetchTransfers = useCallback(async (chainId: number | null) => {
    if (!address) return
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (chainId) params.set('chainId', chainId.toString())
      params.set('maxCount', '50')
      // Include native transfers (ETH and other chain native assets) alongside ERC-20.
      params.set('category', 'external,erc20')
      const res = await ApiClient.get(`/api/receipts/wallet/${address}/transfers?${params}`)
      const data: TransfersResponse = await res.json()
      setTransfers(data.transfers)
      setLoaded(true)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to fetch transfers')
      setTransfers([])
    } finally {
      setLoading(false)
    }
  }, [address])
  const handleChainChange = (chainId: number | null) => {
    setSelectedChainId(chainId)
    setLoaded(false)
    setTransfers([])
  }

  const handleDownloadExistingReceipt = (transfer: WalletTransfer, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!transfer.receiptPdfUrl) {
      return
    }

    const link = document.createElement('a')
    link.href = transfer.receiptPdfUrl
    link.target = '_blank'
    link.rel = 'noopener noreferrer'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleReceiptGenerated = (data: { txHash: string; receiptId: string; pdfUrl: string }) => {
    setTransfers((prev) =>
      prev.map((transfer) =>
        transfer.hash.toLowerCase() === data.txHash.toLowerCase()
          ? { ...transfer, receiptId: data.receiptId, receiptPdfUrl: data.pdfUrl }
          : transfer,
      ),
    )
  }

  useEffect(() => {
    if (!isConnected || !address) {
      return
    }

    void fetchTransfers(selectedChainId)
  }, [isConnected, address, selectedChainId, fetchTransfers])

  if (!isConnected || !address) {
    return (
      <div className="w-full text-center py-12 text-gray-400 dark:text-gray-600 text-xs">
        Please connect your wallet to load transactions.
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white tracking-wide">
          Wallet Transfers
        </h3>
        <div className="flex items-center gap-3">
          <NetworkFilter
            selectedChainId={selectedChainId}
            onChainIdChange={handleChainChange}
          />
          <button
            onClick={() => fetchTransfers(selectedChainId)}
            disabled={loading}
            className="px-4 py-2 text-xs font-medium rounded-2xl border border-orange-400/50 text-orange-500 hover:bg-orange-400/10 hover:border-orange-400 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border border-orange-400 border-t-transparent rounded-full animate-spin" />
                Loading…
              </span>
            ) : loaded ? 'Refresh' : 'Load'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 px-4 py-3 rounded-xl border border-red-300 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10 text-red-600 dark:text-red-400 text-xs">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-12 text-gray-500 dark:text-gray-400">
          <span className="w-6 h-6 border-2 border-orange-400 border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs">Loading transfers...</p>
        </div>
      )}

      {/* Empty state before loading */}
      {!loaded && !loading && (
        <>
          <div className="text-center py-12 text-gray-400 dark:text-gray-600 text-xs">
            Select a network and press <span className="text-orange-400">Load</span> to see transfers
          </div>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800">
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-3 w-20 bg-gray-200 dark:bg-gray-800 rounded" />
                <div className="h-3 w-24 bg-gray-200 dark:bg-gray-800 rounded flex-1" />
                <div className="h-3 w-16 bg-gray-200 dark:bg-gray-800 rounded" />
              </div>
            ))}
          </div>
        </>
      )}

      {/* Results table */}
      {loaded && !loading && transfers.length === 0 && (
        <div className="text-center py-12 text-gray-400 dark:text-gray-600 text-xs">
          No transfers found for this network
        </div>
      )}

      {loaded && !loading && transfers.length > 0 && (
        <div className="overflow-x-auto rounded-xl bg-white/10 dark:bg-black/30 backdrop-blur-sm  border border-gray-300 dark:border-gray-800">
   <table className="w-full text-xs border-collapse">
  <thead className="table w-full table-fixed">
    <tr className="border-b border-gray-300 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.02]">
      <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Date</th>
      <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Tx Hash</th>
      <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Network</th>
      <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Type</th>
      <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">From</th>
      <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">To</th>
      <th className="text-right px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Amount</th>
      <th className="text-left px-4 py-3 font-medium text-gray-500 dark:text-gray-400">Token</th>
      <th className="text-center px-4 py-3 w-[84px] min-w-[84px] font-medium text-gray-500 dark:text-gray-400">PDF</th>
    </tr>
  </thead>

  <tbody className="block max-h-[60vh] overflow-y-auto w-full">
    {transfers.map((t, idx) => {
      const isIncoming = t.to.toLowerCase() === address.toLowerCase()
      return (
        <tr
          key={`${t.hash}-${idx}`}
          onClick={() => setSelectedTransfer(t)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setSelectedTransfer(t)
            }
          }}
          tabIndex={0}
          role="button"
          className="table w-full table-fixed border-b border-gray-300 dark:border-gray-800/50 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors duration-150 cursor-pointer"
        >
          <td className="px-4 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap">
            <OverflowSafeTooltip content={formatTimestamp(t.timestamp)}>
              <span className="block truncate whitespace-nowrap max-w-full">
                {formatTimestamp(t.timestamp)}
              </span>
            </OverflowSafeTooltip>
          </td>

          <td className="px-4 py-3">
            <OverflowSafeTooltip content="Open in explorer" tooltipClassName="font-mono">
              <a
                href={t.explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-orange-500 hover:text-orange-400 font-mono transition-colors"
              >
                {truncateAddress(t.hash)}
              </a>
            </OverflowSafeTooltip>
          </td>

          <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
            <OverflowSafeTooltip content={t.networkName}>
              <span className="block truncate whitespace-nowrap max-w-full">
                {t.networkName}
              </span>
            </OverflowSafeTooltip>
          </td>

          <td className="px-4 py-3">
            <OverflowSafeTooltip content={`${isIncoming ? 'In' : 'Out'} • ${CATEGORY_LABELS[t.category] || t.category}`}>
              <div className="w-full whitespace-nowrap overflow-hidden">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${
                isIncoming
                  ? 'text-green-700 dark:text-green-400'
                  : 'text-red-700 dark:text-red-400'
              }`}>
                {isIncoming ? '↓ In' : '↑ Out'}
              </span>
              <span className="ml-1.5 text-gray-400 dark:text-gray-600 text-[10px] truncate inline-block align-middle max-w-[72px]">
                {CATEGORY_LABELS[t.category] || t.category}
              </span>
              </div>
            </OverflowSafeTooltip>
          </td>

          <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400">
            <OverflowSafeTooltip content={t.from} tooltipClassName="font-mono">
              <span className="block truncate whitespace-nowrap max-w-full">{truncateAddress(t.from)}</span>
            </OverflowSafeTooltip>
          </td>

          <td className="px-4 py-3 font-mono text-gray-600 dark:text-gray-400">
            <OverflowSafeTooltip content={t.to} tooltipClassName="font-mono">
              <span className="block truncate whitespace-nowrap max-w-full">{truncateAddress(t.to)}</span>
            </OverflowSafeTooltip>
          </td>

          <td className="px-4 py-3 text-right font-mono text-gray-900 dark:text-white">
            <OverflowSafeTooltip content={String(t.value)} tooltipClassName="font-mono">
              <span className="block truncate whitespace-nowrap max-w-full">{formatValue(t.value)}</span>
            </OverflowSafeTooltip>
          </td>

          <td className="px-4 py-3">
            <OverflowSafeTooltip content={t.asset}>
              <span className="font-medium text-gray-700 dark:text-gray-300 block truncate whitespace-nowrap max-w-full">
                {t.asset}
              </span>
            </OverflowSafeTooltip>
          </td>

          <td className="px-4 py-3 w-[84px] min-w-[84px] text-center">
            {t.receiptId && t.receiptPdfUrl ? (
              <OverflowSafeTooltip content="Download PDF">
                <button
                  type="button"
                  onClick={(e) => handleDownloadExistingReceipt(t, e)}
                  className="inline-flex items-center justify-center text-orange-500 hover:text-orange-400 transition-colors"
                  aria-label="Download existing PDF"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v12m0 0l4-4m-4 4l-4-4M5 20h14" />
                  </svg>
                </button>
              </OverflowSafeTooltip>
            ) : (
              <span className="text-[10px] text-gray-400 dark:text-gray-600">-</span>
            )}
          </td>
        </tr>
      )
    })}
  </tbody>
</table>
        </div>
      )}

      {/* Count */}
      {loaded && !loading && transfers.length > 0 && (
        <div className="mt-3 text-right text-[10px] text-gray-400 dark:text-gray-600">
          {transfers.length} transfer{transfers.length !== 1 ? 's' : ''}
        </div>
      )}

      <WalletTransferReceiptModal
        transfer={selectedTransfer ? { hash: selectedTransfer.hash, chainId: selectedTransfer.chainId } : null}
        onClose={() => setSelectedTransfer(null)}
        onError={setError}
        onReceiptGenerated={handleReceiptGenerated}
      />
    </div>
  )
}
