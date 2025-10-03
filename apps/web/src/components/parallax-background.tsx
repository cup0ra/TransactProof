'use client'

import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'
import { useTheme } from '@/contexts/theme-context'

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
  /** Mobile background image for dark theme */
  mobileDarkThemeImage?: string
  /** Mobile background image for light theme */
  mobileLightThemeImage?: string
  /** Additional CSS classes */
  className?: string
}

export function ParallaxBackground({
  enableParallax = true,
  parallaxSpeed = 0.5,
  minOpacity = 0.3,
  opacityFadeRate = 0.001,
  darkThemeImage = '/bg-dark.png',
  lightThemeImage = '/bg-white.png',
  mobileDarkThemeImage = '/bg-mb-dark.png',
  mobileLightThemeImage = '/bg-mb-white.png',
  className = ''
}: ParallaxBackgroundProps) {
  const [scrollY, setScrollY] = useState(0)
  const [isDark, setIsDark] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [image, setImage] = useState('')
  const backgroundRef = useRef<HTMLDivElement>(null)
  const themeContext = useTheme()

  useEffect(() => {
    setIsDark(themeContext.resolvedTheme === 'dark')
    setImage(getBackgroundImage(themeContext.resolvedTheme === 'dark', isMobile))
  }, [themeContext, isMobile])

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    const handleResize = () => {
      checkScreenSize()
    }
    
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

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

  // Choose the right image based on theme and screen size
  const getBackgroundImage = (isDark: boolean, isMobile: boolean) => {
    if (isMobile) {
      return isDark ? mobileDarkThemeImage : mobileLightThemeImage
    } else {
      return isDark ? darkThemeImage : lightThemeImage
    }
  }

  return (
    <>
      {image && (
        <div 
          ref={backgroundRef}
          className={`absolute inset-0 ${className}`}
          style={parallaxStyle}
        >
          {/* Single dynamic background image */}
          <Image
            src={image}
            alt="Digital receipts background"
            fill
            className="object-cover"
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
      )}
    </>
  )
}