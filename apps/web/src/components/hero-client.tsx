'use client'

import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import dynamic from 'next/dynamic'

// Lazy load ParallaxBackground separately with loading state
const ParallaxBackground = dynamic(() => import('./parallax-background').then(m => m.ParallaxBackground), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-black" />
})

export default function HeroClient() {
  const ref = useRef<HTMLElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start']
  })

  const y = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0.3])

  return (
    <section ref={ref} className="relative h-screen flex items-center justify-center overflow-hidden">
      <motion.div className="absolute inset-0" style={{ y, opacity }}>
        <ParallaxBackground enableParallax={false} />
      </motion.div>

      <motion.div
        className="relative z-40 text-center max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <motion.div
          className="mb-8 sm:mb-12 lg:mb-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-thin text-black dark:text-white mb-4 sm:mb-6 tracking-wider"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            TransactProof
          </motion.h1>
        </motion.div>

        <motion.p
          className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 mb-8 sm:mb-12 lg:mb-16 max-w-2xl mx-auto font-light leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
        >
          Professional blockchain receipts.
          <br />
          <span className="text-gray-800 dark:text-orange-400">Minimal. Verified. Instant.</span>
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Link
            href="/generate"
            className="group relative inline-flex items-center justify-center px-8 sm:px-10 lg:px-12 py-3 sm:py-4 text-base sm:text-lg font-light text-white dark:text-black bg-orange-400 rounded-none hover:bg-orange-500 hover:text-white dark:hover:text-black transition-all duration-300 border-2 border-transparent hover:border-orange-600"
          >
            <span className="relative z-10">Generate Receipt</span>
            <div className="absolute inset-0 bg-orange-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center px-8 sm:px-10 lg:px-12 py-3 sm:py-4 text-base sm:text-lg font-light text-orange-400 border border-orange-400 rounded-none hover:border-orange-500 hover:text-orange-500 hover:bg-orange-950/10 dark:hover:bg-orange-950 transition-all duration-300"
          >
            Dashboard
          </Link>
        </motion.div>
      </motion.div>
    </section>
  )
}
