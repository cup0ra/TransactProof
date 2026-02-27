'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useMemo, memo, useEffect } from 'react'
import { ConnectButton } from './connect-button'
import { ThemeToggle } from './theme-toggle'
import { useAuth } from '@/hooks/use-auth'
import { useAccount } from 'wagmi'
import { globalAuthManager } from '@/utils/global-auth-manager'
import { Logo } from './logo'
import { AnimatedPillNav } from './animated-pill-nav'

export function Header() {
  const { isAuthenticated, user } = useAuth()
  const { address, isConnected } = useAccount()
  const actualPathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [globalAuthState, setGlobalAuthState] = useState(false)

  useEffect(() => {
    const unsubscribe = globalAuthManager.onAuthChange((changedAddress, isAuth) => {
      if (address && changedAddress === address.toLowerCase()) {
        console.log('Global auth state changed for address:', changedAddress, 'isAuth:', isAuth)
        setGlobalAuthState(isAuth)
      }
    })

    if (address) {
      const currentAuthState = globalAuthManager.isAuthenticated(address)
      setGlobalAuthState(currentAuthState)
    }

    return () => {
      unsubscribe()
    }
  }, [address])

  const isFullyAuthenticated = isConnected && (
    (isAuthenticated && user?.walletAddress?.toLowerCase() === address?.toLowerCase()) ||
    globalAuthState
  )

  const pathname = useMemo(() => {
    const mainPages = ['/', '/generate', '/dashboard', '/subscription']
    if (mainPages.includes(actualPathname)) {
      return actualPathname
    }
    return null
  }, [actualPathname])

  const desktopNavItems = useMemo(() => {
    const items = [
      { key: '/', href: '/', label: 'Home' },
      { key: '/generate', href: '/generate', label: 'Generate' },
      { key: '/subscription', href: '/subscription', label: 'Subscription' }
    ]

    if (isFullyAuthenticated) {
      items.push({ key: '/dashboard', href: '/dashboard', label: 'Dashboard' })
    }

    return items
  }, [isFullyAuthenticated])

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <>
      <header className="fixed top-0 w-full z-50">
        <div className="mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4 lg:gap-8">
          <div className="flex items-center gap-4 lg:gap-8 border border-gray-300/50 dark:border-gray-800/50 rounded-xl px-1.5 lg:px-2 py-1 bg-white/20 dark:bg-black/20 backdrop-blur-sm"
           style={{ fontFamily: "'Clash Display', system-ui, sans-serif" }}>
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3" onClick={closeMobileMenu}>
            <Logo />
            <span className="text-xs sm:text-sm font-light tracking-wide text-black dark:text-white transition-colors duration-300">TransactProof</span>
          </Link>

          {/* Desktop Navigation */}
          <AnimatedPillNav items={desktopNavItems} activeKey={pathname} />
          </div>
          {/* Desktop Actions */}
          <div className="hidden md:flex items-center ml-auto space-x-1.5 lg:space-x-2 border border-gray-300/50 dark:border-gray-800/50 rounded-xl px-1.5 lg:px-2 py-1 bg-white/20 dark:bg-black/20 backdrop-blur-sm">
            <ThemeToggle />
            <ConnectButton compact />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center  ml-auto border border-gray-300/50 dark:border-gray-800/50 rounded-xl px-1.5 lg:px-2 py-1 bg-white/20 dark:bg-black/20 backdrop-blur-sm">
            <ThemeToggle />
            <button
              onClick={toggleMobileMenu}
              className="text-gray-600 dark:text-gray-400 hover:text-orange-400 hover:border-orange-400 transition-colors duration-300 ml-2"
              aria-label="Toggle mobile menu"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div className={`fixed inset-0 z-[60] md:hidden transition-opacity duration-300 ${
        mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}>
        <div className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm" onClick={closeMobileMenu}></div>
        {/* Mobile Menu Panel sliding from right */}
        <div className={`fixed top-0 right-0 bottom-0 w-80 max-w-[80vw] z-[70] bg-white/50 backdrop-blur-md dark:bg-black/50 border-l border-gray-200 dark:border-gray-800 rounded-l-2xl transform transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          {/* Mobile Menu Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
            <div className="flex items-center space-x-2">
              <Logo />
              <span className="text-sm font-light tracking-wide text-black dark:text-white transition-colors duration-300">TransactProof</span>
            </div>
            <button
              onClick={closeMobileMenu}
              className="text-gray-600 dark:text-gray-400 hover:text-orange-400 hover:border-orange-400 transition-colors duration-300"
              aria-label="Close mobile menu"
            >
              <svg 
                className="w-5 h-5" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Mobile Menu Content */}
          <div className="flex flex-col px-4 py-4" style={{ height: 'calc(100vh - 73px)' }}>
            {/* Mobile Navigation */}
            <nav className="space-y-3">
              <Link 
                href="/" 
                onClick={closeMobileMenu}
                className={`block text-sm transition-colors font-light tracking-wide py-2 px-2 rounded-lg ${
                  pathname === '/' 
                    ? 'text-orange-400 border-orange-400/60' 
                    : 'text-gray-600 dark:text-gray-400 border-gray-300/60 dark:border-gray-700 hover:text-orange-400 dark:hover:text-orange-400'
                }`}
              >
                Home
              </Link>
              <Link 
                href="/generate" 
                onClick={closeMobileMenu}
                className={`block text-sm transition-colors font-light tracking-wide py-2 px-2 rounded-lg ${
                  pathname === '/generate' 
                    ? 'text-orange-400 border-orange-400/60' 
                    : 'text-gray-600 dark:text-gray-400 border-gray-300/60 dark:border-gray-700 hover:text-orange-400 dark:hover:text-orange-400'
                }`}
              >
                Generate
              </Link>
              <Link 
                href="/subscription" 
                onClick={closeMobileMenu}
                className={`block text-sm transition-colors font-light tracking-wide py-2 px-2 rounded-lg ${
                  pathname === '/subscription' 
                    ? 'text-orange-400 border-orange-400/60' 
                    : 'text-gray-600 dark:text-gray-400 border-gray-300/60 dark:border-gray-700 hover:text-orange-400 dark:hover:text-orange-400'
                }`}
              >
                Subscription
              </Link>
              {isFullyAuthenticated && (
                <Link 
                  href="/dashboard" 
                  onClick={closeMobileMenu}
                  className={`block text-sm transition-colors font-light tracking-wide py-2 px-2 rounded-lg ${
                    pathname === '/dashboard' 
                      ? 'text-orange-400 border-orange-400/60' 
                      : 'text-gray-600 dark:text-gray-400 border-gray-300/60 dark:border-gray-700 hover:text-orange-400 dark:hover:text-orange-400'
                  }`}
                >
                  Dashboard
                </Link>
              )}
            </nav>
            
            {/* Mobile Connect Button - Right after navigation */}
            <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
              <div className="flex justify-center">
                <div className="[&>button]:w-[100%] [&>div]:flex [&>div]:flex-col [&>div]:gap-3 [&>div]:items-center [&>div>*]:w-full [&>div>*]:justify-center [&>div>*]:text-center [&>div>*]:shadow-sm [&>div>*]:hover:shadow-md [&>div>*]:transition-all [&>div>*]:duration-200">
                  <ConnectButton />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export const MemoizedHeader = memo(Header, () => {
  return false
})