import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  TrendingUp, 
  FileText, 
  Users, 
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-display-3 font-bold text-foreground">Dashboard</h1>
        <p className="text-body text-muted-foreground">
          Översikt över din offerthantering
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totala Offerter</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,234</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success-600">+12%</span> från förra månaden
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktiva Kunder</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success-600">+3</span> nya denna månad
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Intäkt</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">kr 2,456,789</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success-600">+8.2%</span> från förra månaden
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Konvertering</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">67%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-success-600">+2.1%</span> från förra månaden
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Senaste Offerter</CardTitle>
            <CardDescription>De senaste skapade offerterna</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { id: 'Q-001', customer: 'AB Bygg & Co', amount: 'kr 45,000', status: 'accepted' },
              { id: 'Q-002', customer: 'Stora Företaget AB', amount: 'kr 123,500', status: 'pending' },
              { id: 'Q-003', customer: 'Lilla Butiken', amount: 'kr 12,800', status: 'draft' },
              { id: 'Q-004', customer: 'Industri AB', amount: 'kr 89,200', status: 'sent' },
            ].map((quote) => (
              <div key={quote.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{quote.id}</p>
                    <p className="text-sm text-muted-foreground">{quote.customer}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-foreground">{quote.amount}</p>
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
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Applikationens status och prestanda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-success-50 dark:bg-success-900/20">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-success-600" />
                <span className="font-medium text-success-900 dark:text-success-100">System Online</span>
              </div>
              <Badge variant="success">Operativ</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-warn-50 dark:bg-warn-900/20">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-warn-600" />
                <span className="font-medium text-warn-900 dark:text-warn-100">Backup Status</span>
              </div>
              <Badge variant="warn">Väntar</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-error-50 dark:bg-error-900/20">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-error-600" />
                <span className="font-medium text-error-900 dark:text-error-100">SSL Certifikat</span>
              </div>
              <Badge variant="error">Expirerar snart</Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg border bg-brand-50 dark:bg-brand-900/20">
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5 text-brand-600" />
                <span className="font-medium text-brand-900 dark:text-brand-100">Prestanda</span>
              </div>
              <Badge variant="brand">Optimal</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
