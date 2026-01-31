'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'

interface PdfSliderClientProps {
  pdfExamples: string[]
}

export default function PdfSliderClient({ pdfExamples }: PdfSliderClientProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const [slidesToShow, setSlidesToShow] = useState(1)
  const sliderRef = useRef<HTMLDivElement>(null)

  // Determine how many slides to show based on screen size
  useEffect(() => {
    const updateSlidesToShow = () => {
      if (window.innerWidth >= 1024) {
        setSlidesToShow(3) // Desktop: 3 slides
      } else if (window.innerWidth >= 640) {
        setSlidesToShow(2) // Tablet: 2 slides
      } else {
        setSlidesToShow(1) // Mobile: 1 slide
      }
    }

    updateSlidesToShow()
    window.addEventListener('resize', updateSlidesToShow)
    return () => window.removeEventListener('resize', updateSlidesToShow)
  }, [])

  const maxIndex = Math.max(0, pdfExamples.length - slidesToShow)

  const handlePrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? maxIndex : prev - 1))
  }, [maxIndex])

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev >= maxIndex ? 0 : prev + 1))
  }, [maxIndex])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      setFullscreenImage(null)
      document.body.style.overflow = 'unset'
    } else if (e.key === 'ArrowLeft') {
      if (fullscreenImage) {
        // Navigate through individual images in fullscreen
        const fullscreenIndex = pdfExamples.indexOf(fullscreenImage)
        const newIndex = fullscreenIndex === 0 ? pdfExamples.length - 1 : fullscreenIndex - 1
        setFullscreenImage(pdfExamples[newIndex])
      } else {
        handlePrevious()
      }
    } else if (e.key === 'ArrowRight') {
      if (fullscreenImage) {
        // Navigate through individual images in fullscreen
        const fullscreenIndex = pdfExamples.indexOf(fullscreenImage)
        const newIndex = fullscreenIndex === pdfExamples.length - 1 ? 0 : fullscreenIndex + 1
        setFullscreenImage(pdfExamples[newIndex])
      } else {
        handleNext()
      }
    }
  }, [handlePrevious, handleNext, fullscreenImage, pdfExamples])

  // Add keyboard listener when fullscreen is active
  useEffect(() => {
    if (!fullscreenImage) return
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [fullscreenImage, handleKeyDown])

  // If no examples, don't render anything
  if (!pdfExamples || pdfExamples.length === 0) {
    return null
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return

    const distance = touchStart - touchEnd
    const minSwipeDistance = 50

    if (distance > minSwipeDistance) {
      handleNext()
    } else if (distance < -minSwipeDistance) {
      handlePrevious()
    }

    setTouchStart(0)
    setTouchEnd(0)
  }

  const openFullscreen = (imageSrc: string) => {
    setFullscreenImage(imageSrc)
    document.body.style.overflow = 'hidden'
  }

  const closeFullscreen = () => {
    setFullscreenImage(null)
    document.body.style.overflow = 'unset'
  }

  return (
    <>
      <section className="py-16 sm:py-24 lg:py-32 relative bg-white dark:bg-black transition-colors duration-300">
        <div className="absolute inset-0" style={{
          backgroundImage: `
            radial-gradient(circle at 80% 20%, rgba(249, 115, 22, 0.08) 0%, transparent 50%),
            radial-gradient(circle at 30% 70%, rgba(245, 158, 11, 0.06) 0%, transparent 50%)
          `,
          backgroundSize: '150% 150%'
        }}></div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-light text-black dark:text-white mb-4 sm:mb-6 tracking-wide transition-colors duration-300">
              Receipt Examples
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm font-light max-w-2xl mx-auto leading-relaxed transition-colors duration-300">
              See what your professional blockchain receipts will look like
            </p>
          </div>

          <div className="relative">
            {/* Slider Container */}
            <div
              ref={sliderRef}
              className="relative overflow-hidden"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${(currentIndex * 100) / slidesToShow}%)` }}
              >
                {pdfExamples.map((src, index) => (
                  <div
                    key={index}
                    className="flex-shrink-0 px-2 sm:px-3 lg:px-4"
                    style={{ width: `${100 / slidesToShow}%` }}
                  >
                    <div
                      className="relative aspect-[3/4] mx-auto cursor-pointer group"
                      onClick={() => openFullscreen(src)}
                    >
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 flex items-center justify-center">
                        <div className="text-white text-sm sm:text-base font-light flex items-center gap-2">
                          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                          </svg>
                          <span>Click to view full size</span>
                        </div>
                      </div>
                      <Image
                        src={src}
                        alt={`Receipt example ${index + 1}`}
                        fill
                        className="object-contain border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Buttons */}
            <button
              onClick={handlePrevious}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-20 p-2 bg-white/90 dark:bg-black/90 border border-gray-300 dark:border-gray-700 hover:bg-orange-400 hover:border-orange-600 hover:text-white dark:hover:text-white dark:hover:bg-orange-400 dark:hover:border-orange-400 transition-all duration-300 shadow-lg"
              aria-label="Previous image"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              onClick={handleNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-20 p-2  bg-white/90 dark:bg-black/90 border border-gray-300 dark:border-gray-700 hover:bg-orange-400 hover:border-orange-600 hover:text-white dark:hover:text-white dark:hover:bg-orange-400 dark:hover:border-orange-400 transition-all duration-300 shadow-lg"
              aria-label="Next image"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Dots Indicator */}
            <div className="flex justify-center gap-2 mt-6 sm:mt-8">
              {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex
                      ? 'bg-orange-400 w-8'
                      : 'bg-gray-300 dark:bg-gray-700 hover:bg-orange-300'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Fullscreen Modal */}
      {fullscreenImage && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
          onClick={closeFullscreen}
        >
          <button
            onClick={closeFullscreen}
            className="absolute top-4 right-4 z-50 p-2 text-white hover:text-orange-400 transition-colors duration-300"
            aria-label="Close fullscreen"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="relative w-full h-full max-w-5xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
            <Image
              src={fullscreenImage}
              alt="Receipt fullscreen"
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
          </div>

          {/* Fullscreen Navigation */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              const fullscreenIndex = pdfExamples.indexOf(fullscreenImage || '')
              const newIndex = fullscreenIndex === 0 ? pdfExamples.length - 1 : fullscreenIndex - 1
              setFullscreenImage(pdfExamples[newIndex])
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 text-white hover:text-orange-400 transition-colors duration-300"
            aria-label="Previous image"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation()
              const fullscreenIndex = pdfExamples.indexOf(fullscreenImage || '')
              const newIndex = fullscreenIndex === pdfExamples.length - 1 ? 0 : fullscreenIndex + 1
              setFullscreenImage(pdfExamples[newIndex])
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 text-white hover:text-orange-400 transition-colors duration-300"
            aria-label="Next image"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {pdfExamples.indexOf(fullscreenImage || '') + 1} / {pdfExamples.length}
          </div>
        </div>
      )}
    </>
  )
}
