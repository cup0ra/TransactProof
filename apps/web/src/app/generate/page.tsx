'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { ReceiptGenerator } from '@/components/receipt-generator'
import { useAuth } from '@/hooks/use-auth'
import { useAccount } from 'wagmi'
import { ParallaxBackground } from '@/components/parallax-background'
import { PAYMENT_AMOUNT_WITHDISCOUNT } from '@/config'

// Dynamic import for motion to reduce initial bundle size
const MotionDiv = dynamic(
  () => import('framer-motion').then((mod) => mod.motion.div),
  { ssr: false }
)

export default function GeneratePage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { isConnected } = useAccount()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) {
      return
    }

    if (!isAuthenticated || !isConnected) {
      return
    }
  }, [mounted, isAuthenticated, isConnected, router])

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
          />
          
          <MotionDiv 
            className="relative z-40 w-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
          >
            
            {/* Receipt Generator Card */}
            <MotionDiv 
              className="relative max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: 0.3 }}
            >
              <div className="border rounded-2xl  border-gray-300/50 dark:border-gray-800/50 bg-white/20 dark:bg-black/20 backdrop-blur-sm p-4 sm:p-6 md:p-8 lg:p-12  transition-colors duration-300">
                <ReceiptGenerator />
              </div>
            </MotionDiv>
          
          </MotionDiv>
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
              <h2 className="text-2xl sm:text-3xl font-light text-black dark:text-white mb-4 sm:mb-6 tracking-wide transition-colors duration-300">
                Simple Process
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  number: "1",
                  title: "Submit Transaction",
                  description: "Enter your transaction hash and we'll fetch all the details from the blockchain automatically.",
                  icon: "→"
                },
                {
                  number: "2", 
                  title: "Secure Payment",
                  description: `Pay a minimal fee of ${PAYMENT_AMOUNT_WITHDISCOUNT} USDT / USDC to process your professional receipt generation.`,
                  icon: "◊"
                },
                {
                  number: "3",
                  title: "Download Receipt", 
                  description: "Receive a professionally formatted PDF receipt with complete transaction verification.",
                  icon: "↓"
                }
              ].map((step, index) => (
                <div key={index} className="group relative">
                  {/* Connection line */}
                  {index < 2 && (
                    <div className="hidden md:block absolute top-12 left-full w-8 h-px bg-gradient-to-r from-orange-400/60 to-transparent z-0"></div>
                  )}
                  
                  <div className="text-center group border border-gray-200 dark:border-gray-800 rounded-card-14 card-hover p-4 sm:p-6 lg:p-8 bg-white/50 dark:bg-black/50 backdrop-blur-sm duration-[250ms] ease-[cubic-bezier(.4,0,.2,1)] hover:bg-white/70 dark:hover:bg-black/70 cursor-pointer">
                    <div className="flex items-center gap-4 mb-10 text-orange-400">
                      <div className="w-10 h-10 flex items-center justify-center rounded-lg border border-orange-400/30 bg-orange-400/5 group-hover:border-orange-400 transition-colors duration-300">
                        {step.icon}
                      </div>
                      <span className="text-sm tracking-[0.14em] uppercase font-medium">Step {step.number}</span>
                    </div>
                    
                    <h3 className=" font-semibold text-white mb-6 tracking-tight text-center">{step.title}</h3>
                    <p className="text-xs sm:text-sm text-[#5a6480] font-normal leading-relaxed text-center max-w-xs mx-auto">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
    </>
  )
}