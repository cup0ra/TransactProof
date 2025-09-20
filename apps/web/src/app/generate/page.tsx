'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ReceiptGenerator } from '@/components/receipt-generator'
import { APP_CONFIG, formatPaymentAmount } from '@/config'
import { useAuth } from '@/hooks/use-auth'
import { useAccount } from 'wagmi'

export default function GeneratePage() {
  const router = useRouter()
  const { isAuthenticated, initialCheckDone } = useAuth()
  const { isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted || !initialCheckDone) {
      return
    }

    if (!isAuthenticated || !isConnected) {
      return
    }
  }, [mounted, isAuthenticated, isConnected, initialCheckDone, router])

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
  return (
    <>
      {/* Centered Hero Section with Receipt Generator */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden py-8 sm:py-12 lg:py-20">
          {/* Background Pattern */}
          <div className="absolute inset-0 -z-10" style={{
            backgroundImage: `
              radial-gradient(circle at 30% 40%, rgba(249, 115, 22, 0.12) 0%, transparent 60%),
              radial-gradient(circle at 70% 60%, rgba(245, 158, 11, 0.08) 0%, transparent 60%),
              radial-gradient(circle at 50% 20%, rgba(249, 115, 22, 0.06) 0%, transparent 60%)
            `,
            backgroundSize: '120% 140%',
            backgroundPosition: '0% 0%'
          }}>
            <div className="absolute inset-0 bg-white dark:bg-black transition-colors duration-300"></div>
            <div className="absolute inset-0 opacity-15" style={{
              backgroundImage: `radial-gradient(circle, #f97316 0.8px, transparent 0.8px)`,
              backgroundSize: '120px 120px'
            }}></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/40 dark:via-black/40 to-white dark:to-black opacity-70 transition-colors duration-300"></div>
          </div>
          
          <div className="relative z-10 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            {/* Hero Header */}
            <div className="mb-8 sm:mb-12 lg:mb-16">
        
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-thin text-black dark:text-white mb-6 sm:mb-8 tracking-wider parallax-title transition-colors duration-300">
                Generate Receipt
              </h1>
              <div className="w-20 sm:w-24 lg:w-32 h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent mx-auto mb-6 sm:mb-8"></div>
              <p className="text-base sm:text-lg lg:text-xl text-gray-600 dark:text-gray-300 mb-8 sm:mb-12 max-w-2xl mx-auto font-light leading-relaxed parallax-subtitle transition-colors duration-300">
                Transform your blockchain transactions into professional receipts.
                <br />
                <span className="text-orange-400">Simple. Secure. Instant.</span>
              </p>
            </div>
            
            {/* Receipt Generator Card */}
            <div className="relative max-w-2xl mx-auto">
              <div className="border border-gray-300 dark:border-gray-800 p-6 sm:p-8 lg:p-12 bg-white/70 dark:bg-black/70 backdrop-blur-md transition-colors duration-300">
                <div className="mb-6 sm:mb-8 lg:mb-10 text-center">
                  <div className="inline-flex items-center space-x-3 sm:space-x-4 mb-4 sm:mb-6">
                    <div className="w-2 h-2 bg-orange-400 animate-pulse"></div>
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-light text-black dark:text-white tracking-wide transition-colors duration-300">Start Generation</h2>
                    <div className="w-2 h-2 bg-orange-400 animate-pulse"></div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-light transition-colors duration-300">
                    Enter transaction details below to create your professional receipt
                  </p>
                </div>
                <ReceiptGenerator />
              </div>
              
              {/* Decorative corner elements */}
              <div className="absolute -top-2 sm:-top-3 -left-2 sm:-left-3 w-4 h-4 sm:w-6 sm:h-6 border-l-2 border-t-2 border-orange-400"></div>
              <div className="absolute -top-2 sm:-top-3 -right-2 sm:-right-3 w-4 h-4 sm:w-6 sm:h-6 border-r-2 border-t-2 border-orange-400"></div>
              <div className="absolute -bottom-2 sm:-bottom-3 -left-2 sm:-left-3 w-4 h-4 sm:w-6 sm:h-6 border-l-2 border-b-2 border-orange-400"></div>
              <div className="absolute -bottom-2 sm:-bottom-3 -right-2 sm:-right-3 w-4 h-4 sm:w-6 sm:h-6 border-r-2 border-b-2 border-orange-400"></div>
            </div>
            
            {/* Quick Info Bar */}
            <div className="mt-8 sm:mt-12 lg:mt-16 flex flex-col sm:flex-row flex-wrap justify-center gap-6 sm:gap-8 lg:gap-12 text-center">
              <div className="group">
                <div className="w-10 h-10 sm:w-12 sm:h-12 border border-gray-300 dark:border-gray-800 flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:border-orange-400 transition-colors duration-300">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="text-base sm:text-lg font-light text-orange-400 mb-1">{formatPaymentAmount(APP_CONFIG.PAYMENT_AMOUNT)} ETH</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider transition-colors duration-300">Service Fee</div>
              </div>
              <div className="group">
                <div className="w-10 h-10 sm:w-12 sm:h-12 border border-gray-300 dark:border-gray-800 flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:border-orange-400 transition-colors duration-300">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-base sm:text-lg font-light text-orange-400 mb-1">30 Seconds</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider transition-colors duration-300">Processing Time</div>
              </div>
              <div className="group">
                <div className="w-10 h-10 sm:w-12 sm:h-12 border border-gray-300 dark:border-gray-800 flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:border-orange-400 transition-colors duration-300">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-lg font-light text-orange-400 mb-1">Professional</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider transition-colors duration-300">PDF Format</div>
              </div>
            </div>
          </div>
        </section>

        {/* Process Steps */}
        <section className="py-32 px-4 relative bg-white dark:bg-black transition-colors duration-300">
          {/* Enhanced background pattern */}
          <div className="absolute inset-0" style={{
            backgroundImage: `
              radial-gradient(circle at 20% 80%, rgba(249, 115, 22, 0.15) 0%, transparent 60%),
              radial-gradient(circle at 90% 20%, rgba(245, 158, 11, 0.12) 0%, transparent 60%),
              radial-gradient(circle at 50% 50%, rgba(251, 191, 36, 0.08) 0%, transparent 70%)
            `,
            backgroundSize: '180% 180%'
          }}>
            <div className="absolute inset-0 opacity-10" style={{
              backgroundImage: `radial-gradient(circle, #f97316 1px, transparent 1px)`,
              backgroundSize: '150px 150px'
            }}></div>
          </div>
          
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-24">
              <div className="w-16 h-16 mx-auto mb-8 border border-orange-400 flex items-center justify-center parallax-float">
                <div className="w-8 h-8 border border-amber-300 flex items-center justify-center">
                  <div className="w-2 h-2 bg-orange-500"></div>
                </div>
              </div>
              <h2 className="text-4xl md:text-5xl font-thin text-black dark:text-white mb-8 tracking-wide transition-colors duration-300">
                Simple Process
              </h2>
              <div className="w-32 h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent mx-auto mb-8"></div>
              <p className="text-gray-600 dark:text-gray-300 text-lg font-light max-w-2xl mx-auto leading-relaxed transition-colors duration-300">
                Generate professional blockchain receipts in three effortless steps.
                <br />
                <span className="text-orange-400">Secure, verified, and instant.</span>
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  number: "01",
                  title: "Submit Transaction",
                  description: "Enter your transaction hash and we'll fetch all the details from the blockchain automatically.",
                  icon: "→"
                },
                {
                  number: "02", 
                  title: "Secure Payment",
                  description: `Pay a minimal fee of ${formatPaymentAmount(APP_CONFIG.PAYMENT_AMOUNT)} ETH to process your professional receipt generation.`,
                  icon: "◊"
                },
                {
                  number: "03",
                  title: "Download Receipt", 
                  description: "Receive a professionally formatted PDF receipt with complete transaction verification.",
                  icon: "↓"
                }
              ].map((step, index) => (
                <div key={index} className="group relative">
                  {/* Connection line */}
                  {index < 2 && (
                    <div className="hidden md:block absolute top-16 left-full w-8 h-px bg-gradient-to-r from-orange-400 to-transparent z-0"></div>
                  )}
                  
                  <div className="border border-gray-300 dark:border-gray-800 p-10 bg-white/50 dark:bg-black/50 backdrop-blur-sm hover:border-orange-400 transition-all duration-500 hover:bg-white/70 dark:hover:bg-black/70 hover:transform hover:scale-105 relative z-10">
                    {/* Step number */}
                    <div className="flex items-center justify-between mb-8">
                      <span className="text-6xl font-thin text-orange-400/30">{step.number}</span>
                      <div className="w-12 h-12 border border-orange-400 flex items-center justify-center text-orange-400 text-xl font-light group-hover:bg-orange-400 group-hover:text-white dark:group-hover:text-black transition-all duration-300">
                        {step.icon}
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-light text-black dark:text-white mb-6 tracking-wide transition-colors duration-300">{step.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-sm font-light leading-relaxed transition-colors duration-300">
                      {step.description}
                    </p>
                    
                    {/* Progress indicator */}
                    <div className="mt-8 w-full h-px bg-gray-300 dark:bg-gray-800 overflow-hidden transition-colors duration-300">
                      <div className="h-full bg-gradient-to-r from-orange-400 to-amber-400 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-1000"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Call to action */}
            <div className="text-center mt-20">
              <div className="inline-flex items-center space-x-4 px-8 py-4 border border-gray-300 dark:border-gray-800 bg-white/30 dark:bg-black/30 backdrop-blur-sm transition-colors duration-300">
                <div className="w-2 h-2 bg-orange-400 animate-pulse"></div>
                <span className="text-gray-600 dark:text-gray-300 text-sm font-light transition-colors duration-300">Ready to start? Fill in the form above</span>
                <div className="w-2 h-2 bg-orange-400 animate-pulse"></div>
              </div>
            </div>
          </div>
        </section>
    </>
  )
}