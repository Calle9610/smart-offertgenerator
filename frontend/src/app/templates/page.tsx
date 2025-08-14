import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { Plus, FileText, BookOpen, Settings, Copy, Edit, Trash2 } from 'lucide-react'

export default function TemplatesPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display-3 font-bold text-foreground">Mallar & Regler</h1>
          <p className="text-body text-muted-foreground">
            Hantera offertmallar och automatiseringsregler
          </p>
        </div>
        <Button leftIcon={<Plus className="h-4 w-4" />}>
          Ny mall
        </Button>
      </div>

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates">Offertmallar</TabsTrigger>
          <TabsTrigger value="rules">Automatiseringsregler</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          {/* Templates grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                id: 'T-001',
                name: 'Standard Bygg',
                description: 'Grundmall för byggprojekt',
                category: 'Bygg',
                usage: 45,
                lastUsed: '2024-01-15'
              },
              {
                id: 'T-002',
                name: 'Renovering',
                description: 'Mall för renoveringsprojekt',
                category: 'Renovering',
                usage: 23,
                lastUsed: '2024-01-14'
              },
              {
                id: 'T-003',
                name: 'Industri',
                description: 'Specialmall för industrilokaler',
                category: 'Industri',
                usage: 12,
                lastUsed: '2024-01-10'
              },
              {
                id: 'T-004',
                name: 'Kontor',
                description: 'Mall för kontorsrenovering',
                category: 'Kontor',
                usage: 34,
                lastUsed: '2024-01-12'
              },
              {
                id: 'T-005',
                name: 'Villa',
                description: 'Mall för villaprojekt',
                category: 'Villa',
                usage: 18,
                lastUsed: '2024-01-08'
              },
              {
                id: 'T-006',
                name: 'Fasadsystem',
                description: 'Specialmall för fasadarbeten',
                category: 'Fasad',
                usage: 7,
                lastUsed: '2024-01-05'
              }
            ].map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon">
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Kategori:</span>
                      <Badge variant="outline" size="sm">{template.category}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Använd:</span>
                      <span className="text-sm font-medium">{template.usage} gånger</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Senast:</span>
                      <span className="text-sm text-muted-foreground">{template.lastUsed}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-6">
          {/* Rules list */}
          <Card>
            <CardHeader>
              <CardTitle>Automatiseringsregler</CardTitle>
              <CardDescription>Regler för automatisk offertgenerering</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    id: 'R-001',
                    name: 'Byggprojekt > 100k',
                    description: 'Automatiskt lägg till säkerhetsmarginal för stora byggprojekt',
                    status: 'active',
                    priority: 'high',
                    lastTriggered: '2024-01-15'
                  },
                  {
                    id: 'R-002',
                    name: 'Renovering +20%',
                    description: 'Lägg till 20% overhead för renoveringsprojekt',
                    status: 'active',
                    priority: 'medium',
                    lastTriggered: '2024-01-14'
                  },
                  {
                    id: 'R-003',
                    name: 'Industri +15%',
                    description: 'Lägg till 15% för industrispecifika krav',
                    status: 'inactive',
                    priority: 'low',
                    lastTriggered: '2024-01-10'
                  },
                  {
                    id: 'R-004',
                    name: 'Villa standard',
                    description: 'Standardpriser för villaprojekt',
                    status: 'active',
                    priority: 'medium',
                    lastTriggered: '2024-01-12'
                  }
                ].map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warn-100 text-warn-600 dark:bg-warn-900/20 dark:text-warn-400">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground">{rule.name}</h3>
                        <p className="text-sm text-muted-foreground">{rule.description}</p>
                        <p className="text-xs text-muted-foreground">Senast triggad: {rule.lastTriggered}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge 
                        variant={rule.status === 'active' ? 'success' : 'neutral'}
                        size="sm"
                      >
                        {rule.status === 'active' ? 'Aktiv' : 'Inaktiv'}
                      </Badge>
                      <Badge 
                        variant={
                          rule.priority === 'high' ? 'error' :
                          rule.priority === 'medium' ? 'warn' : 'neutral'
                        }
                        size="sm"
                      >
                        {rule.priority === 'high' ? 'Hög' :
                         rule.priority === 'medium' ? 'Medium' : 'Låg'}
                      </Badge>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
