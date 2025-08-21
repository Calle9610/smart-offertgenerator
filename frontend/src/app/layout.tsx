import './globals.css'
import type { Metadata } from 'next'
import { AppShell } from '@/components/AppShell'
import { ErrorBoundary, ErrorToastManager, SuccessToastManager } from '@/components/system'
import { AuthProvider } from '@/lib/AuthContext'
import { getServerSession } from '@/lib/serverSession'

export const metadata: Metadata = { 
  title: 'Smart Offertgenerator',
  description: 'Proffsig offerthantering för företag',
  viewport: 'width=device-width, initial-scale=1',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default async function RootLayout({ children }: RootLayoutProps) {
  // Hämta server-side session för alla sidor
  // Publika sidor kommer att hanteras av komponenterna själva
  const user = await getServerSession()

  return (
    <html lang="sv" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ErrorBoundary>
          <AuthProvider initialUser={user}>
            <AppShell>
              {children}
            </AppShell>
          </AuthProvider>
          <ErrorToastManager position="top-right" maxToasts={3} />
          <SuccessToastManager position="bottom-right" maxToasts={3} />
        </ErrorBoundary>
      </body>
    </html>
  )
}
