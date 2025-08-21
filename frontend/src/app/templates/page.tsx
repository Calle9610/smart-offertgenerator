'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { useErrorHandler } from '@/components/system'
import { Plus, FileText, BookOpen, Settings, Copy, Edit, Trash2, Check, X } from 'lucide-react'

export default function TemplatesPage() {
  const { handleApiError } = useErrorHandler()
  
  // State för mallar
  const [templates, setTemplates] = useState([
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
  ])

  // State för regler
  const [rules] = useState([
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
  ])

  // Loading states
  const [loading, setLoading] = useState<{
    newTemplate: boolean
    copyTemplate: Record<string, boolean>
    editTemplate: Record<string, boolean>
    deleteTemplate: Record<string, boolean>
    editRule: Record<string, boolean>
    settingsRule: Record<string, boolean>
  }>({
    newTemplate: false,
    copyTemplate: {},
    editTemplate: {},
    deleteTemplate: {},
    editRule: {},
    settingsRule: {}
  })

  // Feedback states
  const [feedback, setFeedback] = useState<{
    newTemplate: { type: 'success' | 'error'; message: string } | null
    copyTemplate: Record<string, { type: 'success' | 'error'; message: string } | null>
    editTemplate: Record<string, { type: 'success' | 'error'; message: string } | null>
    deleteTemplate: Record<string, { type: 'success' | 'error'; message: string } | null>
    editRule: Record<string, { type: 'success' | 'error'; message: string } | null>
    settingsRule: Record<string, { type: 'success' | 'error'; message: string } | null>
  }>({
    newTemplate: null,
    copyTemplate: {},
    editTemplate: {},
    deleteTemplate: {},
    editRule: {},
    settingsRule: {}
  })

  // Handlers för mallar
  const handleNewTemplate = async () => {
    setLoading(prev => ({ ...prev, newTemplate: true }))
    setFeedback(prev => ({ ...prev, newTemplate: null }))
    
    try {
      // TODO: Implementera riktig API-anrop
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setFeedback(prev => ({ 
        ...prev, 
        newTemplate: { type: 'success', message: 'Ny mall skapad! Omdirigerar till redigerare...' }
      }))
      
      // Simulera redirect
      setTimeout(() => {
        setFeedback(prev => ({ ...prev, newTemplate: null }))
      }, 2000)
    } catch (error) {
      const errorDetails = handleApiError(error, 'Mallskapande', 'Kunde inte skapa ny mall')
      setFeedback(prev => ({ 
        ...prev, 
        newTemplate: { type: 'error', message: errorDetails.message }
      }))
    } finally {
      setLoading(prev => ({ ...prev, newTemplate: false }))
    }
  }

  const handleCopyTemplate = async (templateId: string) => {
    setLoading(prev => ({ ...prev, copyTemplate: { ...prev.copyTemplate, [templateId]: true } }))
    setFeedback(prev => ({ ...prev, copyTemplate: { ...prev.copyTemplate, [templateId]: null } }))
    
    try {
      // TODO: Implementera riktig API-anrop
      await new Promise(resolve => setTimeout(resolve, 800))
      
      setFeedback(prev => ({ 
        ...prev, 
        copyTemplate: { 
          ...prev.copyTemplate, 
          [templateId]: { type: 'success', message: 'Mall kopierad framgångsrikt!' }
        }
      }))
      
      // Rensa feedback efter 3 sekunder
      setTimeout(() => {
        setFeedback(prev => ({ 
          ...prev, 
          copyTemplate: { ...prev.copyTemplate, [templateId]: null }
        }))
      }, 3000)
    } catch (error) {
      const errorDetails = handleApiError(error, 'Mallkopiering', 'Kunde inte kopiera mall')
      setFeedback(prev => ({ 
        ...prev, 
        copyTemplate: { 
          ...prev.copyTemplate, 
          [templateId]: { type: 'error', message: errorDetails.message }
        }
      }))
    } finally {
      setLoading(prev => ({ 
        ...prev, 
        copyTemplate: { ...prev.copyTemplate, [templateId]: false }
      }))
    }
  }

  const handleEditTemplate = async (templateId: string) => {
    setLoading(prev => ({ ...prev, editTemplate: { ...prev.editTemplate, [templateId]: true } }))
    setFeedback(prev => ({ ...prev, editTemplate: { ...prev.editTemplate, [templateId]: null } }))
    
    try {
      // TODO: Implementera riktig API-anrop
      await new Promise(resolve => setTimeout(resolve, 600))
      
      setFeedback(prev => ({ 
        ...prev, 
        editTemplate: { 
          ...prev.editTemplate, 
          [templateId]: { type: 'success', message: 'Omdirigerar till redigerare...' }
        }
      }))
      
      // Simulera redirect
      setTimeout(() => {
        setFeedback(prev => ({ 
          ...prev, 
          editTemplate: { ...prev.editTemplate, [templateId]: null }
        }))
      }, 2000)
    } catch (error) {
      const errorDetails = handleApiError(error, 'Mallredigering', 'Kunde inte öppna redigerare')
      setFeedback(prev => ({ 
        ...prev, 
        editTemplate: { 
          ...prev.editTemplate, 
          [templateId]: { type: 'error', message: errorDetails.message }
        }
      }))
    } finally {
      setLoading(prev => ({ 
        ...prev, 
        editTemplate: { ...prev.editTemplate, [templateId]: false }
      }))
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm('Är du säker på att du vill ta bort denna mall?')) return
    
    setLoading(prev => ({ ...prev, deleteTemplate: { ...prev.deleteTemplate, [templateId]: true } }))
    setFeedback(prev => ({ ...prev, deleteTemplate: { ...prev.deleteTemplate, [templateId]: null } }))
    
    try {
      // TODO: Implementera riktig API-anrop
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Ta bort mallen från state
      setTemplates(prev => prev.filter(t => t.id !== templateId))
      
      setFeedback(prev => ({ 
        ...prev, 
        deleteTemplate: { 
          ...prev.deleteTemplate, 
          [templateId]: { type: 'success', message: 'Mall borttagen!' }
        }
      }))
      
      // Rensa feedback efter 3 sekunder
      setTimeout(() => {
        setFeedback(prev => ({ 
          ...prev, 
          deleteTemplate: { ...prev.deleteTemplate, [templateId]: null }
        }))
      }, 3000)
    } catch (error) {
      const errorDetails = handleApiError(error, 'Mallborttagning', 'Kunde inte ta bort mall')
      setFeedback(prev => ({ 
        ...prev, 
        deleteTemplate: { 
          ...prev.deleteTemplate, 
          [templateId]: { type: 'error', message: errorDetails.message }
        }
      }))
    } finally {
      setLoading(prev => ({ 
        ...prev, 
        deleteTemplate: { ...prev.deleteTemplate, [templateId]: false }
      }))
    }
  }

  // Handlers för regler
  const handleEditRule = async (ruleId: string) => {
    setLoading(prev => ({ ...prev, editRule: { ...prev.editRule, [ruleId]: true } }))
    setFeedback(prev => ({ ...prev, editRule: { ...prev.editRule, [ruleId]: null } }))
    
    try {
      // TODO: Implementera riktig API-anrop
      await new Promise(resolve => setTimeout(resolve, 600))
      
      setFeedback(prev => ({ 
        ...prev, 
        editRule: { 
          ...prev.editRule, 
          [ruleId]: { type: 'success', message: 'Omdirigerar till regelredigerare...' }
        }
      }))
      
      // Simulera redirect
      setTimeout(() => {
        setFeedback(prev => ({ 
          ...prev, 
          editRule: { ...prev.editRule, [ruleId]: null }
        }))
      }, 2000)
    } catch (error) {
      const errorDetails = handleApiError(error, 'Regelredigering', 'Kunde inte öppna regelredigerare')
      setFeedback(prev => ({ 
        ...prev, 
        editRule: { 
          ...prev.editRule, 
          [ruleId]: { type: 'error', message: errorDetails.message }
        }
      }))
    } finally {
      setLoading(prev => ({ 
        ...prev, 
        editRule: { ...prev.editRule, [ruleId]: false }
      }))
    }
  }

  const handleSettingsRule = async (ruleId: string) => {
    setLoading(prev => ({ ...prev, settingsRule: { ...prev.settingsRule, [ruleId]: true } }))
    setFeedback(prev => ({ ...prev, settingsRule: { ...prev.settingsRule, [ruleId]: null } }))
    
    try {
      // TODO: Implementera riktig API-anrop
      await new Promise(resolve => setTimeout(resolve, 800))
      
      setFeedback(prev => ({ 
        ...prev, 
        settingsRule: { 
          ...prev.settingsRule, 
          [ruleId]: { type: 'success', message: 'Regelinställningar öppnas...' }
        }
      }))
      
      // Rensa feedback efter 3 sekunder
      setTimeout(() => {
        setFeedback(prev => ({ 
          ...prev, 
          settingsRule: { ...prev.settingsRule, [ruleId]: null }
        }))
      }, 3000)
    } catch (error) {
      const errorDetails = handleApiError(error, 'Regelinställningar', 'Kunde inte öppna regelinställningar')
      setFeedback(prev => ({ 
        ...prev, 
        settingsRule: { 
          ...prev.settingsRule, 
          [ruleId]: { type: 'error', message: errorDetails.message }
        }
      }))
    } finally {
      setLoading(prev => ({ 
        ...prev, 
        settingsRule: { ...prev.settingsRule, [ruleId]: false }
      }))
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-display-3 font-bold text-foreground">Mallar & Regler</h1>
          <p className="text-body text-muted-foreground">
            Hantera offertmallar och automatiseringsregler
          </p>
        </div>
        <Button 
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={handleNewTemplate}
          disabled={loading.newTemplate}
          loading={loading.newTemplate}
        >
          {loading.newTemplate ? 'Skapar...' : 'Ny mall'}
        </Button>
      </div>

      {feedback.newTemplate && showFeedback(feedback.newTemplate.type, feedback.newTemplate.message)}

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="templates">Offertmallar</TabsTrigger>
          <TabsTrigger value="rules">Automatiseringsregler</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          {/* Templates grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-900/20 dark:text-brand-400">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleCopyTemplate(template.id)}
                        disabled={loading.copyTemplate[template.id] ?? false}
                        loading={loading.copyTemplate[template.id] ?? false}
                        aria-label={`Kopiera mall ${template.name}`}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleEditTemplate(template.id)}
                        disabled={loading.editTemplate[template.id] ?? false}
                        loading={loading.editTemplate[template.id] ?? false}
                        aria-label={`Redigera mall ${template.name}`}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => handleDeleteTemplate(template.id)}
                        disabled={loading.deleteTemplate[template.id] ?? false}
                        loading={loading.deleteTemplate[template.id] ?? false}
                        aria-label={`Ta bort mall ${template.name}`}
                      >
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
                  
                  {/* Feedback för denna mall */}
                  {feedback.copyTemplate[template.id] && showFeedback(
                    feedback.copyTemplate[template.id]?.type || 'error', 
                    feedback.copyTemplate[template.id]?.message || 'Okänt fel'
                  )}
                  {feedback.editTemplate[template.id] && showFeedback(
                    feedback.editTemplate[template.id]?.type || 'error', 
                    feedback.editTemplate[template.id]?.message || 'Okänt fel'
                  )}
                  {feedback.deleteTemplate[template.id] && showFeedback(
                    feedback.deleteTemplate[template.id]?.type || 'error', 
                    feedback.deleteTemplate[template.id]?.message || 'Okänt fel'
                  )}
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
                {rules.map((rule) => (
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
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditRule(rule.id)}
                          disabled={loading.editRule[rule.id] ?? false}
                          loading={loading.editRule[rule.id] ?? false}
                          aria-label={`Redigera regel ${rule.name}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleSettingsRule(rule.id)}
                          disabled={loading.settingsRule[rule.id] ?? false}
                          loading={loading.settingsRule[rule.id] ?? false}
                          aria-label={`Inställningar för regel ${rule.name}`}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* Feedback för denna regel */}
                    {feedback.editRule[rule.id] && (
                      <div className="absolute -bottom-2 left-0 right-0">
                        {showFeedback(
                          feedback.editRule[rule.id]?.type || 'error', 
                          feedback.editRule[rule.id]?.message || 'Okänt fel'
                        )}
                      </div>
                    )}
                    {feedback.settingsRule[rule.id] && (
                      <div className="absolute -bottom-2 left-0 right-0">
                        {showFeedback(
                          feedback.settingsRule[rule.id]?.type || 'error', 
                          feedback.settingsRule[rule.id]?.message || 'Okänt fel'
                        )}
                      </div>
                    )}
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
