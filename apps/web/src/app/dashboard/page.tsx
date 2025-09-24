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
import { ParallaxBackground } from '@/components/parallax-background'
import { motion, AnimatePresence } from 'framer-motion'

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
  const { isAuthenticated, user, initialCheckDone } = useAuth()
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (isDropdownOpen && !target.closest('.dropdown-container')) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

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
      
      const response = await ApiClient.get(`/api/receipts/my?page=${page}&limit=6`)
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
    <section className="relative min-h-screen overflow-hidden">
      {/* Background */}
      <ParallaxBackground 
        enableParallax={true}
        parallaxSpeed={0.3}
        minOpacity={0.4}
        opacityFadeRate={0.0008}
        className="z-0"
      />
      
      {/* Content */}
      <div className="relative  z-10 py-8 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <motion.div 
            className="flex flex-col sm:flex-row gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="flex-grow">
              <motion.h1 
                className="text-lg sm:text-xl font-light text-black dark:text-white mb-3 sm:mb-4 tracking-wide transition-colors duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              >
                Your Receipts
              </motion.h1>
              <motion.p 
                className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-light transition-colors duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              >
                View and download your crypto transaction receipts
              </motion.p>
            </div>
            
            {/* Action Buttons */}
            <motion.div 
              className="mb-8 sm:mt-12 lg:mt-8"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            >
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <motion.div
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Link href="/generate" className="btn-primary-minimal text-xs py-2 px-4 text-center block">
                    Generate New Receipt
                  </Link>
                </motion.div>
                <motion.button 
                  onClick={() => fetchReceipts(pagination.page)}
                  className="btn-secondary-minimal text-xs py-2 px-4"
                  disabled={loading || redirecting || !isConnected || !isAuthenticated}
        
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-8 lg:mb-8"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          >
            <motion.div 
              className="border border-gray-200 dark:border-gray-800 p-4 sm:p-6 bg-white/50 backdrop-blur-md dark:bg-black/50 transition-colors duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            >
              <div className="flex items-center">
                <motion.svg 
                  className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400 flex-shrink-0" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </motion.svg>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs font-light text-orange-400 uppercase tracking-wider">Total Receipts</p>
                  <motion.p 
                    className="text-base sm:text-lg font-light text-black dark:text-white transition-colors duration-300"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.7 }}
                  >
                    {pagination.total}
                  </motion.p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="border border-gray-200 dark:border-gray-800 p-4 sm:p-6 bg-white/50 backdrop-blur-md dark:bg-black/50 transition-colors duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
            >
              <div className="flex items-center">
                <motion.svg 
                  className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400 flex-shrink-0" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  transition={{ duration: 2, delay: 0.6, ease: "easeInOut" }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </motion.svg>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs font-light text-orange-400 uppercase tracking-wider">Connected Wallet</p>
                  <motion.p 
                    className="text-xs font-mono text-black dark:text-white font-light transition-colors duration-300 truncate"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    {user?.walletAddress ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}` : ''}
                  </motion.p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              className="border border-gray-200 dark:border-gray-800 p-4 sm:p-6 bg-white/50 backdrop-blur-md dark:bg-black/50 transition-colors duration-300 sm:col-span-2 lg:col-span-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
            >
              <div className="flex items-center">
                <motion.svg 
                  className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400 flex-shrink-0" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  transition={{ duration: 2, delay: 0.7, ease: "easeInOut" }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </motion.svg>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs font-light text-orange-400 uppercase tracking-wider">Networks</p>
                  <motion.p 
                    className="text-xs sm:text-sm font-light text-black dark:text-white transition-colors duration-300 truncate"
                    title={receipts.length > 0 ? getUniqueNetworks() : 'Multi-chain support for all blockchain networks'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                  >
                    {receipts.length > 0 ? getUniqueNetworks() : 'Multi-chain'}
                  </motion.p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Network Filter */}
          <AnimatePresence>
            {!loading && receipts.length > 0 && getUniqueChainIds().length > 1 && (
              <motion.div 
                className="mb-8 sm:mb-8 lg:mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5, delay: 0.8 }}
              >
                <div className="border border-gray-200 dark:border-gray-800 p-4 sm:p-6 bg-white/30 backdrop-blur-md dark:bg-black/50 transition-colors duration-300">
                  <h3 className="text-sm font-light text-black dark:text-white mb-4 tracking-wide uppercase transition-colors duration-300">Filter by Network</h3>
                  
                  {/* Dropdown */}
                  <div className="relative max-w-xs dropdown-container">
                    <motion.button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 text-sm font-light bg-white/50 dark:bg-black/50 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-orange-400 hover:text-orange-400 transition-colors duration-300 backdrop-blur-sm"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="flex items-center">
                        {selectedNetwork ? (
                          <>
                            <motion.div 
                              className="w-2 h-2 bg-orange-400 rounded-full mr-2"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 300, damping: 20 }}
                            />
                            {getNetworkName(selectedNetwork)} ({receipts.filter(r => r.chainId === selectedNetwork).length})
                          </>
                        ) : (
                          <>
                            <motion.div 
                              className="w-2 h-2 bg-gray-400 rounded-full mr-2"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                            />
                            All Networks ({receipts.length})
                          </>
                        )}
                      </span>
                      <motion.svg
                        className="w-4 h-4 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        animate={{ rotate: isDropdownOpen ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </motion.svg>
                    </motion.button>

                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div
                          className="absolute top-full left-0 w-full mt-1 bg-white/90 dark:bg-black/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 shadow-lg z-50 max-h-60 overflow-y-auto"
                          initial={{ opacity: 0, y: -10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -10, scale: 0.95 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                        >
                          {/* All Networks Option */}
                          <motion.button
                            onClick={() => {
                              handleNetworkFilter(null)
                              setIsDropdownOpen(false)
                            }}
                            className={`w-full px-4 py-3 text-left text-sm font-light transition-colors duration-200 flex items-center ${
                              selectedNetwork === null
                                ? 'bg-orange-400/20 text-orange-600 dark:text-orange-400'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                            }`}
                            whileHover={{ x: 4 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          >
                            <motion.div 
                              className={`w-2 h-2 rounded-full mr-3 ${selectedNetwork === null ? 'bg-orange-400' : 'bg-gray-400'}`}
                              animate={{ scale: selectedNetwork === null ? [1, 1.2, 1] : 1 }}
                              transition={{ duration: 1, repeat: selectedNetwork === null ? Infinity : 0 }}
                            />
                            <span>All Networks ({receipts.length})</span>
                            {selectedNetwork === null && (
                              <motion.svg
                                className="w-4 h-4 ml-auto text-orange-400"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                              >
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </motion.svg>
                            )}
                          </motion.button>

                          {/* Individual Network Options */}
                          {getUniqueChainIds().map((chainId, index) => {
                            const networkReceipts = receipts.filter(r => r.chainId === chainId)
                            const isSelected = selectedNetwork === chainId
                            
                            return (
                              <motion.button
                                key={chainId}
                                onClick={() => {
                                  handleNetworkFilter(chainId)
                                  setIsDropdownOpen(false)
                                }}
                                className={`w-full px-4 py-3 text-left text-sm font-light transition-colors duration-200 flex items-center ${
                                  isSelected
                                    ? 'bg-orange-400/20 text-orange-600 dark:text-orange-400'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
                                }`}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.05, type: "spring", stiffness: 400, damping: 25 }}
                                whileHover={{ x: 4 }}
                              >
                                <motion.div 
                                  className={`w-2 h-2 rounded-full mr-3 ${isSelected ? 'bg-orange-400' : 'bg-gray-400'}`}
                                  animate={{ scale: isSelected ? [1, 1.2, 1] : 1 }}
                                  transition={{ duration: 1, repeat: isSelected ? Infinity : 0 }}
                                />
                                <span>{getNetworkName(chainId)} ({networkReceipts.length})</span>
                                {isSelected && (
                                  <motion.svg
                                    className="w-4 h-4 ml-auto text-orange-400"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                  >
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </motion.svg>
                                )}
                              </motion.button>
                            )
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Receipts List */}
          {loading ? (
            <motion.div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {[...Array(6)].map((_, i) => (
                <motion.div 
                  key={i} 
                  className="animate-pulse"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                >
                  <div className="border border-gray-200 dark:border-gray-800 p-4 sm:p-6 bg-gray-50 dark:bg-transparent transition-colors duration-300">
                    <div className="h-3 bg-gray-300 dark:bg-gray-800 mb-2 transition-colors duration-300"></div>
                    <div className="h-2 bg-gray-300 dark:bg-gray-800 mb-4 w-2/3 transition-colors duration-300"></div>
                    <div className="h-6 bg-gray-300 dark:bg-gray-800 transition-colors duration-300"></div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : receipts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <EmptyState />
            </motion.div>
          ) : getFilteredReceipts().length === 0 ? (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <div className="w-12 h-12 border border-gray-300 dark:border-gray-700 flex items-center justify-center mx-auto mb-6">
                <div className="w-3 h-3 bg-gray-300 dark:bg-gray-700"></div>
              </div>
              <h3 className="text-lg font-light text-black dark:text-white mb-4 tracking-wide transition-colors duration-300">
                No receipts found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm font-light transition-colors duration-300">
                No receipts found for the selected network. Try selecting a different network or clear the filter.
              </p>
              <motion.button
                onClick={() => handleNetworkFilter(null)}
                className="btn-primary-minimal text-xs"
              >
                Show All Networks
              </motion.button>
            </motion.div>
          ) : (
            <>
              <motion.div 
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 lg:mb-16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.9 }}
              >
                <AnimatePresence mode="popLayout">
                  {getFilteredReceipts().map((receipt, index) => (
                    <motion.div
                      key={receipt.id}
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -20, scale: 0.95 }}
                      transition={{ 
                        duration: 0.4, 
                        delay: 1 + index * 0.1,
                        type: "spring",
                        stiffness: 300,
                        damping: 25
                      }}
                      layout
                    >
                      <ReceiptCard receipt={receipt} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>

              {/* Pagination */}
              <AnimatePresence>
                {pagination.pages > 1 && !selectedNetwork && (
                  <motion.div 
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-0 sm:space-x-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.5, delay: 1.2 }}
                  >
                    <motion.button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className="btn-secondary-minimal text-xs py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                      whileHover={{ scale: pagination.page === 1 ? 1 : 1.05 }}
                      whileTap={{ scale: pagination.page === 1 ? 1 : 0.95 }}
                    >
                      Previous
                    </motion.button>
                    
                    <div className="flex flex-wrap justify-center gap-2">
                      {[...Array(pagination.pages)].map((_, i) => {
                        const page = i + 1
                        return (
                          <motion.button
                            key={page}
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 text-xs font-light transition-colors duration-300 min-w-[2.5rem] ${
                              page === pagination.page
                                ? 'bg-orange-400 text-black'
                                : 'border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-orange-400 hover:text-orange-400'
                            }`}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 1.3 + i * 0.05 }}
                          >
                            {page}
                          </motion.button>
                        )
                      })}
                    </div>

                    <motion.button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className="btn-secondary-minimal text-xs py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
                    >
                      Next
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>
    </section>
  )
}