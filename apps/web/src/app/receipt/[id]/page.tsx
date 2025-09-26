'use client'

import { useParams, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { formatDate } from '@transactproof/core'
import { useAuth } from '@/hooks/use-auth'
import { ApiClient } from '@/lib/api-client'
import { toast } from 'react-hot-toast'


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
  transactionDetails?: ExtendedTransactionDetails
}

interface ExtendedTransactionDetails {
  hash: string
  sender: string
  receiver: string
  amount: string
  token: string
  timestamp: Date
  blockNumber: number
  explorerUrl: string
  blockHash: string
  transactionIndex: number
  gasUsed: string
  gasPrice: string
  gasLimit: string
  nonce: number
  status: 'success' | 'reverted' | 'pending'
  confirmations: number
  value: string
  input: string
  logs: any[]
  contractAddress?: string
}

export default function ReceiptDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user, isAuthenticated, initialCheckDone } = useAuth()
  const [receipt, setReceipt] = useState<Receipt | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!initialCheckDone) return

    if (!isAuthenticated) {
      router.push('/login')
      return
    }

    fetchReceipt()
  }, [isAuthenticated, initialCheckDone, params.id, router])

  const fetchReceipt = async () => {
    try {
      setLoading(true)
      
      const response = await ApiClient.get(`/api/receipts/${params.id}`)
      const data: Receipt = await response.json()
      setReceipt(data)
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === 'Authentication required') {
          // ApiClient уже перенаправил на /login
          return
        } else if (error.message.includes('404')) {
          setError('Receipt not found')
        } else if (error.message.includes('403')) {
          setError('Access denied')
        } else {
          setError('Failed to load receipt')
          toast.error('Failed to load receipt')
        }
      } else {
        setError('Failed to load receipt')
        toast.error('Failed to load receipt')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (receipt) {
      window.open(receipt.pdfUrl, '_blank')
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const formatHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`
  }

  const formatGas = (gas: string) => {
    return new Intl.NumberFormat().format(parseInt(gas))
  }

  const formatValue = (value: string, decimals: number = 18) => {
    const num = BigInt(value) / BigInt(10 ** decimals)
    return num.toString()
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success('Copied to clipboard!')
    } catch (error) {
      toast.error('Failed to copy to clipboard')
    }
  }

  const getNetworkName = (chainId: number) => {
    switch(chainId) {
      case 1: return 'Ethereum'
      case 8453: return 'Base'
      case 84532: return 'Base Sepolia'
      case 137: return 'Polygon'
      case 10: return 'Optimism'
      case 42161: return 'Arbitrum'
      case 324: return 'zkSync Era'
      case 56: return 'BNB Smart Chain'
      case 43114: return 'Avalanche'
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col transition-colors duration-300">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-6 h-6 border border-orange-500 border-t-transparent animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 text-xs font-light transition-colors duration-300">Loading receipt...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex flex-col transition-colors duration-300">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 border border-red-500 flex items-center justify-center mx-auto mb-6">
              <div className="w-3 h-3 bg-red-500"></div>
            </div>
            <h1 className="text-lg font-light text-black dark:text-white mb-4 tracking-wide transition-colors duration-300">{error || 'Receipt not found'}</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm font-light transition-colors duration-300">The receipt you're looking for doesn't exist or has been removed.</p>
            <Link href="/dashboard" className="btn-primary-minimal text-xs">
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black flex flex-col transition-colors duration-300">
      <main className="flex-1 py-16 sm:py-16 lg:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 sm:mb-12 lg:mb-16 gap-4 sm:gap-6">
          <div className="flex items-center space-x-4 sm:space-x-6">
            <Link href="/dashboard" className="text-gray-600 dark:text-gray-400 hover:text-orange-500 dark:hover:text-orange-500 transition-all duration-300 hover:scale-110 hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded-lg -m-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-lg sm:text-xl font-light text-black dark:text-white tracking-wide transition-colors duration-300">Receipt Details</h1>
          </div>
          <button
            onClick={handleDownload}
            className="btn-primary-minimal text-xs w-full sm:w-auto"
          >
            Download PDF
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
          {/* Main Content */}
          <div className="xl:col-span-2 space-y-6 sm:space-y-8">
            {/* Receipt Card */}
            <div className="border border-gray-300 dark:border-gray-800 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8 gap-4">
                <div className="flex items-center space-x-3 sm:space-x-4">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 transition-colors duration-300">
                    <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-light text-black dark:text-white tracking-wide transition-colors duration-300">Transaction Receipt</h2>
                    <p className="text-xs text-gray-500 font-light mt-1">{getNetworkName(receipt.chainId)} • {receipt.token}</p>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-2xl sm:text-2xl lg:text-3xl font-light text-black dark:text-white transition-colors duration-300 break-all">{parseFloat(receipt.amount).toFixed(6)}</p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-light transition-colors duration-300">{receipt.token}</p>
                </div>
              </div>

              {/* Transaction Details */}
              <div className="space-y-4 sm:space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div>
                    <label className="block text-xs font-light text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">From</label>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                      <code className="text-xs bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 px-2 sm:px-3 py-3 sm:py-3 text-gray-700 dark:text-gray-300 flex-1 font-mono font-light transition-colors duration-300 break-all leading-relaxed">
                        {receipt.sender}
                      </code>
                      <button
                        onClick={() => copyToClipboard(receipt.sender)}
                        className="p-2 sm:p-2 text-gray-500 hover:text-orange-500 transition-colors duration-300 flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                        title="Copy address"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-light text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">To</label>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                      <code className="text-xs bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 px-2 sm:px-3 py-3 sm:py-3 text-gray-700 dark:text-gray-300 flex-1 font-mono font-light transition-colors duration-300 break-all leading-relaxed">
                        {receipt.receiver}
                      </code>
                      <button
                        onClick={() => copyToClipboard(receipt.receiver)}
                        className="p-2 sm:p-2 text-gray-500 hover:text-orange-500 transition-colors duration-300 flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                        title="Copy address"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-light text-gray-500 uppercase tracking-wider mb-2 sm:mb-3">Transaction Hash</label>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                    <code className="text-xs bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 px-2 sm:px-3 py-3 sm:py-3 text-gray-700 dark:text-gray-300 flex-1 break-all font-mono font-light transition-colors duration-300 leading-relaxed">
                      {receipt.txHash}
                    </code>
                    <button
                      onClick={() => copyToClipboard(receipt.txHash)}
                      className="p-2 sm:p-2 text-gray-500 hover:text-orange-500 transition-colors duration-300 flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                      title="Copy transaction hash"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>                {receipt.description && (
                  <div>
                    <label className="block text-xs font-light text-gray-500 uppercase tracking-wider mb-3">Description</label>
                    <p className="text-black dark:text-white bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 px-3 py-3 text-xs font-light transition-colors duration-300">
                      {receipt.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* External Links */}
            <div className="border border-gray-300 dark:border-gray-800 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
              <h3 className="text-sm font-light text-black dark:text-white mb-4 sm:mb-6 tracking-wide uppercase transition-colors duration-300">External Links</h3>
              <div className="space-y-4">
                <a
                  href={receipt.transactionDetails?.explorerUrl || receipt.explorerUrl || `https://etherscan.io/tx/${receipt.txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 sm:p-4 border border-gray-300 dark:border-gray-800 hover:border-gray-400 dark:hover:border-gray-700 transition-colors duration-300">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400 transition-colors duration-300 flex-shrink-0">
                      <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19,7V4H5V7H19M21,2A2,2 0 0,1 23,4V20A2,2 0 0,1 21,22H3A2,2 0 0,1 1,20V4A2,2 0 0,1 3,2H21M3,20H21V8H3V20Z" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-light text-black dark:text-white text-xs transition-colors duration-300">View on {getExplorerName(receipt.chainId)}</p>
                      <p className="text-xs text-gray-500 font-light">See transaction details on block explorer</p>
                    </div>
                  </div>
                  <div className="w-3 h-3 sm:w-4 sm:h-4 text-gray-400 dark:text-gray-600 transition-colors duration-300 flex-shrink-0">
                    <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </div>
                </a>
              </div>
            </div>

            {/* Extended Transaction Details */}
            {receipt.transactionDetails && (
              <div className="border border-gray-300 dark:border-gray-800 p-4 sm:p-6 lg:p-8 transition-colors duration-300">
                <div className="flex items-center justify-between mb-6 sm:mb-8">
                  <h3 className="text-sm font-light text-black dark:text-white tracking-wide uppercase transition-colors duration-300">Blockchain Details</h3>
                </div>
                
                <div className="space-y-4">
                  {/* Block Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-light text-gray-500 uppercase tracking-wider mb-3">Block Number</label>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                        <code className="text-xs bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 px-3 py-3 text-gray-700 dark:text-gray-300 flex-1 font-mono font-light transition-colors duration-300">
                          {receipt.transactionDetails.blockNumber.toLocaleString()}
                        </code>
                        <button
                          onClick={() => copyToClipboard(receipt.transactionDetails?.blockNumber.toString() || '')}
                          className="p-2 sm:p-2 text-gray-500 hover:text-orange-500 transition-colors duration-300 flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                          title="Copy block number"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-light text-gray-500 uppercase tracking-wider mb-3">Transaction Index</label>
                      <div className="flex items-center space-x-3">
                        <code className="text-xs bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 px-3 py-3 text-gray-700 dark:text-gray-300 flex-1 font-mono font-light transition-colors duration-300">
                          {receipt.transactionDetails.transactionIndex}
                        </code>
                      </div>
                    </div>
                  </div>

                  {/* Block Hash */}
                  <div>
                    <label className="block text-xs font-light text-gray-500 uppercase tracking-wider mb-3">Block Hash</label>
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                      <code className="text-xs bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 px-3 py-3 text-gray-700 dark:text-gray-300 flex-1 break-all font-mono font-light transition-colors duration-300 leading-relaxed">
                        {receipt.transactionDetails.blockHash}
                      </code>
                      <button
                        onClick={() => copyToClipboard(receipt.transactionDetails?.blockHash || '')}
                        className="p-2 sm:p-2 text-gray-500 hover:text-orange-500 transition-colors duration-300 flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                        title="Copy block hash"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Gas Information */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-xs font-light text-gray-500 uppercase tracking-wider mb-3">Gas Used</label>
                      <code className="text-xs bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 px-3 py-3 text-gray-700 dark:text-gray-300 block font-mono font-light transition-colors duration-300">
                        {formatGas(receipt.transactionDetails.gasUsed)}
                      </code>
                    </div>
                    <div>
                      <label className="block text-xs font-light text-gray-500 uppercase tracking-wider mb-3">Gas Limit</label>
                      <code className="text-xs bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 px-3 py-3 text-gray-700 dark:text-gray-300 block font-mono font-light transition-colors duration-300">
                        {formatGas(receipt.transactionDetails.gasLimit)}
                      </code>
                    </div>
                    <div>
                      <label className="block text-xs font-light text-gray-500 uppercase tracking-wider mb-3">Gas Price (Gwei)</label>
                      <code className="text-xs bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 px-3 py-3 text-gray-700 dark:text-gray-300 block font-mono font-light transition-colors duration-300">
                        {parseFloat(receipt.transactionDetails.gasPrice).toFixed(2)}
                      </code>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-light text-gray-500 uppercase tracking-wider mb-3">Nonce</label>
                      <code className="text-xs bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 px-3 py-3 text-gray-700 dark:text-gray-300 block font-mono font-light transition-colors duration-300">
                        {receipt.transactionDetails.nonce}
                      </code>
                    </div>
                    <div>
                      <label className="block text-xs font-light text-gray-500 uppercase tracking-wider mb-3">Confirmations</label>
                      <code className="text-xs bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 px-3 py-3 text-gray-700 dark:text-gray-300 block font-mono font-light transition-colors duration-300">
                        {receipt.transactionDetails.confirmations.toLocaleString()}
                      </code>
                    </div>
                  </div>

                  {/* Transaction Input Data */}
                  {receipt.transactionDetails.input && receipt.transactionDetails.input !== '0x' && (
                    <div>
                      <label className="block text-xs font-light text-gray-500 uppercase tracking-wider mb-3">Input Data</label>
                      <div className="flex flex-col sm:flex-row sm:items-start space-y-2 sm:space-y-0 sm:space-x-3">
                        <code className="text-xs bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 px-3 py-3 text-gray-700 dark:text-gray-300 flex-1 break-all font-mono font-light max-h-32 overflow-y-auto transition-colors duration-300 leading-relaxed">
                          {receipt.transactionDetails.input}
                        </code>
                        <button
                          onClick={() => copyToClipboard(receipt.transactionDetails?.input || '')}
                          className="p-2 sm:p-2 text-gray-500 hover:text-orange-500 transition-colors duration-300 flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                          title="Copy input data"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Contract Address (for contract creation) */}
                  {receipt.transactionDetails.contractAddress && (
                    <div>
                      <label className="block text-xs font-light text-gray-500 uppercase tracking-wider mb-3">Contract Created</label>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                        <code className="text-xs bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 px-3 py-3 text-gray-700 dark:text-gray-300 flex-1 font-mono font-light transition-colors duration-300 break-all leading-relaxed">
                          {receipt.transactionDetails.contractAddress}
                        </code>
                        <button
                          onClick={() => copyToClipboard(receipt.transactionDetails?.contractAddress || '')}
                          className="p-2 sm:p-2 text-gray-500 hover:text-orange-500 transition-colors duration-300 flex-shrink-0 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                          title="Copy contract address"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Event Logs */}
                  {receipt.transactionDetails.logs && receipt.transactionDetails.logs.length > 0 && (
                    <div>
                      <label className="block text-xs font-light text-gray-500 uppercase tracking-wider mb-3">Event Logs ({receipt.transactionDetails.logs.length})</label>
                      <div className="bg-gray-50 dark:bg-black border border-gray-300 dark:border-gray-700 max-h-48 overflow-y-auto transition-colors duration-300">
                        {receipt.transactionDetails.logs.map((log: any, index: number) => (
                          <div key={index} className="border-b border-gray-200 dark:border-gray-800 last:border-b-0 p-4 transition-colors duration-300">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-light text-orange-400">Log #{log.logIndex}</span>
                              <code className="text-xs text-gray-600 dark:text-gray-400 font-mono font-light transition-colors duration-300">{formatAddress(log.address)}</code>
                            </div>
                            <div className="space-y-2">
                              {log.topics.map((topic: string, topicIndex: number) => (
                                <div key={topicIndex} className="text-xs text-gray-700 dark:text-gray-300 font-mono font-light break-all transition-colors duration-300">
                                  <span className="text-gray-500">Topic {topicIndex}:</span> {topic}
                                </div>
                              ))}
                              {log.data && log.data !== '0x' && (
                                <div className="text-xs text-gray-700 dark:text-gray-300 font-mono font-light break-all transition-colors duration-300">
                                  <span className="text-gray-500">Data:</span> {log.data}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Status */}
            <div className="border border-gray-300 dark:border-gray-800 p-4 sm:p-6 transition-colors duration-300">
              <h3 className="text-sm font-light text-black dark:text-white mb-4 sm:mb-6 tracking-wide uppercase transition-colors duration-300">Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-light uppercase tracking-wider">Status</span>
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-light border ${
                    receipt.transactionDetails?.status === 'success' 
                      ? 'bg-green-500/10 text-green-400 border-green-500/30'
                      : receipt.transactionDetails?.status === 'reverted'
                      ? 'bg-red-500/10 text-red-400 border-red-500/30'
                      : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30'
                  }`}>
                    {receipt.transactionDetails?.status === 'success' ? 'Confirmed' : 
                     receipt.transactionDetails?.status === 'reverted' ? 'Failed' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-light uppercase tracking-wider">Network</span>
                  <span className="text-xs font-light text-black dark:text-white transition-colors duration-300">{getNetworkName(receipt.chainId)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 font-light uppercase tracking-wider">Chain ID</span>
                  <span className="text-xs font-light text-black dark:text-white transition-colors duration-300">{receipt.chainId}</span>
                </div>
                {receipt.transactionDetails && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-light uppercase tracking-wider">Confirmations</span>
                    <span className="text-xs font-light text-black dark:text-white transition-colors duration-300">{receipt.transactionDetails.confirmations.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Timestamps */}
            <div className="border border-gray-300 dark:border-gray-800 p-4 sm:p-6 transition-colors duration-300">
              <h3 className="text-sm font-light text-black dark:text-white mb-4 sm:mb-6 tracking-wide uppercase transition-colors duration-300">Timestamps</h3>
              <div className="space-y-4">
                <div>
                  <span className="text-xs text-gray-500 font-light uppercase tracking-wider">Created</span>
                  <p className="text-xs font-light text-black dark:text-white mt-1 transition-colors duration-300">
                    {formatDate(receipt.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="border border-gray-300 dark:border-gray-800 p-4 sm:p-6 transition-colors duration-300">
              <h3 className="text-sm font-light text-black dark:text-white mb-4 sm:mb-6 tracking-wide uppercase transition-colors duration-300">Actions</h3>
              <div className="space-y-4">
                <button
                  onClick={handleDownload}
                  className="w-full btn-primary-minimal text-xs py-3"
                >
                  Download PDF
                </button>
                <Link
                  href="/dashboard"
                  className="w-full btn-secondary-minimal text-xs py-3 text-center"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
        </div>
      </main>
    </div>
  )
}