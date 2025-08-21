'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { useErrorHandler, useSuccessHandler } from '@/components/system'
import { 
  User, 
  Building2, 
  Bell, 
  Shield, 
  Palette,
  Save,
  CreditCard,
  Check,
  X
} from 'lucide-react'

export default function SettingsPage() {
  const { handleApiError } = useErrorHandler()
  const { handleSuccess } = useSuccessHandler()
  
  // State för formulärdata
  const [profileData, setProfileData] = useState({
    firstName: 'Anna',
    lastName: 'Andersson',
    email: 'anna@example.com',
    phone: '08-123 45 67'
  })

  const [companyData, setCompanyData] = useState({
    name: 'AB Bygg & Co',
    orgNumber: '556123-4567',
    address: 'Storgatan 123',
    postalCode: '123 45',
    city: 'Stockholm',
    country: 'Sverige'
  })

  // State för notifikationer
  const [notifications, setNotifications] = useState([
    { name: 'E-post notifikationer', description: 'Få notifikationer via e-post', enabled: true },
    { name: 'Push notifikationer', description: 'Få notifikationer i webbläsaren', enabled: true },
    { name: 'SMS notifikationer', description: 'Få notifikationer via SMS', enabled: false },
    { name: 'Offert status', description: 'När offerter ändrar status', enabled: true },
    { name: 'Nya kunder', description: 'När nya kunder läggs till', enabled: false },
    { name: 'System uppdateringar', description: 'Viktiga systemuppdateringar', enabled: true },
  ])

  // Loading states
  const [loading, setLoading] = useState({
    profile: false,
    company: false,
    password: false,
    history: false,
    invoice: false,
    payment: false,
    upgrade: false
  })

  // Feedback states
  const [feedback, setFeedback] = useState<{
    profile: { type: 'success' | 'error'; message: string } | null
    company: { type: 'success' | 'error'; message: string } | null
    password: { type: 'success' | 'error'; message: string } | null
    history: { type: 'success' | 'error'; message: string } | null
    invoice: { type: 'success' | 'error'; message: string } | null
    payment: { type: 'success' | 'error'; message: string } | null
    upgrade: { type: 'success' | 'error'; message: string } | null
  }>({
    profile: null,
    company: null,
    password: null,
    history: null,
    invoice: null,
    payment: null,
    upgrade: null
  })

  // Handlers för profil
  const handleProfileChange = (field: string, value: string) => {
    setProfileData(prev => ({ ...prev, [field]: value }))
  }

  const handleSaveProfile = async () => {
    setLoading(prev => ({ ...prev, profile: true }))
    setFeedback(prev => ({ ...prev, profile: null }))
    
    try {
      // TODO: Implementera riktig API-anrop
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setFeedback(prev => ({ 
        ...prev, 
        profile: { type: 'success', message: 'Profil uppdaterad framgångsrikt!' }
      }))
      handleSuccess('Profil uppdaterad framgångsrikt!')
    } catch (error) {
      const errorDetails = handleApiError(error, 'Profiluppdatering', 'Kunde inte uppdatera profil')
      setFeedback(prev => ({ 
        ...prev, 
        profile: { type: 'error', message: errorDetails.message }
      }))
    } finally {
      setLoading(prev => ({ ...prev, profile: false }))
    }
  }

  // Handlers för företag
  const handleCompanyChange = (field: string, value: string) => {
    setCompanyData(prev => ({ ...prev, [field]: value }))
  }

  const handleUpdateCompany = async () => {
    setLoading(prev => ({ ...prev, company: true }))
    setFeedback(prev => ({ ...prev, company: null }))
    
    try {
      // TODO: Implementera riktig API-anrop
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setFeedback(prev => ({ 
        ...prev, 
        company: { type: 'success', message: 'Företagsinformation uppdaterad!' }
      }))
      handleSuccess('Företagsinformation uppdaterad!')
    } catch (error) {
      const errorDetails = handleApiError(error, 'Företagsuppdatering', 'Kunde inte uppdatera företag')
      setFeedback(prev => ({ 
        ...prev, 
        company: { type: 'error', message: errorDetails.message }
      }))
    } finally {
      setLoading(prev => ({ ...prev, company: false }))
    }
  }

  // Handlers för notifikationer
  const toggleNotification = (index: number) => {
    setNotifications(prev => prev.map((item, i) => 
      i === index ? { ...item, enabled: !item.enabled } : item
    ))
  }

  // Handlers för säkerhet
  const handleChangePassword = async () => {
    setLoading(prev => ({ ...prev, password: true }))
    setFeedback(prev => ({ ...prev, password: null }))
    
    try {
      // TODO: Implementera riktig API-anrop
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setFeedback(prev => ({ 
        ...prev, 
        password: { type: 'success', message: 'Lösenordsändring skickad via e-post!' }
      }))
      handleSuccess('Lösenordsändring skickad via e-post!')
    } catch (error) {
      const errorDetails = handleApiError(error, 'Lösenordsändring', 'Kunde inte skicka lösenordsändring')
      setFeedback(prev => ({ 
        ...prev, 
        password: { type: 'error', message: errorDetails.message }
      }))
    } finally {
      setLoading(prev => ({ ...prev, password: false }))
    }
  }

  const handleViewHistory = async () => {
    setLoading(prev => ({ ...prev, history: true }))
    setFeedback(prev => ({ ...prev, history: null }))
    
    try {
      // TODO: Implementera riktig API-anrop
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setFeedback(prev => ({ 
        ...prev, 
        history: { type: 'success', message: 'Inloggningshistorik laddas...' }
      }))
      handleSuccess('Inloggningshistorik laddas...', 'Inloggningshistorik')
    } catch (error) {
      const errorDetails = handleApiError(error, 'Inloggningshistorik', 'Kunde inte ladda historik')
      setFeedback(prev => ({ 
        ...prev, 
        history: { type: 'error', message: errorDetails.message }
      }))
    } finally {
      setLoading(prev => ({ ...prev, history: false }))
    }
  }

  // Handlers för fakturering
  const handleViewInvoice = async () => {
    setLoading(prev => ({ ...prev, invoice: true }))
    setFeedback(prev => ({ ...prev, invoice: null }))
    
    try {
      // TODO: Implementera riktig API-anrop
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setFeedback(prev => ({ 
        ...prev, 
        invoice: { type: 'success', message: 'Faktura öppnas i ny flik...' }
      }))
      handleSuccess('Faktura öppnas i ny flik...', 'Fakturavisning')
    } catch (error) {
      const errorDetails = handleApiError(error, 'Fakturavisning', 'Kunde inte öppna faktura')
      setFeedback(prev => ({ 
        ...prev, 
        invoice: { type: 'error', message: errorDetails.message }
      }))
    } finally {
      setLoading(prev => ({ ...prev, invoice: false }))
    }
  }

  const handleUpdatePayment = async () => {
    setLoading(prev => ({ ...prev, payment: true }))
    setFeedback(prev => ({ ...prev, payment: null }))
    
    try {
      // TODO: Implementera riktig API-anrop
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setFeedback(prev => ({ 
        ...prev, 
        payment: { type: 'success', message: 'Betalningsmetod uppdaterad!' }
      }))
      handleSuccess('Betalningsmetod uppdaterad!')
    } catch (error) {
      const errorDetails = handleApiError(error, 'Betalningsuppdatering', 'Kunde inte uppdatera betalningsmetod')
      setFeedback(prev => ({ 
        ...prev, 
        payment: { type: 'error', message: errorDetails.message }
      }))
    } finally {
      setLoading(prev => ({ ...prev, payment: false }))
    }
  }

  const handleUpgradePlan = async () => {
    setLoading(prev => ({ ...prev, upgrade: true }))
    setFeedback(prev => ({ ...prev, upgrade: null }))
    
    try {
      // TODO: Implementera riktig API-anrop
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setFeedback(prev => ({ 
        ...prev, 
        upgrade: { type: 'success', message: 'Omdirigerar till uppgradering...' }
      }))
      handleSuccess('Omdirigerar till uppgradering...', 'Planuppgradering')
    } catch (error) {
      const errorDetails = handleApiError(error, 'Planuppgradering', 'Kunde inte starta uppgradering')
      setFeedback(prev => ({ 
        ...prev, 
        upgrade: { type: 'error', message: errorDetails.message }
      }))
    } finally {
      setLoading(prev => ({ ...prev, upgrade: false }))
    }
  }

  // Helper för att visa feedback
  const showFeedback = (type: string, message: string) => (
    <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
      type === 'success' 
        ? 'bg-green-50 text-green-800 border border-green-200' 
        : 'bg-red-50 text-red-800 border border-red-200'
    }`}>
      {type === 'success' ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
      {message}
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-display-3 font-bold text-foreground">Inställningar</h1>
        <p className="text-body text-muted-foreground">
          Hantera applikationsinställningar och preferenser
        </p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="company">Företag</TabsTrigger>
          <TabsTrigger value="notifications">Notifikationer</TabsTrigger>
          <TabsTrigger value="security">Säkerhet</TabsTrigger>
          <TabsTrigger value="appearance">Utseende</TabsTrigger>
          <TabsTrigger value="billing">Fakturering</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Användarprofil
              </CardTitle>
              <CardDescription>Uppdatera din personliga information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Förnamn" 
                  placeholder="Anna" 
                  value={profileData.firstName}
                  onChange={(e) => handleProfileChange('firstName', e.target.value)}
                />
                <Input 
                  label="Efternamn" 
                  placeholder="Andersson" 
                  value={profileData.lastName}
                  onChange={(e) => handleProfileChange('lastName', e.target.value)}
                />
                <Input 
                  label="E-post" 
                  type="email" 
                  placeholder="anna@example.com" 
                  value={profileData.email}
                  onChange={(e) => handleProfileChange('email', e.target.value)}
                />
                <Input 
                  label="Telefon" 
                  placeholder="08-123 45 67" 
                  value={profileData.phone}
                  onChange={(e) => handleProfileChange('phone', e.target.value)}
                />
              </div>
              
              {feedback.profile && showFeedback(feedback.profile.type, feedback.profile.message)}
              
              <div className="flex justify-end">
                <Button 
                  leftIcon={<Save className="h-4 w-4" />}
                  onClick={handleSaveProfile}
                  disabled={loading.profile}
                  loading={loading.profile}
                >
                  {loading.profile ? 'Sparar...' : 'Spara ändringar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Företagsinformation
              </CardTitle>
              <CardDescription>Hantera företagsinställningar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="Företagsnamn" 
                  placeholder="AB Bygg & Co" 
                  value={companyData.name}
                  onChange={(e) => handleCompanyChange('name', e.target.value)}
                />
                <Input 
                  label="Organisationsnummer" 
                  placeholder="556123-4567" 
                  value={companyData.orgNumber}
                  onChange={(e) => handleCompanyChange('orgNumber', e.target.value)}
                />
                <Input 
                  label="Adress" 
                  placeholder="Storgatan 123" 
                  value={companyData.address}
                  onChange={(e) => handleCompanyChange('address', e.target.value)}
                />
                <Input 
                  label="Postnummer" 
                  placeholder="123 45" 
                  value={companyData.postalCode}
                  onChange={(e) => handleCompanyChange('postalCode', e.target.value)}
                />
                <Input 
                  label="Ort" 
                  placeholder="Stockholm" 
                  value={companyData.city}
                  onChange={(e) => handleCompanyChange('city', e.target.value)}
                />
                <Input 
                  label="Land" 
                  placeholder="Sverige" 
                  value={companyData.country}
                  onChange={(e) => handleCompanyChange('country', e.target.value)}
                />
              </div>
              
              {feedback.company && showFeedback(feedback.company.type, feedback.company.message)}
              
              <div className="flex justify-end">
                <Button 
                  leftIcon={<Save className="h-4 w-4" />}
                  onClick={handleUpdateCompany}
                  disabled={loading.company}
                  loading={loading.company}
                >
                  {loading.company ? 'Uppdaterar...' : 'Uppdatera företag'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notifikationsinställningar
              </CardTitle>
              <CardDescription>Konfigurera hur du vill få notifikationer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {notifications.map((setting, index) => (
                  <div key={setting.name} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-foreground">{setting.name}</p>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                    <Button 
                      variant={setting.enabled ? 'default' : 'outline'} 
                      size="sm"
                      onClick={() => toggleNotification(index)}
                    >
                      {setting.enabled ? 'Aktiverad' : 'Inaktiverad'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Säkerhetsinställningar
              </CardTitle>
              <CardDescription>Hantera säkerhet och åtkomst</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-foreground">Tvåfaktorsautentisering</p>
                    <p className="text-sm text-muted-foreground">Lägg till extra säkerhet</p>
                  </div>
                  <Badge variant="warn">Ej aktiverad</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-foreground">Lösenord</p>
                    <p className="text-sm text-muted-foreground">Senast ändrat: 2024-01-01</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleChangePassword}
                    disabled={loading.password}
                    loading={loading.password}
                  >
                    {loading.password ? 'Skickar...' : 'Ändra'}
                  </Button>
                </div>
                
                {feedback.password && showFeedback(feedback.password.type, feedback.password.message)}
                
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-foreground">Inloggningshistorik</p>
                    <p className="text-sm text-muted-foreground">Senaste inloggning: 2024-01-15 14:30</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleViewHistory}
                    disabled={loading.history}
                    loading={loading.history}
                  >
                    {loading.history ? 'Laddar...' : 'Visa'}
                  </Button>
                </div>
                
                {feedback.history && showFeedback(feedback.history.type, feedback.history.message)}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Utseende och tema
              </CardTitle>
              <CardDescription>Anpassa applikationens utseende</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-foreground">Tema</p>
                    <p className="text-sm text-muted-foreground">Välj mellan ljust, mörkt eller system</p>
                  </div>
                  <Badge variant="brand">System</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-foreground">Språk</p>
                    <p className="text-sm text-muted-foreground">Applikationens språk</p>
                  </div>
                  <Badge variant="outline">Svenska</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-foreground">Tidszon</p>
                    <p className="text-sm text-muted-foreground">Lokal tidszon för datum och tid</p>
                  </div>
                  <Badge variant="outline">Europe/Stockholm</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Fakturering och prenumeration
              </CardTitle>
              <CardDescription>Hantera din prenumeration och betalningar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-foreground">Nuvarande plan</p>
                    <p className="text-sm text-muted-foreground">Pro - kr 299/månad</p>
                  </div>
                  <Badge variant="success">Aktiv</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-foreground">Nästa faktura</p>
                    <p className="text-sm text-muted-foreground">2024-02-01 - kr 299</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleViewInvoice}
                    disabled={loading.invoice}
                    loading={loading.invoice}
                  >
                    {loading.invoice ? 'Öppnar...' : 'Visa faktura'}
                  </Button>
                </div>
                
                {feedback.invoice && showFeedback(feedback.invoice.type, feedback.invoice.message)}
                
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-foreground">Betalningsmetod</p>
                    <p className="text-sm text-muted-foreground">Kreditkort •••• •••• •••• 1234</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleUpdatePayment}
                    disabled={loading.payment}
                    loading={loading.payment}
                  >
                    {loading.payment ? 'Uppdaterar...' : 'Uppdatera'}
                  </Button>
                </div>
                
                {feedback.payment && showFeedback(feedback.payment.type, feedback.payment.message)}
              </div>
              
              {feedback.upgrade && showFeedback(feedback.upgrade.type, feedback.upgrade.message)}
              
              <div className="flex justify-end">
                <Button 
                  variant="outline"
                  onClick={handleUpgradePlan}
                  disabled={loading.upgrade}
                  loading={loading.upgrade}
                >
                  {loading.upgrade ? 'Omdirigerar...' : 'Uppgradera plan'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
