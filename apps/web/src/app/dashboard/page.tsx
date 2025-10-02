'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ReceiptCard } from '@/components/receipt-card'
import { EmptyState } from '@/components/empty-state'
import { NetworkFilter } from '@/components/network-filter'
import { useAuth } from '@/hooks/use-auth'
import { useAccount } from 'wagmi'
import { ApiClient } from '@/lib/api-client'
import { toast } from 'react-hot-toast'
import { ParallaxBackground } from '@/components/parallax-background'
import { motion } from 'framer-motion'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Navigation, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'
import 'swiper/css/pagination'
import '@/styles/swiper-custom.css'

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

interface ReceiptsResponse {
  receipts: Receipt[]
  total: number
}

export default function DashboardPage() {
  const router = useRouter()
  const { isAuthenticated, user, initialCheckDone } = useAuth()
  const { isConnected } = useAccount()
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [totalReceipts, setTotalReceipts] = useState(0)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [redirecting, setRedirecting] = useState(false)
  const [selectedChainId, setSelectedChainId] = useState<number | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchReceipts = useCallback(async () => {
    if (!isAuthenticated || redirecting || !isConnected) {
      return
    }

    try {
      setLoading(true)
      
      // Build query parameters
      const params = new URLSearchParams()
      if (selectedChainId !== null) {
        params.append('chainId', selectedChainId.toString())
      }
      
      const queryString = params.toString()
      const url = queryString ? `/api/receipts/my?${queryString}` : '/api/receipts/my'
      
      const response = await ApiClient.get(url)
      const data: ReceiptsResponse = await response.json()
      
      setReceipts(data.receipts)
      setTotalReceipts(data.total)
    } catch (error) {
      if (error instanceof Error && (
        error.message === 'Authentication required' || 
        error.message === 'Unauthorized' ||
        error.message.includes('401')
      )) {
        // Force redirect on authentication error
        if (!redirecting) {
          setRedirecting(true)
          router.push('/login')
        }
        return
      }
      if (!redirecting) {
        toast.error('Failed to load receipts')
        console.error('Error fetching receipts:', error)
      }
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, redirecting, isConnected, selectedChainId, router])

  // Simplified redirect logic
  useEffect(() => {    
    if (!mounted || !initialCheckDone) {
      return
    }

    // Check if user should be redirected to login
    const shouldRedirect = !isAuthenticated || !isConnected
    
    if (shouldRedirect && !redirecting) {
      setRedirecting(true)
      router.push('/login')
      return
    }
    
    // Reset redirecting state if user is authenticated and connected
    if (!shouldRedirect && redirecting) {
      setRedirecting(false)
    }
  }, [mounted, initialCheckDone, isAuthenticated, isConnected, redirecting, router])

  // Separate effect for fetching receipts
  useEffect(() => {
    if (!mounted || !initialCheckDone || redirecting || !isAuthenticated || !isConnected) {
      return
    }

    const doFetch = async () => {
      try {
        setLoading(true)
        
        // Build query parameters
        const params = new URLSearchParams()
        if (selectedChainId !== null) {
          params.append('chainId', selectedChainId.toString())
        }
        
        const queryString = params.toString()
        const url = queryString ? `/api/receipts/my?${queryString}` : '/api/receipts/my'
        
        const response = await ApiClient.get(url)
        const data: ReceiptsResponse = await response.json()
        
        setReceipts(data.receipts)
        setTotalReceipts(data.total)
      } catch (error) {
        if (error instanceof Error && (
          error.message === 'Authentication required' || 
          error.message === 'Unauthorized' ||
          error.message.includes('401')
        )) {
          // Force redirect on authentication error
          setRedirecting(true)
          router.push('/login')
          return
        }
        toast.error('Failed to load receipts')
        console.error('Error fetching receipts:', error)
      } finally {
        setLoading(false)
      }
    }
    
    doFetch()
  }, [mounted, initialCheckDone, isAuthenticated, isConnected, redirecting, selectedChainId, router])

  // Handle network filter change
  const handleChainIdChange = useCallback((chainId: number | null) => {
    setSelectedChainId(chainId)
  }, [])





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

  const getUniqueNetworks = () => {
    const uniqueChainIds = Array.from(new Set(receipts.map(receipt => receipt.chainId)))
    return uniqueChainIds.map(chainId => getNetworkName(chainId)).join(', ') || 'Multi-chain'
  }

  // Function to get items per slide based on screen size
  const getItemsPerSlide = () => {
    if (typeof window === 'undefined') return 6 // SSR fallback
    
    const width = window.innerWidth
    if (width < 640) return 1      // Mobile: 1 item
    if (width < 768) return 2      // SM: 2 items  
    if (width < 1024) return 3     // MD: 3 items (один ряд)
    if (width < 1600) return 3     // LG: 3 items (один ряд) - включает 1512×857
    return 6                       // XL: 6 items (два ряда) - только для очень больших экранов
  }

  const [itemsPerSlide, setItemsPerSlide] = useState(6)

  // Update items per slide on window resize
  useEffect(() => {
    const handleResize = () => {
      setItemsPerSlide(getItemsPerSlide())
    }
    
    handleResize() // Set initial value
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
    console.log('Dashboard: Showing redirecting loader')
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

  // Force redirect if not authenticated or not connected after initial check
  if (!isAuthenticated || !isConnected) {
    return null // Component will unmount and redirect will happen in useEffect
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
      <div className="relative  z-10 py-12 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
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
                  <NetworkFilter 
                    selectedChainId={selectedChainId}
                    onChainIdChange={handleChainIdChange}
                  />
                </motion.div>
                <motion.div
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Link href="/generate" className="btn-primary-minimal text-xs py-2 px-4 text-center block">
                    Generate New Receipt
                  </Link>
                </motion.div>
                <motion.button 
                  onClick={() => fetchReceipts()}
                  className="btn-secondary-minimal text-xs py-2 px-4"
                  disabled={loading || redirecting || !isConnected || !isAuthenticated}
        
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>

          {/* Subscription / Free Generations Status */}
          {user && (
            (() => {
              let freeUntil: Date | null = null
              if (user.freeUntil) {
                const raw = user.freeUntil as unknown
                if (raw instanceof Date) freeUntil = raw
                else if (typeof raw === 'string' || typeof raw === 'number') {
                  const d = new Date(raw)
                  if (!isNaN(d.getTime())) freeUntil = d
                }
              }
              const now = new Date()
              const hasActiveSub = !!freeUntil && freeUntil > now
              const remainingFree = typeof user.freeGenerationsRemaining === 'number' ? user.freeGenerationsRemaining : undefined
              const formattedUntil = hasActiveSub && freeUntil ? freeUntil.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : null

              if (!hasActiveSub && (!remainingFree || remainingFree <= 0)) return null

              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.35 }}
                  className="mb-8"
                >
                  <div className="relative overflow-hidden border border-orange-300/60 dark:border-orange-500/40 bg-gradient-to-r from-orange-50/70 via-amber-50/60 to-orange-100/60 dark:from-orange-900/20 dark:via-orange-800/10 dark:to-orange-900/20 px-4 sm:px-6 py-4 backdrop-blur rounded-sm flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                      <p className="text-[11px] sm:text-xs tracking-wide font-medium text-orange-700 dark:text-orange-300 uppercase">Usage Status</p>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs font-light text-orange-800 dark:text-orange-200">
                      {hasActiveSub && (
                        <span className="inline-flex items-center gap-1">
                          <span className="font-medium text-orange-600 dark:text-orange-300">Subscription Active</span>
                          <span className="opacity-70">until</span>
                          <span className="font-medium">{formattedUntil}</span>
                        </span>
                      )}
                      {hasActiveSub && remainingFree && remainingFree > 0 && (
                        <span className="hidden sm:inline opacity-50">•</span>
                      )}
                      {!hasActiveSub && remainingFree && remainingFree > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <span className="font-medium text-orange-600 dark:text-orange-300">{remainingFree}</span>
                          <span className="opacity-80">free generations left</span>
                        </span>
                      )}
                      {hasActiveSub && remainingFree && remainingFree > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <span className="font-medium text-orange-600 dark:text-orange-300">{remainingFree}</span>
                          <span className="opacity-80">remaining in pack</span>
                        </span>
                      )}
                    </div>
                    <div className="sm:ml-auto text-[10px] sm:text-[11px] text-orange-500/70 dark:text-orange-300/60 italic">Manage in Subscriptions</div>
                  </div>
                </motion.div>
              )
            })()
          )}

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
                    {totalReceipts}
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
          ) : (
            <>
              <motion.div 
                className=""
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.9 }}
              >
                <Swiper
                  modules={[Navigation, Pagination]}
                  spaceBetween={24}
                  navigation={{
                    nextEl: '.swiper-button-next',
                    prevEl: '.swiper-button-prev',
                  }}
                  pagination={{
                    el: '.swiper-pagination',
                    clickable: true,
                  }}
                  breakpoints={{
                    0: {
                      slidesPerView: 1,
                      spaceBetween: 16,
                    },
                    640: {
                      slidesPerView: 1,
                      spaceBetween: 20,
                    },
                    768: {
                      slidesPerView: 1,
                      spaceBetween: 24,
                    },
                    1024: {
                      slidesPerView: 1,
                      spaceBetween: 24,
                    },
                    1280: {
                      slidesPerView: 1,
                      spaceBetween: 24,
                    },
                  }}
                  className="receipts-swiper-grid"
                >
                  {Array.from({ length: Math.ceil(receipts.length / itemsPerSlide) }, (_, pageIndex) => (
                    <SwiperSlide key={pageIndex}>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6 2xl:grid-rows-2 lg:h-auto">
                        {receipts.slice(pageIndex * itemsPerSlide, (pageIndex + 1) * itemsPerSlide).map((receipt, index) => (
                          <motion.div
                            key={receipt.id}
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{ 
                              duration: 0.4, 
                              delay: 1 + (pageIndex * itemsPerSlide + index) * 0.1,
                              type: "spring",
                              stiffness: 300,
                              damping: 25
                            }}
                          >
                            <ReceiptCard receipt={receipt} />
                          </motion.div>
                        ))}
                      </div>
                    </SwiperSlide>
                  ))}            
                  {/* Custom Pagination */}
                  <div className="swiper-pagination"></div>
                </Swiper>
              </motion.div>

            </>
          )}
        </div>
      </div>
    </section>
  )
}