'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'

type Theme = 'light' | 'dark' | 'system'

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('system')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return

    const root = window.document.documentElement

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.toggle('dark', systemTheme === 'dark')
    } else {
      root.classList.toggle('dark', theme === 'dark')
    }

    localStorage.setItem('theme', theme)
  }, [theme, mounted])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = () => {
      if (theme === 'system') {
        const root = window.document.documentElement
        root.classList.toggle('dark', mediaQuery.matches)
      }
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [theme])

  if (!mounted) {
    return (
      <div className="h-9 w-9 animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-700" />
    )
  }

  const toggleTheme = () => {
    const themes: Theme[] = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />
      case 'dark':
        return <Moon className="h-4 w-4" />
      case 'system':
        return <Monitor className="h-4 w-4" />
    }
  }

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Ljust tema'
      case 'dark':
        return 'Mörkt tema'
      case 'system':
        return 'Systemtema'
    }
  }

  const getNextThemeLabel = () => {
    const themes: Theme[] = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    const nextTheme = themes[nextIndex]
    
    switch (nextTheme) {
      case 'light':
        return 'Byt till ljust tema'
      case 'dark':
        return 'Byt till mörkt tema'
      case 'system':
        return 'Byt till systemtema'
    }
  }

  return (
    <button
      onClick={toggleTheme}
      className="group relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 bg-background text-neutral-700 transition-colors hover:bg-neutral-50 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:border-neutral-700 dark:bg-background dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
      aria-label={getNextThemeLabel()}
      title={getNextThemeLabel()}
    >
      <div className="relative">
        {getThemeIcon()}
        {/* Theme indicator */}
        <div className="absolute -bottom-1 -right-1 h-2 w-2 rounded-full bg-neutral-400 dark:bg-neutral-500" />
      </div>
      
      {/* Tooltip */}
      <div className="pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-md bg-neutral-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-neutral-100 dark:text-neutral-900">
        {getThemeLabel()}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-neutral-900 dark:border-t-neutral-100" />
      </div>
    </button>
  )
}

export function ThemeToggleWithLabel() {
  const [theme, setTheme] = useState<Theme>('system')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return

    const root = window.document.documentElement

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      root.classList.toggle('dark', systemTheme === 'dark')
    } else {
      root.classList.toggle('dark', theme === 'dark')
    }

    localStorage.setItem('theme', theme)
  }, [theme, mounted])

  if (!mounted) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-4 w-4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
        <div className="h-4 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
      </div>
    )
  }

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'Ljust'
      case 'dark':
        return 'Mörkt'
      case 'system':
        return 'System'
    }
  }

  const getNextThemeLabel = () => {
    const themes: Theme[] = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    const nextTheme = themes[nextIndex]
    
    switch (nextTheme) {
      case 'light':
        return 'Byt till ljust tema'
      case 'dark':
        return 'Byt till mörkt tema'
      case 'system':
        return 'Byt till systemtema'
    }
  }

  return (
    <button
      onClick={() => {
        const themes: Theme[] = ['light', 'dark', 'system']
        const currentIndex = themes.indexOf(theme)
        const nextIndex = (currentIndex + 1) % themes.length
        setTheme(themes[nextIndex])
      }}
      className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
      aria-label={getNextThemeLabel()}
    >
      {getThemeIcon()}
      <span>{getThemeLabel()}</span>
    </button>
  )
}

function getThemeIcon() {
  // This function is used by ThemeToggleWithLabel
  // It will be replaced by the actual icon based on current theme
  return <Monitor className="h-4 w-4" />
}
