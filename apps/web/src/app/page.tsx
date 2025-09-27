'use client'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { ParallaxBackground } from '@/components/parallax-background'
import { PAYMENT_AMOUNT } from '@/config'

export default function HomePage() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  })
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"])
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.3])

  return (
    <>
      {/* Hero Section with Background Image */}
      <section ref={ref} className="relative h-screen flex items-center justify-center overflow-hidden">
          {/* Background Image with Parallax using new component wrapped in motion */}
          <motion.div 
            className="absolute inset-0"
            style={{ y, opacity }}
          >
            <ParallaxBackground 
              enableParallax={false} // motion.div handles parallax
            />
          </motion.div>
          
          <motion.div 
            className="relative z-40 text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            {/* Minimal Logo */}
            <motion.div 
              className="mb-8 sm:mb-12 lg:mb-16"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <motion.h1 
                className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-thin text-black dark:text-white mb-4 sm:mb-6 tracking-wider transition-colors duration-300"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                TransactProof
              </motion.h1>
            </motion.div>
            
            <motion.p 
              className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-8 sm:mb-12 lg:mb-16 max-w-2xl mx-auto font-light leading-relaxed parallax-subtitle transition-colors duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              Professional blockchain receipts.
              <br />
              <span className="text-gray-800 dark:text-orange-400">Minimal. Verified. Instant.</span>
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center parallax-buttons"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <Link href="/generate" className="group relative inline-flex items-center justify-center px-8 sm:px-10 lg:px-12 py-3 sm:py-4 text-base sm:text-lg font-light text-white dark:text-black bg-orange-400 rounded-none hover:bg-orange-500 hover:text-white dark:hover:text-black transition-all duration-300 border-2 border-transparent hover:border-orange-600">
                <span className="relative z-10">Generate Receipt</span>
                <div className="absolute inset-0 bg-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </Link>
              <Link href="/dashboard" className="inline-flex items-center justify-center px-8 sm:px-10 lg:px-12 py-3 sm:py-4 text-base sm:text-lg font-light text-orange-400 border border-orange-400 rounded-none hover:border-orange-500 hover:text-orange-500 hover:bg-orange-950/10 dark:hover:bg-orange-950 transition-all duration-300">
                Dashboard
              </Link>
            </motion.div>
          </motion.div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 sm:py-24 lg:py-32 relative bg-gray-50 dark:bg-black transition-colors duration-300">
          {/* Parallax separator */}
          <div className="absolute inset-0 parallax-separator" style={{
            backgroundImage: `
              radial-gradient(circle at 60% 20%, rgba(245, 158, 11, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 20% 80%, rgba(249, 115, 22, 0.08) 0%, transparent 50%)
            `,
            backgroundSize: '150% 150%'
          }}></div>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 sm:mb-16 lg:mb-2">
            <h2 className="text-2xl sm:text-3xl font-light text-black dark:text-white mb-4 sm:mb-6 tracking-wide transition-colors duration-300">How It Works</h2>
            
            {/* Supported Networks */}
            <div className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 p-6 sm:p-8 max-w-6xl mx-auto mb-8 transition-colors duration-300">
              <h3 className="text-lg sm:text-xl font-light text-black dark:text-white mb-4 tracking-wide transition-colors duration-300">Supported Networks</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4 lg:gap-6">
                <div className="flex flex-col items-center p-3 sm:p-4 bg-white/50 dark:bg-black/30 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-orange-400 dark:hover:border-orange-400 hover:bg-orange-400/10 dark:hover:bg-orange-400/10 transition-all duration-300">
                  <span className="text-xs sm:text-sm font-medium text-orange-500 dark:text-orange-400 text-center">Ethereum</span>
                </div>
                
                <div className="flex flex-col items-center p-3 sm:p-4 bg-white/50 dark:bg-black/30 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-orange-400 dark:hover:border-orange-400 hover:bg-orange-400/10 dark:hover:bg-orange-400/10 transition-all duration-300">
                  <span className="text-xs sm:text-sm font-medium text-orange-500 dark:text-orange-400 text-center">Base</span>
                </div>
                
                <div className="flex flex-col items-center p-3 sm:p-4 bg-white/50 dark:bg-black/30 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-orange-400 dark:hover:border-orange-400 hover:bg-orange-400/10 dark:hover:bg-orange-400/10 transition-all duration-300">
                  <span className="text-xs sm:text-sm font-medium text-orange-500 dark:text-orange-400 text-center">Polygon</span>
                </div>
                
                <div className="flex flex-col items-center p-3 sm:p-4 bg-white/50 dark:bg-black/30 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-orange-400 dark:hover:border-orange-400 hover:bg-orange-400/10 dark:hover:bg-orange-400/10 transition-all duration-300">
                  <span className="text-xs sm:text-sm font-medium text-orange-500 dark:text-orange-400 text-center">Optimism</span>
                </div>
                
                <div className="flex flex-col items-center p-3 sm:p-4 bg-white/50 dark:bg-black/30 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-orange-400 dark:hover:border-orange-400 hover:bg-orange-400/10 dark:hover:bg-orange-400/10 transition-all duration-300">
                  <span className="text-xs sm:text-sm font-medium text-orange-500 dark:text-orange-400 text-center">Arbitrum</span>
                </div>
                
                <div className="flex flex-col items-center p-3 sm:p-4 bg-white/50 dark:bg-black/30 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-orange-400 dark:hover:border-orange-400 hover:bg-orange-400/10 dark:hover:bg-orange-400/10 transition-all duration-300">
                  <span className="text-xs sm:text-sm font-medium text-orange-500 dark:text-orange-400 text-center">zkSync</span>
                </div>
                
                <div className="flex flex-col items-center p-3 sm:p-4 bg-white/50 dark:bg-black/30 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-orange-400 dark:hover:border-orange-400 hover:bg-orange-400/10 dark:hover:bg-orange-400/10 transition-all duration-300">
                  <span className="text-xs sm:text-sm font-medium text-orange-500 dark:text-orange-400 text-center">BNB</span>
                </div>
                
                <div className="flex flex-col items-center p-3 sm:p-4 bg-white/50 dark:bg-black/30 rounded-lg border border-gray-100 dark:border-gray-800 hover:border-orange-400 dark:hover:border-orange-400 hover:bg-orange-400/10 dark:hover:bg-orange-400/10 transition-all duration-300">
                  <span className="text-xs sm:text-sm font-medium text-orange-500 dark:text-orange-400 text-center">Avalanche</span>
                </div>
              </div>
              
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 transition-colors duration-300">
                All major EVM-compatible networks supported with automatic chain detection
              </p>
            </div>
                 <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-light max-w-2xl mx-auto leading-relaxed transition-colors duration-300 mb-8">
              Generate professional PDF receipts for your crypto transactions in three simple steps
            </p>
          </div>  
          
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
              {[
                {
                  title: 'Connect Wallet',
                  description: 'Connect your MetaMask wallet and authenticate with Sign-In with Ethereum (SIWE) for secure access.'
                },
                {
                  title: 'Enter Transaction',
                  description: 'Provide your transaction hash and optionally add a description for context and record-keeping.'
                },
                {
                  title: 'Generate Receipt',
                  description: 'Pay a small fee in USDT / USDC and receive a professional PDF receipt with verified transaction details.'
                }
              ].map((step, index) => (
                <div key={index} className="text-center group">
                  <div className="border border-gray-200 dark:border-gray-800 p-4 sm:p-6 lg:p-8 bg-white/50 dark:bg-black/50 backdrop-blur-sm hover:border-orange-400 transition-all duration-500 hover:bg-white/70 dark:hover:bg-black/70">
                    <div className="flex items-center mb-4 sm:mb-6">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 text-orange-400 group-hover:text-orange-500 transition-colors duration-300 flex-shrink-0 mr-3 sm:mr-4">
                        {index === 0 && (
                          <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.4,7 14.8,8.6 14.8,10V11H16V16H8V11H9.2V10C9.2,8.6 10.6,7 12,7M12,8.2C11.2,8.2 10.4,8.7 10.4,10V11H13.6V10C13.6,8.7 12.8,8.2 12,8.2Z" />
                          </svg>
                        )}
                        {index === 1 && (
                          <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                          </svg>
                        )}
                        {index === 2 && (
                          <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                          </svg>
                        )}
                      </div>
                      <span className="text-xs font-light text-amber-400 uppercase tracking-wider">Step {index + 1}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-light text-black dark:text-white mb-3 sm:mb-4 tracking-wide transition-colors duration-300">{step.title}</h3>
                    <p className="text-gray-600 dark:text-gray-300 text-xs sm:text-sm font-light leading-relaxed transition-colors duration-300">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Service Features Info */}
            <div className="mt-12 sm:mt-16 lg:mt-20">
              <div className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 p-6 sm:p-8 max-w-5xl mx-auto transition-colors duration-300">
                <h3 className="text-lg sm:text-xl font-light text-black dark:text-white mb-6 sm:mb-8 text-center tracking-wide transition-colors duration-300">Service Features</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
                  <div className="text-center group">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6 bg-orange-400/10 rounded-full group-hover:bg-orange-400/20 transition-all duration-300">
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-orange-400 group-hover:text-orange-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="text-xl sm:text-2xl font-light text-orange-400 mb-2 group-hover:text-orange-500 transition-colors duration-300">{PAYMENT_AMOUNT} USDT / USDC</div>
                    <div className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 transition-colors duration-300">Service Fee</div>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed transition-colors duration-300">
                      Affordable flat rate for all transactions. No hidden costs or percentage fees.
                    </p>
                  </div>
                  
                  <div className="text-center group">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6 bg-orange-400/10 rounded-full group-hover:bg-orange-400/20 transition-all duration-300">
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-orange-400 group-hover:text-orange-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="text-xl sm:text-2xl font-light text-orange-400 mb-2 group-hover:text-orange-500 transition-colors duration-300">~30 Seconds</div>
                    <div className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 transition-colors duration-300">Processing Time</div>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed transition-colors duration-300">
                      Lightning-fast receipt generation with real-time blockchain verification.
                    </p>
                  </div>
                  
                  <div className="text-center group">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6 bg-orange-400/10 rounded-full group-hover:bg-orange-400/20 transition-all duration-300">
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-orange-400 group-hover:text-orange-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="text-xl sm:text-2xl font-light text-orange-400 mb-2 group-hover:text-orange-500 transition-colors duration-300">Professional</div>
                    <div className="text-sm sm:text-base font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 transition-colors duration-300">PDF Format</div>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed transition-colors duration-300">
                      Tax-compliant receipts with verified blockchain data and professional formatting.
                    </p>
                  </div>
                </div>
                
                {/* Additional Benefits */}
                <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 text-center">
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 text-green-500 mb-2">
                        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Blockchain Verified</span>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 text-blue-500 mb-2">
                        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Secure & Private</span>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 text-purple-500 mb-2">
                        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17v4a2 2 0 002 2h4" />
                        </svg>
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Tax Compliant</span>
                    </div>
                    
                    <div className="flex flex-col items-center">
                      <div className="w-8 h-8 text-orange-500 mb-2">
                        <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Instant Download</span>
                    </div>
                  </div>
                </div>
              </div>
            </div> 
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-20 lg:py-24 relative bg-white dark:bg-black text-center transition-colors duration-300">
          {/* Parallax CTA background */}
          <div className="absolute inset-0 parallax-cta" style={{
            backgroundImage: `
              radial-gradient(circle at 40% 40%, rgba(249, 115, 22, 0.12) 0%, transparent 70%),
              radial-gradient(circle at 80% 60%, rgba(245, 158, 11, 0.08) 0%, transparent 70%)
            `,
            backgroundSize: '180% 180%'
          }}></div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-thin text-black dark:text-white mb-6 sm:mb-8 tracking-wide transition-colors duration-300">
              Ready to start?
            </h2>
            <div className="w-16 sm:w-20 lg:w-24 h-px bg-orange-500 mx-auto mb-8 sm:mb-10 lg:mb-12"></div>
            <Link href="/generate" className="group relative inline-flex items-center justify-center px-8 sm:px-12 lg:px-16 py-4 sm:py-5 text-base sm:text-lg font-light text-white dark:text-black bg-orange-400 rounded-none hover:bg-orange-500 hover:text-white dark:hover:text-black transition-all duration-300">
              <span className="relative z-10">Generate Your First Receipt</span>
              <div className="absolute inset-0 bg-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
            </Link>
          </div>
        </section>
    </>
  )
}