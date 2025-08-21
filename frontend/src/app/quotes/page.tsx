'use client'

import { useState, useMemo, useCallback, memo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

/*
 * A11Y CHECKLIST - Quotes Page
 * ✅ scope="col" på alla th-element - Korrekt tabellstruktur
 * ✅ aria-label på tabell - "Offertlista" för screen readers
 * ✅ aria-label på alla knappar - Beskrivande text
 * ✅ Focus ring på alla klickbara element - ring-2 focus:ring-ring
 * ✅ Semantisk HTML - table, thead, tbody, th, td
 * ✅ Hover states - hover:bg-gray-50
 * ✅ Keyboard navigation - TAB genom alla interaktiva element
 * 
 * MANUELL TESTNING:
 * 1. TAB genom sidan - ska följa logisk ordning
 * 2. Screen reader - ska läsa tabellstruktur korrekt
 * 3. Hover states - ska vara synliga på tabellrader
 * 4. Focus ring - ska vara synlig på alla knappar
 * 5. Tabellnavigering - ska gå kolumn för kolumn
 */
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Send, 
  Calendar,
  DollarSign,
  User,
  FileText,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  usePromiseState, 
  LoadingSkeleton, 
  ErrorState, 
  useSuccessHandler
} from '@/components/system'
import { useCopy } from '@/copy/useCopy'

// Mock data - ersätt med riktig API-anrop
const mockQuotes = [
  {
    id: '1',
    quoteNumber: 'OFF-2024-001',
    customer: 'Svenska Bygg AB',
    project: 'Kontorsrenovering',
    amount: 125000,
    status: 'draft',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    quoteNumber: 'OFF-2024-002',
    customer: 'Stockholm Fastigheter',
    project: 'Lägenhetsrenovering',
    amount: 89000,
    status: 'sent',
    updatedAt: '2024-01-14T14:20:00Z'
  },
  {
    id: '3',
    quoteNumber: 'OFF-2024-003',
    customer: 'Göteborg Entreprenad',
    project: 'Villa tillbyggnad',
    amount: 245000,
    status: 'accepted',
    updatedAt: '2024-01-13T09:15:00Z'
  }
]

const statusOptions = [
  { value: 'all', label: 'Alla statusar' },
  { value: 'draft', label: 'Utkast' },
  { value: 'sent', label: 'Skickad' },
  { value: 'accepted', label: 'Accepterad' },
  { value: 'declined', label: 'Avböjt' }
]

const statusConfig = {
  draft: { label: 'Utkast', variant: 'secondary' as const },
  sent: { label: 'Skickad', variant: 'warn' as const },
  accepted: { label: 'Accepterad', variant: 'success' as const },
  declined: { label: 'Avböjt', variant: 'error' as const }
}

// Memoized table row component for better performance
const QuoteTableRow = memo(({ 
  quote, 
  index, 
  onView, 
  onEdit, 
  onSend,
  isSending
}: { 
  quote: typeof mockQuotes[0]
  index: number
  onView: (id: string) => void
  onEdit: (id: string) => void
  onSend: (id: string) => void
  isSending: boolean
}) => (
  <motion.tr
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.2, delay: index * 0.05, ease: 'easeOut' }}
    className="hover:bg-gray-50 transition-all duration-150 ease-out"
  >
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <FileText className="h-4 w-4 text-blue-600 mr-2" />
        <span className="text-sm font-medium text-gray-900">
          {quote.quoteNumber}
        </span>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <User className="h-4 w-4 text-gray-400 mr-2" />
        <span className="text-sm text-gray-900">
          {quote.customer}
        </span>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <span className="text-sm text-gray-900">
        {quote.project}
      </span>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <DollarSign className="h-4 w-4 text-green-600 mr-1" />
        <span className="text-sm font-medium text-gray-900">
          {quote.amount.toLocaleString('sv-SE')} kr
        </span>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <Badge 
        variant={statusConfig[quote.status as keyof typeof statusConfig].variant}
        size="sm"
      >
        {statusConfig[quote.status as keyof typeof statusConfig].label}
      </Badge>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <Calendar className="h-4 w-4 text-gray-400 mr-2" />
        <span className="text-sm text-gray-900">
          {new Date(quote.updatedAt).toLocaleDateString('sv-SE')}
        </span>
      </div>
    </td>
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center space-x-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onView(quote.id)}
          aria-label={`Visa offert ${quote.quoteNumber}`}
          className="transition-all duration-150 ease-out"
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(quote.id)}
          aria-label={`Redigera offert ${quote.quoteNumber}`}
          className="transition-all duration-150 ease-out"
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSend(quote.id)}
          disabled={isSending}
          loading={isSending}
          aria-label={`Skicka offert ${quote.quoteNumber}`}
          className="transition-all duration-150 ease-out"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </td>
  </motion.tr>
))

QuoteTableRow.displayName = 'QuoteTableRow'

