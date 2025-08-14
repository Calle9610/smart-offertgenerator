'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { z } from 'zod'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Minus, 
  Eye, 
  Edit, 
  Send, 
  Download,
  Undo2,
  Redo2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Info
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { SimpleSelect } from '@/components/ui/SimpleSelect'
import { Textarea } from '@/components/ui/Textarea'
import SendQuoteModal from './SendQuoteModal'
import Toast from './Toast'
import StatusChip from './StatusChip'
import { useCopy } from '@/copy/useCopy'

// Zod schemas för validering
const QuoteItemSchema = z.object({
  kind: z.enum(['labor', 'material', 'custom']),
  ref: z.string().optional(),
  description: z.string().min(1, 'Beskrivning krävs'),
  qty: z.number().min(0.01, 'Antal måste vara större än 0'),
  unit: z.string().min(1, 'Enhet krävs'),
  unit_price: z.number().min(0, 'Pris måste vara 0 eller större'),
  line_total: z.number().min(0, 'Radsumma måste vara 0 eller större'),
  confidence_per_item: z.enum(['low', 'med', 'high']).optional(),
  is_optional: z.boolean().default(false),
  option_group: z.string().optional()
})

const QuoteFormSchema = z.object({
  customer: z.string().min(1, 'Kundnamn krävs'),
  project: z.string().min(1, 'Projektnamn krävs'),
  vat_rate: z.number().min(0).max(100, 'Moms måste vara mellan 0-100%'),
  room_type: z.string().optional(),
  finish_level: z.string().optional(),
  assumptions: z.string().optional(),
  exclusions: z.string().optional(),
  timeline: z.string().optional()
})

type QuoteItem = z.infer<typeof QuoteItemSchema>
type QuoteFormData = z.infer<typeof QuoteFormSchema>

interface QuotePackage {
  id: string
  name: string
  items: QuoteItem[]
  subtotal: string
  vat: string
  total: string
  is_default: boolean
  created_at: string
}

interface CreatedQuote {
  id: string
  status: string
  public_token?: string
}

interface HistoryState {
  items: QuoteItem[]
  timestamp: number
}

