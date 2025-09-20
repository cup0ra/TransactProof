'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useMemo, memo, useEffect } from 'react'
import { ConnectButton } from './connect-button'
import { ThemeToggle } from './theme-toggle'
import { useAuth } from '@/hooks/use-auth'
import { useAccount } from 'wagmi'
import { globalAuthManager } from '@/utils/global-auth-manager'

export function Header() {
  const { isAuthenticated, user } = useAuth()
  const { address, isConnected } = useAccount()
  const actualPathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [globalAuthState, setGlobalAuthState] = useState(false)

  useEffect(() => {
    const unsubscribe = globalAuthManager.onAuthChange((changedAddress, isAuth) => {
      if (address && changedAddress === address.toLowerCase()) {
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
    const mainPages = ['/', '/generate', '/dashboard']
    if (mainPages.includes(actualPathname)) {
      return actualPathname
    }
    return null
  }, [actualPathname])
  
  const navClasses = useMemo(() => ({
    home: `text-sm transition-colors font-light tracking-wide ${
      pathname === '/' 
        ? 'text-orange-400 border-b border-orange-400 pb-1' 
        : 'text-gray-600 dark:text-gray-400 hover:text-orange-400'
    }`,
    generate: `text-sm transition-colors font-light tracking-wide ${
      pathname === '/generate' 
        ? 'text-orange-400 border-b border-orange-400 pb-1' 
        : 'text-gray-600 dark:text-gray-400 hover:text-orange-400'
    }`,
    dashboard: `text-sm transition-colors font-light tracking-wide ${
      pathname === '/dashboard' 
        ? 'text-orange-400 border-b border-orange-400 pb-1' 
        : 'text-gray-600 dark:text-gray-400 hover:text-orange-400'
    }`
  }), [pathname])

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <>
      <header className="fixed top-0 w-full z-50 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-black/80 transition-colors duration-300">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 sm:space-x-3" onClick={closeMobileMenu}>
            <div className="flex space-x-1">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-400 rounded-full"></div>
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-amber-400 rounded-full"></div>
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full"></div>
            </div>
            <span className="text-xs sm:text-sm font-light tracking-wide text-black dark:text-white transition-colors duration-300">TransactProof</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8 lg:space-x-12">
            <Link 
              href="/" 
              className={navClasses.home}
            >
              Home
            </Link>
            <Link 
              href="/generate" 
              className={navClasses.generate}
            >
              Generate
            </Link>
            {isFullyAuthenticated && (
              <Link 
                href="/dashboard" 
                className={navClasses.dashboard}
              >
                Dashboard
              </Link>
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-2">
            <ThemeToggle />
            <ConnectButton />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={toggleMobileMenu}
              className="p-2 text-gray-600 dark:text-gray-400 hover:text-orange-400 transition-colors duration-300"
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
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={closeMobileMenu}></div>
          <div className="fixed top-16 left-0 right-0 bg-white dark:bg-black border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
            <div className="px-4 py-6 space-y-6">
              {/* Mobile Navigation */}
              <nav className="space-y-4">
                <Link 
                  href="/" 
                  onClick={closeMobileMenu}
                  className={`block text-sm transition-colors font-light tracking-wide ${
                    pathname === '/' 
                      ? 'text-orange-400' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-orange-400'
                  }`}
                >
                  Home
                </Link>
                <Link 
                  href="/generate" 
                  onClick={closeMobileMenu}
                  className={`block text-sm transition-colors font-light tracking-wide ${
                    pathname === '/generate' 
                      ? 'text-orange-400' 
                      : 'text-gray-600 dark:text-gray-400 hover:text-orange-400'
                  }`}
                >
                  Generate
                </Link>
                {isFullyAuthenticated && (
                  <Link 
                    href="/dashboard" 
                    onClick={closeMobileMenu}
                    className={`block text-sm transition-colors font-light tracking-wide ${
                      pathname === '/dashboard' 
                        ? 'text-orange-400' 
                        : 'text-gray-600 dark:text-gray-400 hover:text-orange-400'
                    }`}
                  >
                    Dashboard
                  </Link>
                )}
              </nav>

              {/* Mobile Connect Button */}
              <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
                <ConnectButton />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export const MemoizedHeader = memo(Header, () => {
  return false
})