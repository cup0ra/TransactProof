'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ReceiptCard } from '@/components/receipt-card'
import { EmptyState } from '@/components/empty-state'
import { useAuth } from '@/hooks/use-auth'
import { useAccount } from 'wagmi'
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
}

interface PaginatedResponse {
  receipts: Receipt[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function DashboardPage() {
  const router = useRouter()
  const { isAuthenticated, user, initialCheckDone, checkAuth } = useAuth()
  const { isConnected } = useAccount()
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    pages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [selectedNetwork, setSelectedNetwork] = useState<number | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {    
    if (!mounted) {
      return
    }

    if (!initialCheckDone) {
      return
    }
    
    if (!isAuthenticated || !isConnected) {
      if (!redirecting) {
        setRedirecting(true)
        router.push('/login')
      }
      return
    }
    
    if (isAuthenticated && isConnected) {
      if (redirecting) {
        setRedirecting(false)
      }
      fetchReceipts()
    }
  }, [mounted, isAuthenticated, isConnected, initialCheckDone, router, redirecting])

  const fetchReceipts = async (page = 1) => {
    if (!isAuthenticated || redirecting || !isConnected) {
      return
    }

    try {
      setLoading(true)
      
      const response = await ApiClient.get(`/api/receipts/my?page=${page}&limit=10`)
      const data: PaginatedResponse = await response.json()
      
      setReceipts(data.receipts)
      setPagination(data.pagination)
    } catch (error) {
      if (error instanceof Error && (
        error.message === 'Authentication required' || 
        error.message === 'Unauthorized' ||
        error.message.includes('401')
      )) {
        return
      }
      if (!redirecting) {
        toast.error('Failed to load receipts')
      }
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.pages && !redirecting && isConnected && isAuthenticated) {
      fetchReceipts(newPage)
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
      default: return `Chain ${chainId}`
    }
  }

  const getUniqueNetworks = () => {
    const uniqueChainIds = Array.from(new Set(receipts.map(receipt => receipt.chainId)))
    return uniqueChainIds.map(chainId => getNetworkName(chainId)).join(', ') || 'Multi-chain'
  }

  const getUniqueChainIds = () => {
    return Array.from(new Set(receipts.map(receipt => receipt.chainId)))
  }

  const getFilteredReceipts = () => {
    if (!selectedNetwork) return receipts
    return receipts.filter(receipt => receipt.chainId === selectedNetwork)
  }

  const handleNetworkFilter = (chainId: number | null) => {
    setSelectedNetwork(chainId)
  }

  if (!mounted) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="w-6 h-6 border border-orange-400 border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-xs font-light">
            Loading...
          </p>
        </div>
      </div>
    )
  }
  
  if (!initialCheckDone) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="w-6 h-6 border border-orange-400 border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-xs font-light">
            Checking authentication...
          </p>
        </div>
      </div>
    )
  }

  if (redirecting) {
    return (
      <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="w-6 h-6 border border-orange-400 border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400 text-xs font-light">
            Redirecting to login...
          </p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null // This should not happen due to redirect logic above
  }

  return (
    <div className="py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="mb-8 sm:mb-12 lg:mb-16">
            <h1 className="text-lg sm:text-xl font-light text-black dark:text-white mb-3 sm:mb-4 tracking-wide transition-colors duration-300">Your Receipts</h1>
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-light transition-colors duration-300">
              View and download your crypto transaction receipts
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 lg:mb-16">
            <div className="border border-gray-200 dark:border-gray-800 p-4 sm:p-6 bg-gray-50 dark:bg-transparent transition-colors duration-300">
              <div className="flex items-center">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs font-light text-orange-400 uppercase tracking-wider">Total Receipts</p>
                  <p className="text-base sm:text-lg font-light text-black dark:text-white transition-colors duration-300">{pagination.total}</p>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-800 p-4 sm:p-6 bg-gray-50 dark:bg-transparent transition-colors duration-300">
              <div className="flex items-center">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs font-light text-orange-400 uppercase tracking-wider">Connected Wallet</p>
                  <p className="text-xs font-mono text-black dark:text-white font-light transition-colors duration-300 truncate">
                    {user?.walletAddress ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}` : ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="border border-gray-200 dark:border-gray-800 p-4 sm:p-6 bg-gray-50 dark:bg-transparent transition-colors duration-300 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs font-light text-orange-400 uppercase tracking-wider">Networks</p>
                  <p 
                    className="text-xs sm:text-sm font-light text-black dark:text-white transition-colors duration-300 truncate"
                    title={receipts.length > 0 ? getUniqueNetworks() : 'Multi-chain support for all blockchain networks'}
                  >
                    {receipts.length > 0 ? getUniqueNetworks() : 'Multi-chain'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mb-8 sm:mb-12 lg:mb-16">
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link href="/generate" className="btn-primary-minimal text-xs py-2 px-4 text-center">
                Generate New Receipt
              </Link>
              <button 
                onClick={() => fetchReceipts(pagination.page)}
                className="btn-secondary-minimal text-xs py-2 px-4"
                disabled={loading || redirecting || !isConnected || !isAuthenticated}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {/* Network Filter */}
          {!loading && receipts.length > 0 && getUniqueChainIds().length > 1 && (
            <div className="mb-8 sm:mb-12 lg:mb-16">
              <div className="border border-gray-200 dark:border-gray-800 p-4 sm:p-6 bg-gray-50 dark:bg-transparent transition-colors duration-300">
                <h3 className="text-sm font-light text-black dark:text-white mb-4 tracking-wide uppercase transition-colors duration-300">Filter by Network</h3>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <button
                    onClick={() => handleNetworkFilter(null)}
                    className={`px-3 py-2 text-xs font-light transition-colors duration-300 ${
                      selectedNetwork === null
                        ? 'bg-orange-400 text-black'
                        : 'border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-orange-400 hover:text-orange-400'
                    }`}
                  >
                    All Networks ({receipts.length})
                  </button>
                  {getUniqueChainIds().map(chainId => {
                    const networkReceipts = receipts.filter(r => r.chainId === chainId)
                    return (
                      <button
                        key={chainId}
                        onClick={() => handleNetworkFilter(chainId)}
                        className={`px-3 py-2 text-xs font-light transition-colors duration-300 ${
                          selectedNetwork === chainId
                            ? 'bg-orange-400 text-black'
                            : 'border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-orange-400 hover:text-orange-400'
                        }`}
                      >
                        {getNetworkName(chainId)} ({networkReceipts.length})
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Receipts List */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="border border-gray-200 dark:border-gray-800 p-4 sm:p-6 bg-gray-50 dark:bg-transparent transition-colors duration-300">
                    <div className="h-3 bg-gray-300 dark:bg-gray-800 mb-2 transition-colors duration-300"></div>
                    <div className="h-2 bg-gray-300 dark:bg-gray-800 mb-4 w-2/3 transition-colors duration-300"></div>
                    <div className="h-6 bg-gray-300 dark:bg-gray-800 transition-colors duration-300"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : receipts.length === 0 ? (
            <EmptyState />
          ) : getFilteredReceipts().length === 0 ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border border-gray-300 dark:border-gray-700 flex items-center justify-center mx-auto mb-6">
                <div className="w-3 h-3 bg-gray-300 dark:bg-gray-700"></div>
              </div>
              <h3 className="text-lg font-light text-black dark:text-white mb-4 tracking-wide transition-colors duration-300">
                No receipts found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm font-light transition-colors duration-300">
                No receipts found for the selected network. Try selecting a different network or clear the filter.
              </p>
              <button
                onClick={() => handleNetworkFilter(null)}
                className="btn-primary-minimal text-xs"
              >
                Show All Networks
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 lg:mb-16">
                {getFilteredReceipts().map((receipt) => (
                  <ReceiptCard key={receipt.id} receipt={receipt} />
                ))}
              </div>

              {/* Pagination */}
              {pagination.pages > 1 && !selectedNetwork && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-0 sm:space-x-4">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="btn-secondary-minimal text-xs py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                  >
                    Previous
                  </button>
                  
                  <div className="flex flex-wrap justify-center gap-2">
                    {[...Array(pagination.pages)].map((_, i) => {
                      const page = i + 1
                      return (
                        <button
                          key={page}
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 text-xs font-light transition-colors duration-300 min-w-[2.5rem] ${
                            page === pagination.page
                              ? 'bg-orange-400 text-black'
                              : 'border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-orange-400 hover:text-orange-400'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="btn-secondary-minimal text-xs py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
    </div>
  )
}