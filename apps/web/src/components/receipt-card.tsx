'use client'

import Link from 'next/link'
import { formatDate } from '@transactproof/core'

interface Receipt {
  id: string
  txHash: string
  sender: string
  receiver: string
  amount: string
  token: string
  chainId: number
  pdfUrl: string
  description?: string
  createdAt: string
  explorerUrl?: string
}

interface ReceiptCardProps {
  receipt: Receipt
}

export function ReceiptCard({ receipt }: ReceiptCardProps) {
  const handleDownload = () => {
    window.open(receipt.pdfUrl, '_blank')
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const getNetworkName = (chainId: number) => {
    switch(chainId) {
      case 1: return 'Ethereum'
      case 8453: return 'Base'
      case 84532: return 'Base Sepolia'
      case 137: return 'Polygon'
      case 10: return 'Optimism'
      case 42161: return 'Arbitrum'
      default: return `Chain ${chainId}`
    }
  }

  const getExplorerName = (chainId: number) => {
    switch(chainId) {
      case 1: return 'Etherscan'
      case 8453: return 'BaseScan'
      case 84532: return 'BaseScan'
      case 137: return 'PolygonScan'
      case 10: return 'Optimistic Etherscan'
      case 42161: return 'Arbiscan'
      default: return 'Block Explorer'
    }
  }

  const getExplorerUrl = (chainId: number, txHash: string) => {
    switch(chainId) {
      case 1: return `https://etherscan.io/tx/${txHash}`
      case 8453: return `https://basescan.org/tx/${txHash}`
      case 84532: return `https://sepolia.basescan.org/tx/${txHash}`
      case 137: return `https://polygonscan.com/tx/${txHash}`
      case 10: return `https://optimistic.etherscan.io/tx/${txHash}`
      case 42161: return `https://arbiscan.io/tx/${txHash}`
      default: return `https://etherscan.io/tx/${txHash}`
    }
  }

  return (
    <div className="border border-gray-200 dark:border-gray-800 p-6 bg-gray-50 dark:bg-transparent hover:border-gray-300 dark:hover:border-gray-700 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <svg className="w-6 h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span className="text-xs font-light text-black dark:text-white tracking-wide transition-colors duration-300">Receipt</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-orange-400 font-light">{receipt.token}</span>
          <div className="w-1 h-1 bg-green-400"></div>
        </div>
      </div>

      {/* Amount */}
      <div className="mb-6">
        <p className="text-lg font-light text-black dark:text-white transition-colors duration-300">
          {parseFloat(receipt.amount).toFixed(6)} {receipt.token}
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500 font-light mt-1 transition-colors duration-300">
          {formatDate(receipt.createdAt)}
        </p>
      </div>

      {/* Transaction Details */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between text-xs">
          <span className="text-orange-400 font-light uppercase tracking-wider">From</span>
          <span className="font-mono text-black dark:text-white font-light transition-colors duration-300">{formatAddress(receipt.sender)}</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-orange-400 font-light uppercase tracking-wider">To</span>
          <span className="font-mono text-black dark:text-white font-light transition-colors duration-300">{formatAddress(receipt.receiver)}</span>
        </div>
        {receipt.description && (
          <div className="flex justify-between text-xs">
            <span className="text-orange-400 font-light uppercase tracking-wider">Description</span>
            <span className="text-black dark:text-white text-right flex-1 ml-2 truncate font-light transition-colors duration-300">
              {receipt.description}
            </span>
          </div>
        )}
      </div>

      {/* Transaction Hash */}
      <div className="mb-6">
        <p className="text-xs text-orange-400 uppercase tracking-wider mb-2">Transaction Hash</p>
        <p className="font-mono text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-900 p-3 border border-gray-200 dark:border-gray-800 truncate font-light transition-colors duration-300">
          {receipt.txHash}
        </p>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <button
          onClick={handleDownload}
          className="btn-primary-minimal text-xs py-2"
        >
          Download PDF
        </button>
        <Link
          href={`/receipt/${receipt.id}`}
          className="btn-secondary-minimal text-xs py-2 text-center"
        >
          View Details
        </Link>
      </div>

      {/* Explorer Link */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-900 transition-colors duration-300">
        <a
          href={receipt.explorerUrl || getExplorerUrl(receipt.chainId, receipt.txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center text-xs text-gray-500 dark:text-gray-500 hover:text-orange-400 transition-colors duration-300 font-light"
        >
          <svg className="w-3 h-3 text-orange-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          View on {getExplorerName(receipt.chainId)}
        </a>
      </div>
    </div>
  )
}