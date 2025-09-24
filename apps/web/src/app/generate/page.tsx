'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ReceiptGenerator } from '@/components/receipt-generator'
import { APP_CONFIG, formatPaymentAmount } from '@/config'
import { useAuth } from '@/hooks/use-auth'
import { useAccount } from 'wagmi'
import { motion } from 'framer-motion'
import { ParallaxBackground } from '@/components/parallax-background'

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
          {/* Background with parallax effect */}
          <ParallaxBackground 
            enableParallax={true}
            parallaxSpeed={0.5}
            minOpacity={0.3}
            opacityFadeRate={0.001}
            darkThemeImage="/bg1.png"
            lightThemeImage="/bg3.png"
          />
          
          <motion.div 
            className="relative z-40 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            {/* Hero Header
            <motion.div 
              className="mb-8 sm:mb-12 lg:mb-16"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.2 }}
            >
        
              <motion.h1 
                className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl font-thin mb-4 sm:mb-6 lg:mb-8 tracking-wider transition-colors duration-300"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: 0.3 }}
              >
                Generate Receipt
              </motion.h1>
              <div className="w-16 sm:w-20 md:w-24 lg:w-32 h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent mx-auto mb-4 sm:mb-6 lg:mb-8"></div>
              <motion.p 
                className="text-sm sm:text-base md:text-lg lg:text-xl mb-6 sm:mb-8 lg:mb-12 max-w-2xl mx-auto leading-relaxed transition-colors duration-300"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: 0.3 }}
              >
                Transform your blockchain transactions into professional receipts.
                <br />
             
              </motion.p>
            </motion.div> */}
            
            {/* Receipt Generator Card */}
            <motion.div 
              className="relative max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.3 }}
            >
              <div className="border border-gray-300/50 dark:border-gray-800/50 p-4 sm:p-6 md:p-8 lg:p-12 bg-white/50 backdrop-blur-md dark:bg-black/50 backdrop-blur-md transition-colors duration-300 shadow-2xl bg-white/30 backdrop-blur-sm">
                {/* <motion.div 
                  className="mb-4 sm:mb-6 md:mb-8 lg:mb-10 text-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2, delay: 0.5 }}
                >
                  <div className="inline-flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-400 animate-pulse"></div>
                    <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-light text-black dark:text-white tracking-wide transition-colors duration-300">Start Generation</h2>
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-orange-400 animate-pulse"></div>
                  </div>
                </motion.div> */}
                <ReceiptGenerator />
              </div>
              
              {/* Decorative corner elements */}
              <div className="absolute -top-2 sm:-top-3 -left-2 sm:-left-3 w-4 h-4 sm:w-6 sm:h-6 border-l-2 border-t-2 border-orange-400"></div>
              <div className="absolute -top-2 sm:-top-3 -right-2 sm:-right-3 w-4 h-4 sm:w-6 sm:h-6 border-r-2 border-t-2 border-orange-400"></div>
              <div className="absolute -bottom-2 sm:-bottom-3 -left-2 sm:-left-3 w-4 h-4 sm:w-6 sm:h-6 border-l-2 border-b-2 border-orange-400"></div>
              <div className="absolute -bottom-2 sm:-bottom-3 -right-2 sm:-right-3 w-4 h-4 sm:w-6 sm:h-6 border-r-2 border-b-2 border-orange-400"></div>
            </motion.div>
          
          </motion.div>
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
                <svg className="w-8 h-8 text-orange-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3,3V21H21V3H3M5,5H19V19H5V5M7,7V9H17V7H7M7,11V13H17V11H7M7,15V17H14V15H7Z" />
                </svg>
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-thin text-black dark:text-white mb-6 sm:mb-8 tracking-wide transition-colors duration-300">
                Simple Process
              </h2>
              <div className="w-24 sm:w-32 h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent mx-auto mb-6 sm:mb-8"></div>
              <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base md:text-lg font-light max-w-2xl mx-auto leading-relaxed transition-colors duration-300">
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