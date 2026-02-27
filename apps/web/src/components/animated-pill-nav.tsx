'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

type AnimatedPillNavItem = {
  key: string
  label: string
  href?: string
  onClick?: () => void
}

type AnimatedPillNavProps = {
  items: AnimatedPillNavItem[]
  activeKey: string | null
  className?: string
  itemBaseClassName?: string
  itemActiveClassName?: string
  itemInactiveClassName?: string
  pillClassName?: string
}

export function AnimatedPillNav({
  items,
  activeKey,
  className = 'relative hidden md:flex space-x-5 lg:space-x-7 xl:space-x-10',
  itemBaseClassName = 'relative overflow-hidden rounded-xl px-2.5 py-1.5 text-[12px] transition-colors duration-300 font-light',
  itemActiveClassName = 'text-orange-400 dark:text-orange-400',
  itemInactiveClassName = 'text-gray-900 dark:text-gray-300 hover:text-orange-400 dark:hover:text-orange-400',
  pillClassName = 'absolute inset-0 rounded-xl border border-orange-400/90 bg-orange-400/10 shadow-[0_0_0_1px_rgba(251,146,60,0.25),0_8px_20px_rgba(251,146,60,0.18)]',
}: AnimatedPillNavProps) {
  const itemRefs = useRef<Record<string, HTMLElement | null>>({})
  const [hoveredKey, setHoveredKey] = useState<string | null>(null)
  const [activePill, setActivePill] = useState({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    opacity: 0,
  })
  const isFirstPillUpdate = useRef(true)

  const indicatorKey = hoveredKey ?? activeKey

  useEffect(() => {
    if (hoveredKey && !items.some((item) => item.key === hoveredKey)) {
      setHoveredKey(null)
    }
  }, [hoveredKey, items])

  useLayoutEffect(() => {
    const updateActivePill = () => {
      if (!indicatorKey) {
        setActivePill((prev) => ({ ...prev, opacity: 0 }))
        return
      }

      const activeElement = itemRefs.current[indicatorKey]
      if (!activeElement) {
        setActivePill((prev) => ({ ...prev, opacity: 0 }))
        return
      }

      setActivePill({
        left: activeElement.offsetLeft,
        top: activeElement.offsetTop,
        width: activeElement.offsetWidth,
        height: activeElement.offsetHeight,
        opacity: 1,
      })

      if (isFirstPillUpdate.current) {
        requestAnimationFrame(() => {
          isFirstPillUpdate.current = false
        })
      }
    }

    updateActivePill()
    window.addEventListener('resize', updateActivePill)

    return () => {
      window.removeEventListener('resize', updateActivePill)
    }
  }, [indicatorKey, items])

  const getItemClassName = (isActive: boolean) => {
    return `${itemBaseClassName} ${isActive ? itemActiveClassName : itemInactiveClassName}`
  }

  return (
    <nav className={className} onMouseLeave={() => setHoveredKey(null)}>
      <motion.span
        className={pillClassName}
        initial={false}
        animate={activePill}
        transition={
          isFirstPillUpdate.current
            ? { duration: 0 }
            : {
                type: 'spring',
                stiffness: 150,
                damping: 22,
                mass: 0.8,
              }
        }
        style={{ willChange: 'transform, width, height, opacity' }}
      />

      {items.map((item) => {
        const sharedProps = {
          onMouseEnter: () => setHoveredKey(item.key),
          onFocus: () => setHoveredKey(item.key),
          onBlur: () => setHoveredKey(null),
          className: getItemClassName(activeKey === item.key),
        }

        if (item.href) {
          return (
            <Link
              key={item.key}
              {...sharedProps}
              href={item.href}
              ref={(el) => {
                itemRefs.current[item.key] = el
              }}
            >
              <span className="relative z-10">{item.label}</span>
            </Link>
          )
        }

        return (
          <button
            key={item.key}
            {...sharedProps}
            type="button"
            onClick={item.onClick}
            ref={(el) => {
              itemRefs.current[item.key] = el
            }}
          >
            <span className="relative z-10">{item.label}</span>
          </button>
        )
      })}
    </nav>
  )
}
