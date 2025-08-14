import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Plus, Search, Filter, Download } from 'lucide-react'

export default function QuotesPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display-3 font-bold text-foreground">Offert</h1>
          <p className="text-body text-muted-foreground">
            Hantera och skapa nya offerter
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />}>
          Ny offert
        </Button>
      </div>

      {/* Filters and search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="search"
                  placeholder="Sök offerter..."
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
              </div>
            </div>
            <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Quotes list */}
      <Card>
        <CardHeader>
          <CardTitle>Alla Offerter</CardTitle>
          <CardDescription>Lista över alla skapade offerter</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { 
                id: 'Q-001', 
                customer: 'AB Bygg & Co', 
                amount: 'kr 45,000', 
                status: 'accepted',
                date: '2024-01-15',
                description: 'Renovering av kontor'
              },
              { 
                id: 'Q-002', 
                customer: 'Stora Företaget AB', 
                amount: 'kr 123,500', 
                status: 'pending',
                date: '2024-01-14',
                description: 'Ny byggnad'
              },
              { 
                id: 'Q-003', 
                customer: 'Lilla Butiken', 
                amount: 'kr 12,800', 
                status: 'draft',
                date: '2024-01-13',
                description: 'Mindre renovering'
              },
              { 
                id: 'Q-004', 
                customer: 'Industri AB', 
                amount: 'kr 89,200', 
                status: 'sent',
                date: '2024-01-12',
                description: 'Industrilokal'
              },
              { 
                id: 'Q-005', 
                customer: 'Kontor AB', 
                amount: 'kr 67,400', 
                status: 'accepted',
                date: '2024-01-11',
                description: 'Kontorsrenovering'
              },
            ].map((quote) => (
              <div key={quote.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                    <span className="font-semibold text-sm">{quote.id}</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{quote.customer}</h3>
                    <p className="text-sm text-muted-foreground">{quote.description}</p>
                    <p className="text-xs text-muted-foreground">Skapad: {quote.date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{quote.amount}</p>
                    <Badge 
                      variant={
                        quote.status === 'accepted' ? 'success' :
                        quote.status === 'pending' ? 'warn' :
                        quote.status === 'draft' ? 'neutral' : 'brand'
                      }
                      size="sm"
                    >
                      {quote.status === 'accepted' ? 'Accepterad' :
                       quote.status === 'pending' ? 'Väntar' :
                       quote.status === 'draft' ? 'Utkast' : 'Skickad'}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon">
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
