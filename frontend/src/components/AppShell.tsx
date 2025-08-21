'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { 
  Menu, 
  X, 
  Search, 
  Home, 
  FileText, 
  Settings, 
  Users, 
  BookOpen,
  ChevronRight,
  Building2,
  LogOut,
  User
} from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import { useAuth } from '@/lib/AuthContext'

interface NavigationItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }> | React.ComponentType<any>
  badge?: string
  description?: string
  requireSuperUser?: boolean
}

const navigation: NavigationItem[] = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: Home,
    description: 'Översikt och statistik'
  },
  { 
    name: 'Offert', 
    href: '/quotes', 
    icon: FileText,
    description: 'Hantera offerter'
  },
  { 
    name: 'Mallar & Regler', 
    href: '/templates', 
    icon: BookOpen,
    description: 'Offertmallar och regler'
  },
  { 
    name: 'Kunder', 
    href: '/customers', 
    icon: Users,
    description: 'Kundhantering'
  },
  { 
    name: 'Inställningar', 
    href: '/settings', 
    icon: Settings,
    description: 'Applikationsinställningar'
  },
  { 
    name: 'Auto-tuning', 
    href: '/auto-tuning', 
    icon: BookOpen,
    description: 'Automatisk optimering',
    requireSuperUser: true
  },
  { 
    name: 'Admin Regler', 
    href: '/admin/rules', 
    icon: Settings,
    description: 'Administrera regler',
    requireSuperUser: true
  },
  { 
    name: 'Test ErrorBoundary', 
    href: '/test-error-boundary', 
    icon: BookOpen,
    description: 'Testa ErrorBoundary-funktionalitet'
  },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const sidebarRef = useRef<HTMLDivElement>(null)
  const firstFocusableRef = useRef<HTMLButtonElement>(null)
  const lastFocusableRef = useRef<HTMLButtonElement>(null)
  const { user, isAuthenticated, logout } = useAuth()

  // Filtrera navigation baserat på användarbehörighet
  const filteredNavigation = navigation.filter(item => {
    if (item.requireSuperUser && (!user || !user.is_superuser)) {
      return false
    }
    return true
  })

  // Stäng sidebar på ESC
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false)
      }
    }

    if (sidebarOpen) {
      document.addEventListener('keydown', handleEscape)
      // Lås scroll på body när sidebar är öppen
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [sidebarOpen])

  // Stäng sidebar när route ändras
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Focus trap för sidebar
  const handleSidebarKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab') {
      if (e.shiftKey) {
        if (document.activeElement === firstFocusableRef.current) {
          e.preventDefault()
          lastFocusableRef.current?.focus()
        }
      } else {
        if (document.activeElement === lastFocusableRef.current) {
          e.preventDefault()
          firstFocusableRef.current?.focus()
        }
      }
    }
  }

  // Sökfunktionalitet
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Implementera sökfunktionalitet
    console.log('Sök implementeras här')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Skip to content link för tillgänglighet */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:bg-brand-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-md focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
      >
        Hoppa till innehåll
      </a>

      {/* Topbar */}
      <header className="sticky top-0 z-40 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="flex h-16 items-center gap-4 px-4 sm:px-6">
          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Öppna sidomeny"
            ref={firstFocusableRef}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Logo och appnamn */}
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-semibold text-foreground">Smart Offertgenerator</h1>
              <p className="text-xs text-muted-foreground">Proffsig offerthantering</p>
            </div>
          </div>

          {/* Sökfält */}
          <div className="flex-1 max-w-md mx-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Sök offerter, kunder..."
                className="pl-10 w-full"
                aria-label="Sök i applikationen"
              />
            </form>
          </div>

          {/* Höger sida - Theme toggle och användarinfo */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <span>Admin</span>
              <Badge variant="brand" size="sm">Pro</Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Sidebar overlay för mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 transform bg-card border-r transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        onKeyDown={handleSidebarKeyDown}
      >
        <div className="flex h-full flex-col">
          {/* Sidebar header */}
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-brand-600 text-white">
                <Building2 className="h-4 w-4" />
              </div>
              <span className="font-semibold text-foreground">Meny</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setSidebarOpen(false)}
              aria-label="Stäng sidomeny"
              ref={lastFocusableRef}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = item.icon
              
              return (
                <a
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'group flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground',
                    isActive 
                      ? 'bg-brand-100 text-brand-900 border-r-2 border-brand-600 dark:bg-brand-900/20 dark:text-brand-100 dark:border-brand-400' 
                      : 'text-muted-foreground'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className={cn(
                    'h-4 w-4 transition-colors',
                    isActive 
                      ? 'text-brand-600 dark:text-brand-400' 
                      : 'text-muted-foreground group-hover:text-accent-foreground'
                  )} />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <Badge variant="secondary" size="sm">{item.badge}</Badge>
                  )}
                  {!isActive && (
                    <ChevronRight className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
                  )}
                </a>
              )
            })}
          </nav>

          {/* Sidebar footer */}
          <div className="border-t p-4 space-y-3">
            {/* Användarinformation */}
            {isAuthenticated && user && (
              <div className="rounded-lg bg-muted/50 p-3">
                <div className="flex items-center gap-2 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{user.username}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </div>
                {user.is_superuser && (
                  <Badge variant="secondary" size="sm" className="mt-2">
                    Superuser
                  </Badge>
                )}
              </div>
            )}

            {/* System status */}
            <div className="rounded-lg bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm">
                <div className="h-2 w-2 rounded-full bg-success-500" />
                <span className="text-muted-foreground">System online</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Senast uppdaterad: {new Date().toLocaleTimeString('sv-SE', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </p>
            </div>

            {/* Logout knapp */}
            {isAuthenticated && (
              <Button
                variant="outline"
                size="sm"
                onClick={logout}
                className="w-full"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logga ut
              </Button>
            )}
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main 
        id="main-content"
        className="flex-1 md:ml-64 transition-all duration-300"
        tabIndex={-1}
      >
        <div className="container mx-auto px-4 py-6">
          {children}
        </div>
      </main>
    </div>
  )
}
