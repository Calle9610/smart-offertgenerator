'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import QuoteForm from '@/components/QuoteForm'

export default function NewQuotePage() {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (!storedToken) {
      router.push('/')
      return
    }
    setToken(storedToken)
    setLoading(false)
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!token) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-4xl p-6">
        <header className="mb-6">
          <h2 className="text-xl font-semibold">Create New Quote</h2>
        </header>
        <QuoteForm />
      </div>
    </div>
  )
}