export default function QuotesPage() {
  const router = useRouter()
  const copy = useCopy()
  const { handleSendSuccess } = useSuccessHandler()
  
  // State management
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateRange, setDateRange] = useState('all')
  
  // Loading states för actions
  const [loadingStates, setLoadingStates] = useState<{
    sendQuote: { [key: string]: boolean }
  }>({
    sendQuote: {}
  })
  
  // Use the new promise state hook
  const quotesState = usePromiseState(mockQuotes)
  
  // Filtered quotes
  const filteredQuotes = useMemo(() => {
    let filtered = quotesState.data || []
    
    if (searchTerm) {
      filtered = filtered.filter(quote => 
        quote.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
        quote.quoteNumber.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(quote => quote.status === statusFilter)
    }
    
    return filtered
  }, [quotesState.data, searchTerm, statusFilter])

  const handleCreateQuote = useCallback(() => {
    router.push('/quotes/new')
  }, [router])

  const handleViewQuote = useCallback((id: string) => {
    router.push(`/quotes/${id}`)
  }, [router])

  const handleEditQuote = useCallback((id: string) => {
    router.push(`/quotes/${id}/edit`)
  }, [router])

  const handleSendQuote = useCallback(async (id: string) => {
    // Sätt loading state för denna offert
    setLoadingStates(prev => ({
      ...prev,
      sendQuote: { ...prev.sendQuote, [id]: true }
    }))
    
    try {
      // TODO: Implementera riktig API-anrop
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulera API-anrop
      
      // Simulera framgångsrik sändning
      console.log('Quote sent successfully:', id)
      
      // Visa success feedback
      handleSendSuccess('offert', undefined, [
        {
          label: 'Visa offert',
          icon: 'external',
          onClick: () => console.log('Show quote:', id)
        }
      ])
      
      // Här skulle vi kunna uppdatera offertens status till 'sent'
      // setQuotes(prev => prev.map(q => 
      //   q.id === id ? { ...q, status: 'sent' } : q
      // ))
      
    } catch (error) {
      console.error('Failed to send quote:', error)
      // Här skulle vi kunna visa en error toast
    } finally {
      // Rensa loading state
      setLoadingStates(prev => ({
        ...prev,
        sendQuote: { ...prev.sendQuote, [id]: false }
      }))
    }
  }, [handleSendSuccess])

  const handleRetry = useCallback(() => {
    // Simulera en ny fetch
    quotesState.execute(Promise.resolve(mockQuotes))
  }, [quotesState])

  // Loading state
  if (quotesState.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Offertlista</h1>
          <LoadingSkeleton className="h-10 w-32" />
        </div>
        {/* TableSkeleton is removed as per new_code, so we'll just show a placeholder or remove it if not needed */}
        <p className="text-center text-gray-500">Laddar offerter...</p>
      </div>
    )
  }

  // Error state
  if (quotesState.isError) {
    return (
      <ErrorState
        error={quotesState.error}
        retry={{
          onClick: handleRetry,
          label: 'Försök igen'
        }}
      />
    )
  }

  // Empty state
  if (!quotesState.data || quotesState.data.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
          <FileText className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Inga offerter än</h3>
        <p className="text-gray-600 max-w-md mx-auto mb-6">
          Skapa din första offert för att komma igång med att hantera kundprojekt.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={handleCreateQuote}
            leftIcon={<Plus className="h-4 w-4" />}
            variant="default"
          >
            {copy.actions.create}
          </Button>
          <Button
            onClick={() => console.log('Import quotes')}
            variant="outline"
          >
            Importera offerter
          </Button>
        </div>
      </div>
    )
  }

  // Success state with filtered results
  if (filteredQuotes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 mb-4">
          <Search className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Inga resultat hittades</h3>
        <p className="text-gray-600 max-w-md mx-auto mb-6">
          Prova att ändra dina söktermer eller filter för att hitta det du letar efter.
        </p>
        <div className="flex gap-3 justify-center">
          <Button
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('all')
              setDateRange('all')
            }}
            variant="outline"
          >
            Rensa sökning
          </Button>
          <Button
            onClick={handleCreateQuote}
            leftIcon={<Plus className="h-4 w-4" />}
            variant="default"
          >
            {copy.actions.create}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Offertlista</h1>
          <p className="text-gray-600 mt-1">
            Hantera dina offerter och kundprojekt
          </p>
        </div>
        <Button
          onClick={handleCreateQuote}
          leftIcon={<Plus className="h-4 w-4" />}
          className="w-full sm:w-auto transition-all duration-150 ease-out"
        >
          {copy.actions.create}
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Sök efter kund, projekt eller offertnummer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 transition-all duration-150 ease-out"
                aria-label={copy.actions.search}
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
              aria-label={`${copy.actions.filter} efter status`}
            >
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
            
            <Select
              value={dateRange}
              onValueChange={setDateRange}
              aria-label={`${copy.actions.filter} efter datum`}
            >
              <option value="all">Alla datum</option>
              <option value="today">Idag</option>
              <option value="week">Denna vecka</option>
              <option value="month">Denna månad</option>
              <option value="quarter">Detta kvartal</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Results count */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Visar {filteredQuotes.length} av {quotesState.data?.length} offerter
        </p>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className="h-4 w-4" />}
          onClick={handleRetry}
          aria-label="Uppdatera offertlista"
          className="transition-all duration-150 ease-out"
        >
          Uppdatera
        </Button>
      </div>

      {/* Quotes Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" role="table" aria-label="Offertlista">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Offert #
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kund
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Projekt
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Summa
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Uppdaterad
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Åtgärder
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredQuotes.map((quote, index) => (
                <QuoteTableRow
                  key={quote.id}
                  quote={quote}
                  index={index}
                  onView={handleViewQuote}
                  onEdit={handleEditQuote}
                  onSend={handleSendQuote}
                  isSending={loadingStates.sendQuote[quote.id] || false}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
