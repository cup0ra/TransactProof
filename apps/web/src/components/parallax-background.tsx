'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'

interface ParallaxBackgroundProps {
  /** Enable parallax scroll effect */
  enableParallax?: boolean
  /** Parallax movement multiplier (0-1, where 0.5 means half speed) */
  parallaxSpeed?: number
  /** Minimum opacity when scrolled */
  minOpacity?: number
  /** Opacity fade rate per scroll pixel */
  opacityFadeRate?: number
  /** Background image for dark theme */
  darkThemeImage?: string
  /** Background image for light theme */
  lightThemeImage?: string
  /** Additional CSS classes */
  className?: string
}

export function ParallaxBackground({
  enableParallax = true,
  parallaxSpeed = 0.5,
  minOpacity = 0.3,
  opacityFadeRate = 0.001,
  darkThemeImage = '/bg1.png',
  lightThemeImage = '/bg3.png',
  className = ''
}: ParallaxBackgroundProps) {
  const [scrollY, setScrollY] = useState(0)
  const backgroundRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enableParallax) return

    const handleScroll = () => {
      setScrollY(window.scrollY)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [enableParallax])

  const parallaxStyle = enableParallax ? {
    transform: `translateY(${scrollY * parallaxSpeed}px)`,
    opacity: Math.max(minOpacity, 1 - scrollY * opacityFadeRate)
  } : {}

  return (
    <div 
      ref={backgroundRef}
      className={`absolute inset-0 ${className}`}
      style={parallaxStyle}
    >
      {/* Background for dark theme */}
      <Image
        src={darkThemeImage}
        alt="Digital receipts background dark"
        fill
        className="object-cover dark:block hidden"
        priority
        quality={90}
      />
      
      {/* Background for light theme */}
      <Image
        src={lightThemeImage}
        alt="Digital receipts background light"
        fill
        className="object-cover dark:hidden block"
        priority
        quality={90}
      />
      
      {/* Top overlay with 0.2 opacity - white for light theme, black for dark theme */}
      <div className="absolute inset-0 bg-white dark:bg-black opacity-20 z-1"></div>
      
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40 transition-colors duration-300 z-2"></div>
      
      {/* Gradient overlay for smooth text integration */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-black/15 z-3"></div>
    </div>
  )
}