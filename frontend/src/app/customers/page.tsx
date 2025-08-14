import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Plus, Search, Mail, Phone, MapPin, Building2, User, Calendar } from 'lucide-react'

export default function CustomersPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display-3 font-bold text-foreground">Kunder</h1>
          <p className="text-body text-muted-foreground">
            Hantera kundinformation och relationer
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />}>
          Ny kund
        </Button>
      </div>

      {/* Search and filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Sök kunder..."
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline">Filter</Button>
            <Button variant="outline">Exportera</Button>
          </div>
        </CardContent>
      </Card>

      {/* Customers grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            id: 'C-001',
            name: 'AB Bygg & Co',
            contact: 'Anna Andersson',
            email: 'anna@byggco.se',
            phone: '08-123 45 67',
            address: 'Storgatan 123, Stockholm',
            type: 'Byggföretag',
            status: 'active',
            projects: 12,
            lastContact: '2024-01-15'
          },
          {
            id: 'C-002',
            name: 'Stora Företaget AB',
            contact: 'Erik Eriksson',
            email: 'erik@storaföretaget.se',
            phone: '08-987 65 43',
            address: 'Industrivägen 456, Göteborg',
            type: 'Industri',
            status: 'active',
            projects: 8,
            lastContact: '2024-01-14'
          },
          {
            id: 'C-003',
            name: 'Lilla Butiken',
            contact: 'Maria Nilsson',
            email: 'maria@lillabutiken.se',
            phone: '08-555 12 34',
            address: 'Köpmangatan 78, Malmö',
            type: 'Handel',
            status: 'inactive',
            projects: 3,
            lastContact: '2024-01-10'
          },
          {
            id: 'C-004',
            name: 'Industri AB',
            contact: 'Johan Johansson',
            email: 'johan@industriab.se',
            phone: '08-777 88 99',
            address: 'Fabriksgatan 321, Uppsala',
            type: 'Industri',
            status: 'active',
            projects: 15,
            lastContact: '2024-01-12'
          },
          {
            id: 'C-005',
            name: 'Kontor AB',
            contact: 'Lisa Lindberg',
            email: 'lisa@kontorab.se',
            phone: '08-111 22 33',
            address: 'Kontorsvägen 654, Linköping',
            type: 'Kontor',
            status: 'active',
            projects: 6,
            lastContact: '2024-01-11'
          },
          {
            id: 'C-006',
            name: 'Villa Bygg',
            contact: 'Peter Pettersson',
            email: 'peter@villabygg.se',
            phone: '08-444 55 66',
            address: 'Villagatan 987, Västerås',
            type: 'Villa',
            status: 'prospect',
            projects: 0,
            lastContact: '2024-01-08'
          }
        ].map((customer) => (
          <Card key={customer.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                  <Building2 className="h-6 w-6" />
                </div>
                <Badge 
                  variant={
                    customer.status === 'active' ? 'success' :
                    customer.status === 'inactive' ? 'neutral' : 'warn'
                  }
                  size="sm"
                >
                  {customer.status === 'active' ? 'Aktiv' :
                   customer.status === 'inactive' ? 'Inaktiv' : 'Prospekt'}
                </Badge>
              </div>
              <CardTitle className="text-lg">{customer.name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <User className="h-4 w-4" />
                {customer.contact}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{customer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{customer.phone}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{customer.address}</span>
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Typ:</span>
                  <Badge variant="outline" size="sm">{customer.type}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Projekt:</span>
                  <span className="font-medium">{customer.projects}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-muted-foreground">Senast kontakt:</span>
                  <span className="text-muted-foreground">{customer.lastContact}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  <Mail className="h-4 w-4 mr-2" />
                  Kontakta
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  <Calendar className="h-4 w-4 mr-2" />
                  Möte
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
