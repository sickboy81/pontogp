'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@/store/theme'

/**
 * Aplica o tema (dark/light) no document e persiste no localStorage.
 */
export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark', 'light')
    root.classList.add(theme)
  }, [theme])

  return <>{children}</>
}
