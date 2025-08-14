import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { 
  Settings, 
  User, 
  Building2, 
  Bell, 
  Shield, 
  Database, 
  Palette,
  Save,
  Globe,
  Mail,
  CreditCard
} from 'lucide-react'

export default function SettingsPage() {
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
                <Input label="Förnamn" placeholder="Anna" />
                <Input label="Efternamn" placeholder="Andersson" />
                <Input label="E-post" type="email" placeholder="anna@example.com" />
                <Input label="Telefon" placeholder="08-123 45 67" />
              </div>
              <div className="flex justify-end">
                <Button leftIcon={<Save className="h-4 w-4" />}>
                  Spara ändringar
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
                <Input label="Företagsnamn" placeholder="AB Bygg & Co" />
                <Input label="Organisationsnummer" placeholder="556123-4567" />
                <Input label="Adress" placeholder="Storgatan 123" />
                <Input label="Postnummer" placeholder="123 45" />
                <Input label="Ort" placeholder="Stockholm" />
                <Input label="Land" placeholder="Sverige" />
              </div>
              <div className="flex justify-end">
                <Button leftIcon={<Save className="h-4 w-4" />}>
                  Uppdatera företag
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
                {[
                  { name: 'E-post notifikationer', description: 'Få notifikationer via e-post', enabled: true },
                  { name: 'Push notifikationer', description: 'Få notifikationer i webbläsaren', enabled: true },
                  { name: 'SMS notifikationer', description: 'Få notifikationer via SMS', enabled: false },
                  { name: 'Offert status', description: 'När offerter ändrar status', enabled: true },
                  { name: 'Nya kunder', description: 'När nya kunder läggs till', enabled: false },
                  { name: 'System uppdateringar', description: 'Viktiga systemuppdateringar', enabled: true },
                ].map((setting) => (
                  <div key={setting.name} className="flex items-center justify-between p-3 rounded-lg border">
                    <div>
                      <p className="font-medium text-foreground">{setting.name}</p>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                    </div>
                    <Button 
                      variant={setting.enabled ? 'default' : 'outline'} 
                      size="sm"
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
                  <Button variant="outline" size="sm">Ändra</Button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-foreground">Inloggningshistorik</p>
                    <p className="text-sm text-muted-foreground">Senaste inloggning: 2024-01-15 14:30</p>
                  </div>
                  <Button variant="outline" size="sm">Visa</Button>
                </div>
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
                  <Button variant="outline" size="sm">Visa faktura</Button>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border">
                  <div>
                    <p className="font-medium text-foreground">Betalningsmetod</p>
                    <p className="text-sm text-muted-foreground">Kreditkort •••• •••• •••• 1234</p>
                  </div>
                  <Button variant="outline" size="sm">Uppdatera</Button>
                </div>
              </div>
              <div className="flex justify-end">
                <Button variant="outline">Uppgradera plan</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
