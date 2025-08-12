import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Offertgenerator' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="sv">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <div className="mx-auto max-w-4xl p-6">
          <header className="mb-6">
            <h1 className="text-2xl font-semibold">Offertgenerator</h1>
          </header>
          {children}
        </div>
      </body>
    </html>
  )
}
