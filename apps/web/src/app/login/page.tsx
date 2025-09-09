'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ConnectButton } from '@/components/connect-button'
import { useAuth } from '@/hooks/use-auth'

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, initialCheckDone } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && initialCheckDone && isAuthenticated) {
      router.push('/dashboard')
    }
  }, [isAuthenticated, initialCheckDone, router, mounted])

  return (
    <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center p-4 sm:p-6 lg:p-8 transition-colors duration-300">
      <div className="max-w-md w-full text-center">
        {/* Logo */}
        <div className="mb-12 sm:mb-16">
          <div className="flex justify-center space-x-1 mb-4 sm:mb-6">
            <div className="w-2 h-2 bg-orange-400 rounded-full"></div>
            <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
          </div>
          <h1 className="text-lg sm:text-xl font-light text-black dark:text-white mb-3 sm:mb-4 tracking-wide transition-colors duration-300">TransactProof</h1>
          <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-light transition-colors duration-300">Sign in to access your receipts</p>
        </div>

        {/* Welcome Text */}
        <div className="mb-8 sm:mb-12">
          <h2 className="text-base sm:text-lg font-light text-black dark:text-white mb-3 sm:mb-4 tracking-wide transition-colors duration-300">Welcome back</h2>
          <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-light leading-relaxed mb-6 sm:mb-8 transition-colors duration-300">Connect your wallet to sign in with Ethereum</p>
          
          {/* Centered Connect Wallet Button */}
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </div>

        {/* Benefits */}
        <div className="border border-gray-300 dark:border-gray-800 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8 transition-colors duration-300">
          <h3 className="text-xs font-light text-orange-400 uppercase tracking-wider mb-4 sm:mb-6">What you get</h3>
          <ul className="space-y-3 sm:space-y-4 text-xs text-gray-600 dark:text-gray-400 font-light text-left transition-colors duration-300">
            <li className="flex items-start sm:items-center">
              <div className="w-1 h-1 bg-orange-400 mr-3 mt-2 sm:mt-0 flex-shrink-0"></div>
              <span className="leading-relaxed">Generate PDF receipts for any USDT transaction</span>
            </li>
            <li className="flex items-start sm:items-center">
              <div className="w-1 h-1 bg-orange-400 mr-3 mt-2 sm:mt-0 flex-shrink-0"></div>
              <span className="leading-relaxed">Secure storage of your receipt history</span>
            </li>
            <li className="flex items-start sm:items-center">
              <div className="w-1 h-1 bg-orange-400 mr-3 mt-2 sm:mt-0 flex-shrink-0"></div>
              <span className="leading-relaxed">Professional receipts with QR codes</span>
            </li>
          </ul>
        </div>

        {/* Terms */}
        <div className="mb-6 sm:mb-8">
          <p className="text-xs text-gray-500 font-light leading-relaxed">
            By connecting your wallet, you agree to our terms of service
          </p>
        </div>

        {/* Footer */}
        <div>
          <p className="text-xs text-gray-500 font-light leading-relaxed">
            Don't have a wallet?{' '}
            <a 
              href="https://metamask.io" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-orange-400 hover:text-orange-300 transition-colors duration-300 underline"
            >
              Get MetaMask
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}