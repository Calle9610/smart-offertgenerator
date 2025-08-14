'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  User, 
  Calendar,
  RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { 
  usePromiseState, 
  CardSkeleton, 
  CustomersEmptyState, 
  ServerErrorState 
} from '@/components/system'

// Mock data - ersätt med riktig API-anrop
const mockCustomers = [
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
]

const statusOptions = [
  { value: 'all', label: 'Alla statusar' },
  { value: 'active', label: 'Aktiva' },
  { value: 'inactive', label: 'Inaktiva' },
  { value: 'prospect', label: 'Prospekter' }
]

const typeOptions = [
  { value: 'all', label: 'Alla typer' },
  { value: 'Byggföretag', label: 'Byggföretag' },
  { value: 'Industri', label: 'Industri' },
  { value: 'Handel', label: 'Handel' },
  { value: 'Kontor', label: 'Kontor' },
  { value: 'Villa', label: 'Villa' }
]

const statusConfig: Record<string, { label: string; variant: 'success' | 'secondary' | 'warn' }> = {
  active: { label: 'Aktiv', variant: 'success' },
  inactive: { label: 'Inaktiv', variant: 'secondary' },
  prospect: { label: 'Prospekt', variant: 'warn' }
}

export default function CustomersPage() {
  const router = useRouter()
  
  // State management
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  
  // Use the new promise state hook
  const customersState = usePromiseState(mockCustomers)
  
  // Filtered customers
  const filteredCustomers = useMemo(() => {
    let filtered = customersState.data || []
    
    if (searchTerm) {
      filtered = filtered.filter(customer => 
        customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customer.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(customer => customer.status === statusFilter)
    }
    
    if (typeFilter !== 'all') {
      filtered = filtered.filter(customer => customer.type === typeFilter)
    }
    
    return filtered
  }, [customersState.data, searchTerm, statusFilter, typeFilter])

  const handleAddCustomer = () => {
    router.push('/customers/new')
  }

  const handleContactCustomer = (customer: any) => {
    // TODO: Implementera kontakt
    console.log('Contacting customer:', customer.name)
  }

  const handleScheduleMeeting = (customer: any) => {
    // TODO: Implementera mötesbokning
    console.log('Scheduling meeting with:', customer.name)
  }

  const handleRetry = () => {
    // Simulera en ny fetch
    customersState.execute(Promise.resolve(mockCustomers))
  }

  // Loading state
  if (customersState.isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Kunder</h1>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (customersState.isError) {
    return (
      <ServerErrorState
        error={customersState.error}
        onRetry={handleRetry}
        onContactSupport={() => console.log('Contact support')}
      />
    )
  }

  // Empty state
  if (!customersState.data || customersState.data.length === 0) {
    return (
      <CustomersEmptyState
        onAddCustomer={handleAddCustomer}
        onImportCustomers={() => console.log('Import customers')}
      />
    )
  }

  // Success state with filtered results
  if (filteredCustomers.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-16 w-16 text-gray-400 mb-4">
          <Search className="h-16 w-16" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Inga kunder hittades
        </h3>
        <p className="text-gray-600 mb-6">
          Dina sökfilter matchade inga kunder. Prova att justera dina sökvillkor.
        </p>
        <div className="flex justify-center space-x-3">
          <Button
            onClick={() => {
              setSearchTerm('')
              setStatusFilter('all')
              setTypeFilter('all')
            }}
            variant="outline"
          >
            Rensa filter
          </Button>
          <Button onClick={handleAddCustomer}>
            Lägg till kund
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
          <h1 className="text-2xl font-bold text-gray-900">Kunder</h1>
          <p className="text-gray-600 mt-1">
            Hantera kundinformation och relationer
          </p>
        </div>
        <Button
          onClick={handleAddCustomer}
          leftIcon={<Plus className="h-4 w-4" />}
          className="w-full sm:w-auto"
        >
          Ny kund
        </Button>
      </div>

      {/* Search and filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Sök efter kund, kontakt eller e-post..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  aria-label="Sök kunder"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
                aria-label="Filtrera efter status"
              >
                {statusOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
              
              <Select
                value={typeFilter}
                onValueChange={setTypeFilter}
                aria-label="Filtrera efter typ"
              >
                {typeOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Visar {filteredCustomers.length} av {customersState.data?.length} kunder
        </p>
        <Button
          variant="outline"
          size="sm"
          leftIcon={<RefreshCw className="h-4 w-4" />}
          onClick={handleRetry}
          aria-label="Uppdatera kundlista"
        >
          Uppdatera
        </Button>
      </div>

      {/* Customers grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCustomers.map((customer, index) => (
          <motion.div
            key={customer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
          >
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <Badge 
                    variant={statusConfig[customer.status].variant}
                    size="sm"
                  >
                    {statusConfig[customer.status].label}
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
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{customer.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{customer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{customer.address}</span>
                  </div>
                </div>
                
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Typ:</span>
                    <Badge variant="outline" size="sm">{customer.type}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-500">Projekt:</span>
                    <span className="font-medium">{customer.projects}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-500">Senast kontakt:</span>
                    <span className="text-gray-500">{customer.lastContact}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleContactCustomer(customer)}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Kontakta
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleScheduleMeeting(customer)}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Möte
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
