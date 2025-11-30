'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { EmptyState } from '@/components/empty-state'
import { NetworkFilter } from '@/components/network-filter'
import { useAuth } from '@/hooks/use-auth'
import { useAccount } from 'wagmi'
import { ApiClient } from '@/lib/api-client'
import { toast } from 'react-hot-toast'
import { ParallaxBackground } from '@/components/parallax-background'

// Dynamic imports to reduce initial bundle size
const MotionDiv = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.div),
  { ssr: false }
)

const MotionButton = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.button),
  { ssr: false }
)

const MotionSvg = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.svg),
  { ssr: false }
)

const MotionP = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.p),
  { ssr: false }
)
const MotionH1 = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.h1),
  { ssr: false }
)
// Dynamic import for Swiper component (only loads when needed)
const ReceiptsSwiper = dynamic(
  () => import('@/components/receipts-swiper').then((mod) => ({ default: mod.ReceiptsSwiper })),
  { 
    ssr: false,
    loading: () => (
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
    )
  }
)

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
  const { isAuthenticated, user } = useAuth()
  const { isConnected } = useAccount()
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [totalReceipts, setTotalReceipts] = useState(0)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [selectedChainId, setSelectedChainId] = useState<number | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchReceipts = useCallback(async () => {
    if (!isAuthenticated || !isConnected) {
      return
    }

    try {
      setLoading(true)
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
        return
      }
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated, isConnected, selectedChainId])

  // Separate effect for fetching receipts
  useEffect(() => {
    if (!mounted || !isAuthenticated || !isConnected) {
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
          return
        }
        toast.error('Failed to load receipts')
        console.error('Error fetching receipts:', error)
      } finally {
        setLoading(false)
      }
    }
    doFetch()
  }, [mounted, isAuthenticated, isConnected, selectedChainId])

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
      {isAuthenticated ? (
        <>
      <div className="relative  z-10 py-12 sm:py-12 lg:py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <MotionDiv 
            className="flex flex-col sm:flex-row gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <div className="flex-grow">
              <MotionH1 
                className="text-lg sm:text-xl font-light text-black dark:text-white mb-3 sm:mb-4 tracking-wide transition-colors duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
              >
                Your Receipts
              </MotionH1>
              <MotionP 
                className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-light transition-colors duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
              >
                View and download your crypto transaction receipts
              </MotionP>
            </div>
            
            {/* Action Buttons */}
            <MotionDiv 
              className="mb-8 sm:mt-12 lg:mt-8"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
            >
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                           <MotionDiv
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <NetworkFilter 
                    selectedChainId={selectedChainId}
                    onChainIdChange={handleChainIdChange}
                  />
                </MotionDiv>
                <MotionDiv
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Link href="/generate" className="btn-primary-minimal text-xs py-2 px-4 text-center block">
                    Generate New Receipt
                  </Link>
                </MotionDiv>
                <MotionDiv
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <Link href="/dashboard/customize-pdf" className="btn-secondary-minimal text-xs py-2 px-4 text-center block">
                    Customize PDF
                  </Link>
                </MotionDiv>
                <MotionButton 
                  onClick={() => fetchReceipts()}
                  className="btn-secondary-minimal text-xs py-2 px-4"
                  disabled={loading || !isConnected || !isAuthenticated}
        
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  {loading ? 'Refreshing...' : 'Refresh'}
                </MotionButton>
              </div>
            </MotionDiv>
          </MotionDiv>

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
                <MotionDiv
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
                </MotionDiv>
              )
            })()
          )}

          {/* Stats Cards */}
          <MotionDiv 
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-8 lg:mb-8"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
          >
            <MotionDiv 
              className="border border-gray-200 dark:border-gray-800 p-4 sm:p-6 bg-white/50 backdrop-blur-md dark:bg-black/50 transition-colors duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
            >
              <div className="flex items-center">
                <MotionSvg 
                  className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400 flex-shrink-0" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  transition={{ duration: 2, delay: 0.5, ease: "easeInOut" }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </MotionSvg>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs font-light text-orange-400 uppercase tracking-wider">Total Receipts</p>
                  <MotionP 
                    className="text-base sm:text-lg font-light text-black dark:text-white transition-colors duration-300"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.7 }}
                  >
                    {totalReceipts}
                  </MotionP>
                </div>
              </div>
            </MotionDiv>

            <MotionDiv 
              className="border border-gray-200 dark:border-gray-800 p-4 sm:p-6 bg-white/50 backdrop-blur-md dark:bg-black/50 transition-colors duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6, ease: "easeOut" }}
            >
              <div className="flex items-center">
                <MotionSvg 
                  className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400 flex-shrink-0" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  transition={{ duration: 2, delay: 0.6, ease: "easeInOut" }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </MotionSvg>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs font-light text-orange-400 uppercase tracking-wider">Connected Wallet</p>
                  <MotionP 
                    className="text-xs font-mono text-black dark:text-white font-light transition-colors duration-300 truncate"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                  >
                    {user?.walletAddress ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}` : ''}
                  </MotionP>
                </div>
              </div>
            </MotionDiv>

            <MotionDiv 
              className="border border-gray-200 dark:border-gray-800 p-4 sm:p-6 bg-white/50 backdrop-blur-md dark:bg-black/50 transition-colors duration-300 sm:col-span-2 lg:col-span-1"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7, ease: "easeOut" }}
            >
              <div className="flex items-center">
                <MotionSvg 
                  className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400 flex-shrink-0" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  transition={{ duration: 2, delay: 0.7, ease: "easeInOut" }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </MotionSvg>
                <div className="ml-3 sm:ml-4 min-w-0">
                  <p className="text-xs font-light text-orange-400 uppercase tracking-wider">Networks</p>
                  <MotionP 
                    className="text-xs sm:text-sm font-light text-black dark:text-white transition-colors duration-300 truncate"
                    title={receipts.length > 0 ? getUniqueNetworks() : 'Multi-chain support for all blockchain networks'}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                  >
                    {receipts.length > 0 ? getUniqueNetworks() : 'Multi-chain'}
                  </MotionP>
                </div>
              </div>
            </MotionDiv>
          </MotionDiv>



          {/* Receipts List */}
          {loading ? (
            <MotionDiv 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              {[...Array(6)].map((_, i) => (
                <MotionDiv 
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
                </MotionDiv>
              ))}
            </MotionDiv>
          ) : receipts.length === 0 ? (
            <MotionDiv
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
            >
              <EmptyState />
            </MotionDiv>
          ) : (
            <MotionDiv 
              className=""
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.9 }}
            >
              <ReceiptsSwiper receipts={receipts} itemsPerSlide={itemsPerSlide} />
            </MotionDiv>
          )}
        </div>
      </div>
        </>
      ) : (<></>)}
    </section>
  )
}