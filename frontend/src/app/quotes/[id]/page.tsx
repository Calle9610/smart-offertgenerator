// How to run: This page displays individual quote details
// Navigate to /quotes/[id] to view a specific quote
// Requires valid quote ID in the URL

import { notFound } from 'next/navigation'
import { QuoteDto } from '@/types/quote'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { ErrorState } from '@/components/system'
import { 
  Edit, 
  FileText, 
  User, 
  Building, 
  Calendar,
  FileDown
} from 'lucide-react'

// Server-side data fetching
async function getQuoteData(id: string): Promise<QuoteDto> {
  try {
    // Server-side fetch to our API route
    const baseUrl = process.env['NEXT_PUBLIC_BASE_URL'] || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/quotes/${id}`, {
      cache: 'no-store' // Disable caching for real-time data
    })

    if (!res.ok) {
      if (res.status === 404) {
        notFound()
      }
      throw new Error(`Failed to fetch quote: ${res.statusText}`)
    }

    return res.json()
  } catch (error) {
    console.error('Error fetching quote:', error)
    throw new Error('Failed to load quote data')
  }
}

// Format currency
function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: currency || 'SEK'
  }).format(amount)
}

// Format date
function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString))
}

// Status configuration
const statusConfig = {
  draft: { label: 'Utkast', variant: 'secondary' as const, color: 'bg-gray-100 text-gray-800' },
  sent: { label: 'Skickad', variant: 'warn' as const, color: 'bg-blue-100 text-blue-800' },
  accepted: { label: 'Accepterad', variant: 'success' as const, color: 'bg-green-100 text-green-800' },
  declined: { label: 'Avböjt', variant: 'error' as const, color: 'bg-red-100 text-red-800' }
}

export default async function QuoteDetailPage({ 
  params 
}: { 
  params: { id: string } 
}) {
  try {
    const quote = await getQuoteData(params.id)
    
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <div className="mx-auto max-w-6xl p-6">
          {/* Header */}
          <header className="mb-8">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  Offert #{quote.id.slice(0, 8)}
                </h1>
                <div className="flex items-center gap-4 text-gray-600">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span>{quote.customer}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4" />
                    <span>{quote.project}</span>
                  </div>
                </div>
              </div>
              
              {/* Status and Actions */}
              <div className="flex flex-col items-end gap-4">
                <Badge 
                  className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig[quote.status]?.color || 'bg-gray-100 text-gray-800'}`}
                >
                  {statusConfig[quote.status]?.label || quote.status}
                </Badge>
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `/quotes/${quote.id}/edit`}
                    className="flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Redigera
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => window.location.href = `/api/quotes/${quote.id}/pdf`}
                    className="flex items-center gap-2"
                  >
                    <FileDown className="h-4 w-4" />
                    PDF
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Timestamps */}
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Skapad: {formatDate(quote.createdAt)}</span>
              </div>
              {quote.updatedAt !== quote.createdAt && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Uppdaterad: {formatDate(quote.updatedAt)}</span>
                </div>
              )}
            </div>
          </header>

          {/* Quote Items Table */}
          <Card className="mb-8">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Offertrader</h2>
              
              {quote.items.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  <p>Inga offertrader tillagda än</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Typ</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Beskrivning</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Enhet</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Antal</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Á-pris</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-700">Summa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quote.items.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <Badge 
                              className={`px-2 py-1 text-xs ${
                                item.kind === 'labor' ? 'bg-blue-100 text-blue-800' :
                                item.kind === 'material' ? 'bg-green-100 text-green-800' :
                                'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {item.kind === 'labor' ? 'Arbete' :
                               item.kind === 'material' ? 'Material' : 'Övrigt'}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <div className="font-medium">{item.description}</div>
                              {item.ref && (
                                <div className="text-sm text-gray-500">Ref: {item.ref}</div>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-gray-600">{item.unit}</td>
                          <td className="py-3 px-4 text-right">{item.qty}</td>
                          <td className="py-3 px-4 text-right">
                            {formatCurrency(item.unit_price, quote.totals.currency)}
                          </td>
                          <td className="py-3 px-4 text-right font-medium">
                            {formatCurrency(item.qty * item.unit_price, quote.totals.currency)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </Card>

          {/* Totals Summary */}
          <Card className="mb-8">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Sammanfattning</h2>
              <div className="max-w-md ml-auto">
                <div className="space-y-3">
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Delsumma:</span>
                    <span className="font-medium">
                      {formatCurrency(quote.totals.subtotal, quote.totals.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Moms:</span>
                    <span className="font-medium">
                      {formatCurrency(quote.totals.vat, quote.totals.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 text-lg font-bold">
                    <span>Totalt:</span>
                    <span className="text-blue-600">
                      {formatCurrency(quote.totals.total, quote.totals.currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
            >
              Gå tillbaka
            </Button>
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => window.location.href = `/quotes/${quote.id}/edit`}
                className="flex items-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Redigera offert
              </Button>
              <Button
                onClick={() => window.location.href = `/api/quotes/${quote.id}/pdf`}
                className="flex items-center gap-2"
              >
                <FileDown className="h-4 w-4" />
                Ladda ner PDF
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  } catch (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <ErrorState
          variant="server"
          error={error instanceof Error ? error.message : String(error)}
          title="Kunde inte ladda offert"
          description="Ett fel uppstod när offerten skulle hämtas. Kontrollera att länken är korrekt och försök igen."
          retry={{
            onClick: () => window.location.reload(),
            label: 'Försök igen'
          }}
          actions={[{
            label: 'Gå tillbaka',
            onClick: () => window.history.back(),
            variant: 'outline'
          }, {
            label: 'Till offertlistan',
            onClick: () => window.location.href = '/quotes',
            variant: 'default'
          }]}
          showErrorDetails={process.env.NODE_ENV === 'development'}
        />
      </div>
    )
  }
}
