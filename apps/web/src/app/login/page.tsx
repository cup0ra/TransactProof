'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ConnectButton } from '@/components/connect-button'
import { useAuth } from '@/hooks/use-auth'
import { useAccount } from 'wagmi'
import { Logo } from '@/components/logo'
import { ParallaxBackground } from '@/components/parallax-background'

// Dynamic import for motion to reduce initial bundle size
const MotionDiv = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.div),
  { ssr: false }
)

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && isAuthenticated && isConnected) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, isConnected, router, mounted])

  return (
    <section className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-hidden">
      {/* Background with parallax effect */}
      <ParallaxBackground 
        enableParallax={true}
        parallaxSpeed={0.5}
        minOpacity={0.3}
        opacityFadeRate={0.001}
      />
      
      <MotionDiv 
        className="relative z-40 max-w-md w-full text-center"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
      >
        {/* Logo */}
        <MotionDiv 
          className="mb-12 sm:mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.1, delay: 0.2 }}
        >
          <MotionDiv 
            className="flex justify-center space-x-1 mb-4 sm:mb-6"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.1, delay: 0.3 }}
          >
            <Logo width={48} height={48} />
          </MotionDiv>
          <h1 className="text-lg sm:text-xl font-light text-black dark:text-white mb-3 sm:mb-4 tracking-wide transition-colors duration-300">TransactProof</h1>
          <p className="text-gray-700 dark:text-gray-200 text-xs sm:text-sm font-light transition-colors duration-300">Sign in to access your receipts</p>
        </MotionDiv>

        {/* Welcome Text */}
        <MotionDiv 
          className="mb-8 sm:mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.1, delay: 0.5 }}
        >
          <h2 className="text-base sm:text-lg font-light text-black dark:text-white mb-3 sm:mb-4 tracking-wide transition-colors duration-300">Welcome back</h2>
          <p className="text-gray-700 dark:text-gray-200 text-xs sm:text-sm font-light leading-relaxed mb-6 sm:mb-8 transition-colors duration-300">Connect your wallet to sign in with Ethereum</p>
          
          {/* Centered Connect Wallet Button */}
          <MotionDiv 
            className="flex justify-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.1, delay: 0.7 }}
          >
            <ConnectButton />
          </MotionDiv>
        </MotionDiv>

        {/* Benefits */}
        <MotionDiv 
          className="border border-gray-300/50 dark:border-gray-800/50 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 bg-white/50 backdrop-blur-md dark:bg-black/50 transition-colors duration-300"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.1, delay: 0.9 }}
        >
          <h3 className="text-xs font-light text-orange-600 dark:text-orange-300 uppercase tracking-wider mb-4 sm:mb-6">What you get</h3>
          <ul className="space-y-3 sm:space-y-4 text-xs text-gray-800 dark:text-gray-300 font-light text-left transition-colors duration-300">
            <li className="flex items-start sm:items-center">
              <div className="w-1 h-1 bg-orange-600 dark:bg-orange-400 mr-3 mt-2 sm:mt-0 flex-shrink-0"></div>
              <span className="leading-relaxed">Generate PDF receipts for any USDT transaction</span>
            </li>
            <li className="flex items-start sm:items-center">
              <div className="w-1 h-1 bg-orange-600 dark:bg-orange-400 mr-3 mt-2 sm:mt-0 flex-shrink-0"></div>
              <span className="leading-relaxed">Secure storage of your receipt history</span>
            </li>
            <li className="flex items-start sm:items-center">
              <div className="w-1 h-1 bg-orange-600 dark:bg-orange-400 mr-3 mt-2 sm:mt-0 flex-shrink-0"></div>
              <span className="leading-relaxed">Professional receipts with QR codes</span>
            </li>
          </ul>
        </MotionDiv>

        {/* Terms */}
        <div className="mb-6 sm:mb-8">
          <p className="text-xs text-gray-600 dark:text-gray-300 font-light leading-relaxed">
            By connecting your wallet, you agree to our terms of service
          </p>
        </div>

        {/* Footer */}
        <div>
          <p className="text-xs text-gray-600 dark:text-gray-300 font-light leading-relaxed">
            Don't have a wallet?{' '}
            <a 
              href="https://metamask.io" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-orange-600 hover:text-orange-500 dark:text-orange-300 dark:hover:text-orange-200 transition-colors duration-300 underline"
            >
              Get MetaMask
            </a>
          </p>
        </div>
      </MotionDiv>
    </section>
  )
}