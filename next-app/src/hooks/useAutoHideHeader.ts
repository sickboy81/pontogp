'use client'

import { useEffect, useRef, useState } from 'react'
import { getHeaderVisibility } from '@/lib/header-scroll.mjs'

export function useAutoHideHeader(locked: boolean, resetKey: string) {
  const [visible, setVisible] = useState(true)
  const previousYRef = useRef(0)
  const visibleRef = useRef(true)
  const rafRef = useRef<number | null>(null)

  const scheduleVisibleReset = () => {
    if (typeof window === 'undefined') return
    window.requestAnimationFrame(() => setVisible(true))
  }

  useEffect(() => {
    if (typeof window === 'undefined') return

    previousYRef.current = window.scrollY
    visibleRef.current = true
    scheduleVisibleReset()
  }, [resetKey])

  useEffect(() => {
    if (locked) {
      visibleRef.current = true
      scheduleVisibleReset()
    }
  }, [locked])

  useEffect(() => {
    if (typeof window === 'undefined') return

    previousYRef.current = window.scrollY

    const onScroll = () => {
      if (rafRef.current !== null) return

      rafRef.current = window.requestAnimationFrame(() => {
        rafRef.current = null
        const currentY = window.scrollY
        const nextVisible = getHeaderVisibility({
          previousY: previousYRef.current,
          currentY,
          locked,
          previousVisible: visibleRef.current,
        })

        previousYRef.current = currentY
        if (nextVisible !== visibleRef.current) {
          visibleRef.current = nextVisible
          setVisible(nextVisible)
        }
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [locked])

  return visible
}
