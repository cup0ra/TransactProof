import Link from 'next/link'
import dynamic from 'next/dynamic'
import { PAYMENT_AMOUNT_WITHDISCOUNT } from '@/config'
import PdfSlider from '@/components/pdf-slider'

// Dynamically load heavy animated hero (no SSR to shrink initial HTML/JS)
// Use relative path to avoid occasional IDE path alias resolution mismatch
const HeroClient = dynamic(() => import('../components/hero-client').then(m => m.default), {
  loading: () => (
    <div className="h-screen flex items-center justify-center">
      <div className=" bg-white dark:bg-black flex flex-col transition-colors duration-300">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="w-6 h-6 border border-orange-500 border-t-transparent animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400 text-xs font-light transition-colors duration-300">Loading...</p>
          </div>
        </div>
      </div>
    </div>
  )
})

export default function HomePage() {
  return (
    <>
      <HeroClient />
      {/* How It Works Section (server-rendered static) */}
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
              <div className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 p-6 sm:p-8 max-w mx-auto transition-colors duration-300">
                <h3 className="text-lg sm:text-xl font-light text-black dark:text-white mb-6 sm:mb-8 text-center tracking-wide transition-colors duration-300">Service Features</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
                  <div className="text-center group">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center mx-auto mb-4 sm:mb-6 bg-orange-400/10 rounded-full group-hover:bg-orange-400/20 transition-all duration-300">
                      <svg className="w-8 h-8 sm:w-10 sm:h-10 text-orange-400 group-hover:text-orange-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <div className="text-xl sm:text-2xl font-light text-orange-400 mb-2 group-hover:text-orange-500 transition-colors duration-300">{PAYMENT_AMOUNT_WITHDISCOUNT} USDT / USDC</div>
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


        {/* PDF Customization Section */}
        <section className="py-16 sm:py-24 lg:py-32 relative bg-gray-50 dark:bg-black transition-colors duration-300">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              radial-gradient(circle at 40% 60%, rgba(245, 158, 11, 0.08) 0%, transparent 50%),
              radial-gradient(circle at 80% 40%, rgba(249, 115, 22, 0.06) 0%, transparent 50%)
            `,
            backgroundSize: '150% 150%'
          }}></div>
          
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-12 sm:mb-16">
              <h2 className="text-2xl sm:text-3xl font-light text-black dark:text-white mb-4 sm:mb-6 tracking-wide transition-colors duration-300">
                Customize Your Receipts
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-light max-w-2xl mx-auto leading-relaxed transition-colors duration-300">
                Make your PDF receipts truly yours with personalized branding and custom settings
              </p>
            </div>

            <div className="bg-white/50 dark:bg-black/50 backdrop-blur-sm border border-gray-200 dark:border-gray-800 p-6 sm:p-8 lg:p-12 transition-colors duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
                {/* Company Logo */}
                <div className="flex items-start space-x-4 group">
                  <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-orange-400/10 rounded-full flex items-center justify-center group-hover:bg-orange-400/20 transition-all duration-300">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-orange-400 group-hover:text-orange-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-black dark:text-white mb-2 transition-colors duration-300">
                      Company Logo
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed transition-colors duration-300">
                      Upload your company logo to appear on every receipt, adding professional branding to your transactions
                    </p>
                  </div>
                </div>

                {/* Company Name */}
                <div className="flex items-start space-x-4 group">
                  <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-orange-400/10 rounded-full flex items-center justify-center group-hover:bg-orange-400/20 transition-all duration-300">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-orange-400 group-hover:text-orange-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-black dark:text-white mb-2 transition-colors duration-300">
                      Company Name
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed transition-colors duration-300">
                      Set your company or business name to be displayed prominently on all generated receipts
                    </p>
                  </div>
                </div>

                {/* Website */}
                <div className="flex items-start space-x-4 group">
                  <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-orange-400/10 rounded-full flex items-center justify-center group-hover:bg-orange-400/20 transition-all duration-300">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-orange-400 group-hover:text-orange-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-black dark:text-white mb-2 transition-colors duration-300">
                      Website URL
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed transition-colors duration-300">
                      Add your website URL to receipts for easy reference and enhanced credibility
                    </p>
                  </div>
                </div>

                {/* ERC20 Transfer Details */}
                <div className="flex items-start space-x-4 group">
                  <div className="flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 bg-orange-400/10 rounded-full flex items-center justify-center group-hover:bg-orange-400/20 transition-all duration-300">
                    <svg className="w-6 h-6 sm:w-7 sm:h-7 text-orange-400 group-hover:text-orange-500 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-medium text-black dark:text-white mb-2 transition-colors duration-300">
                      Transaction Details
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed transition-colors duration-300">
                      Choose to show or hide ERC20 token transfers and other transaction details for cleaner receipts
                    </p>
                  </div>
                </div>
              </div>

              {/* Where to customize */}
              <div className="mt-8 sm:mt-10 pt-6 sm:pt-8 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 transition-colors duration-300">
                      Customize these settings in your <Link href="/dashboard" className="text-orange-500 hover:text-orange-600 font-medium transition-colors duration-300">Dashboard</Link> after connecting your wallet
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
  {/* PDF Examples Slider Section */}
        <PdfSlider />
        
        {/* CTA Section (static) */}
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