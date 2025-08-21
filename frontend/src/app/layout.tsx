import './globals.css'
import type { Metadata } from 'next'
import { AppShell } from '@/components/AppShell'
import { ErrorBoundary, ErrorToastManager, SuccessToastManager } from '@/components/system'

export const metadata: Metadata = { 
  title: 'Smart Offertgenerator',
  description: 'Proffsig offerthantering för företag',
  viewport: 'width=device-width, initial-scale=1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ErrorBoundary>
          <AppShell>
            {children}
          </AppShell>
          <ErrorToastManager position="top-right" maxToasts={3} />
          <SuccessToastManager position="bottom-right" maxToasts={3} />
        </ErrorBoundary>
      </body>
    </html>
  )
}