export default function QuoteForm() {
  const params = useParams()
  const urlQuoteId = params.id as string
  const copy = useCopy()
  
  // Form state
  const [formData, setFormData] = useState<QuoteFormData>({
    customer: 'Testkund AB',
    project: 'Badrum 6 m²',
    vat_rate: 25,
    room_type: '',
    finish_level: '',
    assumptions: '',
    exclusions: '',
    timeline: ''
  })
  
  // Items state
  const [items, setItems] = useState<QuoteItem[]>([
    { 
      kind: 'labor', 
      description: 'Snickeri', 
      unit: 'hour', 
      qty: 8, 
      unit_price: 650, 
      line_total: 5200,
      confidence_per_item: 'high',
      is_optional: false
    },
    { 
      kind: 'material', 
      description: 'Kakel 20x20', 
      unit: 'm2', 
      qty: 20, 
      unit_price: 216, 
      line_total: 4320,
      confidence_per_item: 'high',
      is_optional: false
    }
  ])
  
  // History state för undo/redo
  const [history, setHistory] = useState<HistoryState[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isUndoRedo, setIsUndoRedo] = useState(false)
  
  // UI state
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['customer', 'items']))
  const [editingItem, setEditingItem] = useState<number | null>(null)
  const [showSendModal, setShowSendModal] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [toastMessage, setToastMessage] = useState('')
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('success')
  
  // API state
  const [createdQuote, setCreatedQuote] = useState<CreatedQuote | null>(null)
  const [packages, setPackages] = useState<QuotePackage[]>([])
  const [loading, setLoading] = useState(false)
  const [downloadingPDF, setDownloadingPDF] = useState(false)
  const [profileId, setProfileId] = useState<string | null>(null)
  
  // Auto-generation state
  const [sourceItems, setSourceItems] = useState<QuoteItem[]>([])
  const [generatingItems, setGeneratingItems] = useState(false)
  const [autoTuningInsights, setAutoTuningInsights] = useState<{
    total_patterns?: number;
    average_confidence?: number;
    most_adjusted_item?: string;
    improvement_suggestions?: string[];
  } | null>(null)
  
  const quoteId = urlQuoteId !== 'new' ? urlQuoteId : createdQuote?.id
  const stickySummaryRef = useRef<HTMLDivElement>(null)

  // Initialize history
  useEffect(() => {
    if (items.length > 0) {
      addToHistory(items)
    }
  }, [])

  // Fetch profile ID on mount
  useEffect(() => {
    const fetchProfileId = async () => {
      try {
        const response = await fetch('/api/price-profiles', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        })
        
        if (response.ok) {
          const profiles = await response.json()
          if (profiles.length > 0) {
            setProfileId(profiles[0].id)
          }
        }
      } catch (error) {
        console.error('Error fetching profile ID:', error)
      }
    }

    fetchProfileId()
  }, [])

  // History management
  const addToHistory = (newItems: QuoteItem[]) => {
    if (isUndoRedo) return
    
    const newHistoryState: HistoryState = {
      items: JSON.parse(JSON.stringify(newItems)),
      timestamp: Date.now()
    }
    
    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newHistoryState)
    
    // Keep only last 20 states
    if (newHistory.length > 20) {
      newHistory.shift()
    }
    
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }

  const undo = () => {
    if (historyIndex > 0) {
      setIsUndoRedo(true)
      const newIndex = historyIndex - 1
      setHistoryIndex(newIndex)
      setItems(JSON.parse(JSON.stringify(history[newIndex].items)))
      setIsUndoRedo(false)
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setIsUndoRedo(true)
      const newIndex = historyIndex + 1
      setHistoryIndex(newIndex)
      setItems(JSON.parse(JSON.stringify(history[newIndex].items)))
      setIsUndoRedo(false)
    }
  }

  const resetItem = (index: number) => {
    if (sourceItems[index]) {
      const newItems = [...items]
      newItems[index] = { ...sourceItems[index] }
      setItems(newItems)
      addToHistory(newItems)
    }
  }

  // Item management
  const updateItem = (index: number, field: keyof QuoteItem, value: string | number) => {
    const newItems = [...items]
    const oldItem = { ...newItems[index] }
    
    newItems[index] = { ...oldItem, [field]: value }
    
    // Recalculate line total if qty or unit_price changed
    if (field === 'qty' || field === 'unit_price') {
      newItems[index].line_total = newItems[index].qty * newItems[index].unit_price
    }
    
    setItems(newItems)
    addToHistory(newItems)
  }

  const addItem = () => {
    const newItem: QuoteItem = {
      kind: 'labor',
      description: '',
      qty: 1,
      unit: 'hour',
      unit_price: 0,
      line_total: 0,
      confidence_per_item: 'low',
      is_optional: false
    }
    
    const newItems = [...items, newItem]
    setItems(newItems)
    addToHistory(newItems)
  }

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index)
    setItems(newItems)
    addToHistory(newItems)
  }

  const quickAdjustQuantity = (index: number, adjustment: number) => {
    const newQty = Math.max(0.01, items[index].qty * (1 + adjustment))
    updateItem(index, 'qty', newQty)
  }

  // Section management
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + item.line_total, 0)
  const vat = subtotal * (formData.vat_rate / 100)
  const total = subtotal + vat

  // Validation
  const validateForm = (): { isValid: boolean; errors: Record<string, string> } => {
    const errors: Record<string, string> = {}
    
    // Validate form data
    const formResult = QuoteFormSchema.safeParse(formData)
    if (!formResult.success) {
      formResult.error.issues.forEach((error) => {
        if (error.path) {
          errors[error.path.join('.')] = error.message
        }
      })
    }
    
    // Validate items
    items.forEach((item, index) => {
      const itemResult = QuoteItemSchema.safeParse(item)
      if (!itemResult.success) {
        itemResult.error.issues.forEach((error) => {
          if (error.path) {
            errors[`items.${index}.${error.path.join('.')}`] = error.message
          }
        })
      }
    })
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    }
  }

  const getFieldError = (field: string): string => {
    const { errors } = validateForm()
    return errors[field] || ''
  }

  const getItemFieldError = (itemIndex: number, field: string): string => {
    const { errors } = validateForm()
    return errors[`items.${itemIndex}.${field}`] || ''
  }

  // Confidence badge component
  const ConfidenceBadge = ({ confidence }: { confidence?: string }) => {
    if (!confidence) return null
    
    const config: Record<string, { label: string; variant: string; icon: any }> = {
      low: { label: 'Låg', variant: 'error', icon: XCircle },
      med: { label: 'Medel', variant: 'warn', icon: AlertCircle },
      high: { label: 'Hög', variant: 'success', icon: CheckCircle }
    }
    
    const { label, variant, icon: Icon } = config[confidence]
    
    return (
      <Badge variant={variant as any} size="sm" leftIcon={<Icon className="h-3 w-3" />}>
        {label}
      </Badge>
    )
  }

  // Row component
  const QuoteItemRow = ({ item, index }: { item: QuoteItem; index: number }) => {
    const isEditing = editingItem === index
    
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.2 }}
        className="grid grid-cols-12 gap-3 items-center p-3 border rounded-lg hover:bg-muted/30 transition-colors"
      >
        {/* Typ */}
        <div className="col-span-1">
          <SimpleSelect
            value={item.kind}
            onValueChange={(value) => updateItem(index, 'kind', value)}
            aria-label={`Välj typ för rad ${index + 1}`}
          >
            <option value="labor">Arbete</option>
            <option value="material">Material</option>
            <option value="custom">Övrigt</option>
          </SimpleSelect>
        </div>
        
        {/* Beskrivning */}
        <div className="col-span-3">
          <Input
            value={item.description}
            onChange={(e) => updateItem(index, 'description', e.target.value)}
            placeholder="Beskrivning"
            className={getItemFieldError(index, 'description') ? 'border-error focus:ring-error' : ''}
            aria-label={`Beskrivning för rad ${index + 1}`}
          />
          {getItemFieldError(index, 'description') && (
            <p className="text-xs text-error mt-1">{getItemFieldError(index, 'description')}</p>
          )}
        </div>
        
        {/* Enhet */}
        <div className="col-span-1">
          <Input
            value={item.unit}
            onChange={(e) => updateItem(index, 'unit', e.target.value)}
            placeholder="Enhet"
            className={getItemFieldError(index, 'unit') ? 'border-error focus:ring-error' : ''}
            aria-label={`Enhet för rad ${index + 1}`}
          />
        </div>
        
        {/* Antal */}
        <div className="col-span-1">
          <div className="flex items-center gap-1">
            <Input
              type="number"
              value={item.qty}
              onChange={(e) => updateItem(index, 'qty', parseFloat(e.target.value) || 0)}
              placeholder="0"
              className={getItemFieldError(index, 'qty') ? 'border-error focus:ring-error' : ''}
              aria-label={`Antal för rad ${index + 1}`}
            />
            <div className="flex flex-col">
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0"
                onClick={() => quickAdjustQuantity(index, 0.1)}
                aria-label={`Öka antal med 10% för rad ${index + 1}`}
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0"
                onClick={() => quickAdjustQuantity(index, -0.1)}
                aria-label={`Minska antal med 10% för rad ${index + 1}`}
              >
                <Minus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Á-pris */}
        <div className="col-span-2">
          <Input
            type="number"
            value={item.unit_price}
            onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
            placeholder="0"
            className={getItemFieldError(index, 'unit_price') ? 'border-error focus:ring-error' : ''}
            aria-label={`Á-pris för rad ${index + 1}`}
          />
        </div>
        
        {/* Radsumma */}
        <div className="col-span-1">
          <div className="font-semibold text-foreground">
            {item.line_total.toFixed(0)} SEK
          </div>
        </div>
        
        {/* Konfidens */}
        <div className="col-span-1">
          <ConfidenceBadge confidence={item.confidence_per_item} />
        </div>
        
        {/* Åtgärder */}
        <div className="col-span-2 flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setEditingItem(isEditing ? null : index)}
            aria-label={isEditing ? 'Avsluta redigering' : 'Redigera rad'}
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          {sourceItems[index] && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => resetItem(index)}
              aria-label="Återställ rad till ursprungligt värde"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => removeItem(index)}
            className="text-error hover:text-error"
            aria-label="Ta bort rad"
          >
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Vänster kolumn - Formulär */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quote Header */}
            {createdQuote && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-6 rounded-lg border shadow-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">
                      Offert #{createdQuote.id.slice(0, 8)}
                    </h2>
                    <p className="text-muted-foreground">Kund: {formData.customer}</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <StatusChip status={createdQuote.status} />
                    <Button
                      onClick={() => setShowSendModal(true)}
                      leftIcon={<Send className="h-4 w-4" />}
                    >
                      Skicka offert
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Kund & Projekt sektion */}
            <Card>
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleSection('customer')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{copy.common.customerAndProject}</CardTitle>
                    <CardDescription>{copy.common.customerAndProjectDesc}</CardDescription>
                  </div>
                  {expandedSections.has('customer') ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              
              <AnimatePresence>
                {expandedSections.has('customer') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="customer" className="block text-sm font-medium text-foreground mb-2">
                            {copy.common.customerName}
                          </label>
                          <Input
                            id="customer"
                            value={formData.customer}
                            onChange={(e) => setFormData(prev => ({ ...prev, customer: e.target.value }))}
                            placeholder="Ange kundnamn"
                            className={getFieldError('customer') ? 'border-error focus:ring-error' : ''}
                            aria-describedby={getFieldError('customer') ? 'customer-error' : undefined}
                          />
                          {getFieldError('customer') && (
                            <p id="customer-error" className="text-sm text-error mt-1">
                              {getFieldError('customer')}
                            </p>
                          )}
                        </div>
                        
                        <div>
                          <label htmlFor="project" className="block text-sm font-medium text-foreground mb-2">
                            {copy.common.projectName}
                          </label>
                          <Input
                            id="project"
                            value={formData.project}
                            onChange={(e) => setFormData(prev => ({ ...prev, project: e.target.value }))}
                            placeholder="Ange projektnamn"
                            className={getFieldError('project') ? 'border-error focus:ring-error' : ''}
                            aria-describedby={getFieldError('project') ? 'project-error' : undefined}
                          />
                          {getFieldError('project') && (
                            <p id="project-error" className="text-sm text-error mt-1">
                              {getFieldError('project')}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="room-type" className="block text-sm font-medium text-foreground mb-2">
                            {copy.common.roomType}
                          </label>
                                    <SimpleSelect
            id="room-type"
            value={formData.room_type}
            onValueChange={(value) => setFormData(prev => ({ ...prev, room_type: value }))}
          >
            <option value="">Välj rumstyp</option>
            <option value="bathroom">Badrum</option>
            <option value="kitchen">Kök</option>
            <option value="flooring">Golv</option>
          </SimpleSelect>
                        </div>
                        
                        <div>
                          <label htmlFor="finish-level" className="block text-sm font-medium text-foreground mb-2">
                            {copy.common.finishLevel}
                          </label>
                                    <SimpleSelect
            id="finish-level"
            value={formData.finish_level}
            onValueChange={(value) => setFormData(prev => ({ ...prev, finish_level: value }))}
          >
            <option value="">Välj nivå</option>
            <option value="basic">Basic</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
          </SimpleSelect>
                        </div>
                        
                        <div>
                          <label htmlFor="vat-rate" className="block text-sm font-medium text-foreground mb-2">
                            Moms %
                          </label>
                          <Input
                            id="vat-rate"
                            type="number"
                            value={formData.vat_rate}
                            onChange={(e) => setFormData(prev => ({ ...prev, vat_rate: parseFloat(e.target.value) || 0 }))}
                            placeholder="25"
                            className={getFieldError('vat_rate') ? 'border-error focus:ring-error' : ''}
                            aria-describedby={getFieldError('vat_rate') ? 'vat-rate-error' : undefined}
                          />
                          {getFieldError('vat_rate') && (
                            <p id="vat-rate-error" className="text-sm text-error mt-1">
                              {getFieldError('vat_rate')}
                            </p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* Rader sektion */}
            <Card>
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleSection('items')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{copy.common.quoteRows}</CardTitle>
                    <CardDescription>{copy.common.quoteRowsDesc}</CardDescription>
                  </div>
                  {expandedSections.has('items') ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              
              <AnimatePresence>
                {expandedSections.has('items') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardContent className="space-y-4">
                      {/* Undo/Redo controls */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={undo}
                            disabled={historyIndex <= 0}
                            leftIcon={<Undo2 className="h-4 w-4" />}
                            aria-label="Ångra"
                          >
                            {copy.actions.undo}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={redo}
                            disabled={historyIndex >= history.length - 1}
                            leftIcon={<Redo2 className="h-4 w-4" />}
                            aria-label="Gör om"
                          >
                            {copy.actions.redo}
                          </Button>
                        </div>
                        
                        <Button
                          onClick={addItem}
                          leftIcon={<Plus className="h-4 w-4" />}
                          size="sm"
                        >
                          {copy.actions.addRow}
                        </Button>
                      </div>

                      {/* Items table */}
                      <div className="space-y-3">
                        <AnimatePresence mode="popLayout">
                          {items.map((item, index) => (
                            <QuoteItemRow key={`${index}-${item.description}`} item={item} index={index} />
                          ))}
                        </AnimatePresence>
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>

            {/* Antaganden/Exkluderingar/Tidslinje sektion */}
            <Card>
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleSection('details')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{copy.common.detailsAndTerms}</CardTitle>
                    <CardDescription>{copy.common.detailsAndTermsDesc}</CardDescription>
                  </div>
                  {expandedSections.has('details') ? (
                    <ChevronUp className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
              </CardHeader>
              
              <AnimatePresence>
                {expandedSections.has('details') && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label htmlFor="assumptions" className="block text-sm font-medium text-foreground mb-2">
                            {copy.common.assumptions}
                          </label>
                          <Textarea
                            id="assumptions"
                            value={formData.assumptions}
                            onChange={(e) => setFormData(prev => ({ ...prev, assumptions: e.target.value }))}
                            placeholder="Beskriv antaganden..."
                            rows={4}
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="exclusions" className="block text-sm font-medium text-foreground mb-2">
                            {copy.common.exclusions}
                          </label>
                          <Textarea
                            id="exclusions"
                            value={formData.exclusions}
                            onChange={(e) => setFormData(prev => ({ ...prev, exclusions: e.target.value }))}
                            placeholder="Beskriv exkluderingar..."
                            rows={4}
                          />
                        </div>
                        
                        <div>
                          <label htmlFor="timeline" className="block text-sm font-medium text-foreground mb-2">
                            {copy.common.timeline}
                          </label>
                          <Textarea
                            id="timeline"
                            value={formData.timeline}
                            onChange={(e) => setFormData(prev => ({ ...prev, timeline: e.target.value }))}
                            placeholder="Beskriv tidslinje..."
                            rows={4}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </div>

          {/* Höger kolumn - Sticky sammanfattning */}
          <div className="lg:col-span-1">
            <div 
              ref={stickySummaryRef}
              className="sticky top-6 space-y-6"
            >
              {/* Sammanfattning */}
              <Card>
                <CardHeader>
                  <CardTitle>{copy.common.quoteSummary}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{copy.common.subtotal}:</span>
                      <span className="font-semibold">{subtotal.toFixed(0)} SEK</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{copy.common.vat} ({formData.vat_rate}%):</span>
                      <span className="font-semibold">{vat.toFixed(0)} SEK</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between">
                        <span className="text-lg font-semibold">{copy.common.total}:</span>
                        <span className="text-lg font-bold text-brand-600">{total.toFixed(0)} SEK</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <div className="text-sm text-muted-foreground mb-2">
                      {items.length} {copy.common.rows}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {copy.common.lastUpdated}: {new Date().toLocaleTimeString('sv-SE')}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Åtgärdsknappar */}
              <Card>
                <CardContent className="pt-6 space-y-3">
                  {!createdQuote ? (
                    <>
                      <Button 
                        className="w-full" 
                        size="lg"
                        onClick={() => {/* TODO: Implementera skapande */}}
                        disabled={!validateForm().isValid}
                      >
                        {copy.actions.createQuote}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {/* TODO: Implementera beräkning */}}
                      >
                        {copy.actions.calculate}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button 
                        className="w-full" 
                        size="lg"
                        leftIcon={<Send className="h-4 w-4" />}
                        onClick={() => setShowSendModal(true)}
                      >
                        {copy.actions.sendQuote}
                      </Button>
                      <Button 
                        variant="outline" 
                        className="w-full"
                        leftIcon={<Download className="h-4 w-4" />}
                        onClick={() => {/* TODO: Implementera PDF-nedladdning */}}
                        disabled={downloadingPDF}
                      >
                        {downloadingPDF ? copy.actions.downloading : copy.actions.downloadPdf}
                      </Button>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Auto-tuning insights */}
              {autoTuningInsights && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">{copy.common.autoTuning}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-brand-600">
                        {autoTuningInsights.total_patterns || 0}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {copy.common.learnedPatterns}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Send Quote Modal */}
      <SendQuoteModal
        isOpen={showSendModal}
        onClose={() => setShowSendModal(false)}
        onSend={async (email: string, message?: string) => {
          // TODO: Implementera sändning
          console.log('Sending quote to:', email, message)
        }}
        quoteId={quoteId || ''}
        customerName={formData.customer}
      />

      {/* Toast */}
      {showToast && (
        <Toast
          message={toastMessage}
          type={toastType}
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  )
}
