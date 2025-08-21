'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ChevronDown, 
  ChevronUp, 
  Check, 
  X, 
  Phone, 
  Mail, 
  Building2,
  Calendar,
  FileText,
  Star,
  Shield,
  Zap
} from 'lucide-react'
import { 
  PublicQuote, 
  AcceptQuoteRequest, 
  UpdateSelectionRequest,
  UpdateSelectionResponse,
  PublicQuoteItem,
  OptionGroup
} from '@/types/public-quote'
import { useCopy } from '@/copy/useCopy'

export default function PublicQuotePage() {
  const params = useParams()
  const token = params['token'] as string
  const copy = useCopy()
  
  const [quote, setQuote] = useState<PublicQuote | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState<string | null>(null)
  const [acceptedPackage, setAcceptedPackage] = useState<string | null>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [showThankYou, setShowThankYou] = useState(false)
  
  // New state for option selection
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([])
  const [currentTotals, setCurrentTotals] = useState({
    subtotal: 0,
    vat: 0,
    total: 0,
    base_subtotal: 0,
    optional_subtotal: 0
  })
  const [updatingSelection, setUpdatingSelection] = useState(false)

  useEffect(() => {
    fetchQuote()
  }, [token])

  const fetchQuote = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/public/quotes/${token}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Kunde inte hämta offerten')
      }
      
      const data = await response.json()
      setQuote(data)
      
      // Initialize selected items - all optional items start as selected
      if (data.items) {
        const optionalItemIds = data.items
          .filter((item: PublicQuoteItem) => item.is_optional)
          .map((item: PublicQuoteItem) => item.id)
        setSelectedItemIds(optionalItemIds)
        
        // Set initial totals
        setCurrentTotals({
          subtotal: parseFloat(data.subtotal),
          vat: parseFloat(data.vat),
          total: parseFloat(data.total),
          base_subtotal: parseFloat(data.subtotal),
          optional_subtotal: 0
        })
      }
      
      if (data.accepted_package_id) {
        setAcceptedPackage(data.accepted_package_id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod')
    } finally {
      setLoading(false)
    }
  }

  // New function to update selection and recalculate totals
  const updateSelection = async (newSelectedIds: string[]) => {
    try {
      setUpdatingSelection(true)
      
      const response = await fetch(`/api/public/quotes/${token}/update-selection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedItemIds: newSelectedIds } as UpdateSelectionRequest),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Kunde inte uppdatera tillval')
      }

      const data: UpdateSelectionResponse = await response.json()
      
      // Update selected items state
      setSelectedItemIds(newSelectedIds)
      
      // Update current totals
      setCurrentTotals({
        subtotal: data.subtotal,
        vat: data.vat,
        total: data.total,
        base_subtotal: data.base_subtotal,
        optional_subtotal: data.optional_subtotal
      })
      
      // Update quote items with selection status
      if (quote) {
        setQuote(prev => prev ? {
          ...prev,
          items: data.items,
          subtotal: data.subtotal.toString(),
          vat: data.vat.toString(),
          total: data.total.toString()
        } : null)
      }
      
    } catch (err) {
      console.error('Error updating selection:', err)
      alert(`❌ Fel: ${err instanceof Error ? err.message : 'Kunde inte uppdatera tillval'}`)
    } finally {
      setUpdatingSelection(false)
    }
  }

  const handleItemSelectionChange = (itemId: string, isSelected: boolean, optionGroup?: string) => {
    let newSelectedIds: string[]
    
    if (optionGroup) {
      // For option groups (radio buttons), replace the selected item in the group
      const currentGroupItems = quote?.items?.filter(item => item.option_group === optionGroup) || []
      const otherGroupItems = currentGroupItems.filter(item => item.id !== itemId).map(item => item.id)
      
      if (isSelected) {
        // Remove other items from the same group and add this one
        newSelectedIds = selectedItemIds.filter(id => !otherGroupItems.includes(id))
        newSelectedIds.push(itemId)
      } else {
        // Remove this item
        newSelectedIds = selectedItemIds.filter(id => id !== itemId)
      }
    } else {
      // For individual checkboxes, toggle the item
      if (isSelected) {
        newSelectedIds = [...selectedItemIds, itemId]
      } else {
        newSelectedIds = selectedItemIds.filter(id => id !== itemId)
      }
    }
    
    // Update selection immediately
    updateSelection(newSelectedIds)
  }

  const handleAcceptPackage = async (packageId: string) => {
    try {
      setAccepting(packageId)
      
      // Include selected optional items in the accept request
      const acceptPayload: AcceptQuoteRequest = {
        packageId,
        selectedItemIds: selectedItemIds
      }
      
      const response = await fetch(`/api/public/quotes/${token}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(acceptPayload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Kunde inte acceptera offerten')
      }

      setAcceptedPackage(packageId)
      setQuote(prev => prev ? { ...prev, accepted_package_id: packageId } : null)
      
      // Visa tack-skärm
      setShowThankYou(true)
    } catch (err) {
      alert(`❌ Fel: ${err instanceof Error ? err.message : 'Kunde inte acceptera offerten'}`)
    } finally {
      setAccepting(null)
    }
  }

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

  // Group items by option_group for better organization
  const getOptionGroups = (): OptionGroup[] => {
    if (!quote?.items) return []
    
    const groups: { [key: string]: OptionGroup } = {}
    
    quote.items.forEach(item => {
      if (item.is_optional) {
        const groupName = item.option_group || 'general'
        
        if (!groups[groupName]) {
          groups[groupName] = {
            name: groupName,
            title: getOptionGroupTitle(groupName),
            description: getOptionGroupDescription(groupName),
            type: getOptionGroupType(groupName),
            items: [],
            selected_items: []
          }
        }
        
        if (groups[groupName]) {
          groups[groupName]!.items.push(item)
          if (selectedItemIds.includes(item.id)) {
            groups[groupName]!.selected_items.push(item.id)
          }
        }
      }
    })
    
    return Object.values(groups)
  }

  const getOptionGroupTitle = (groupName: string): string => {
    const titles: { [key: string]: string } = {
      'finish_level': 'Utförandenivå',
      'extra_features': 'Extra funktioner',
      'materials': 'Materialval',
      'services': 'Tjänster',
      'general': 'Tillval'
    }
    return titles[groupName] || groupName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getOptionGroupDescription = (groupName: string): string => {
    const descriptions: { [key: string]: string } = {
      'finish_level': 'Välj utförandenivå för projektet',
      'extra_features': 'Lägg till extra funktioner och förbättringar',
      'materials': 'Välj materialkvalitet och typ',
      'services': 'Välj extra tjänster som ska ingå',
      'general': 'Allmänna tillval för projektet'
    }
    return descriptions[groupName] || `Alternativ för ${groupName}`
  }

  const getOptionGroupType = (groupName: string): 'single' | 'multiple' => {
    const singleChoiceGroups = ['finish_level', 'materials']
    return singleChoiceGroups.includes(groupName) ? 'single' : 'multiple'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-6"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Laddar din offert</h2>
          <p className="text-gray-500">Ett ögonblick...</p>
        </div>
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 text-6xl mb-6">⚠️</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Offert kunde inte hittas</h1>
          <p className="text-gray-600 mb-6">{error || 'Offerten finns inte eller har gått ut'}</p>
          <a 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Gå tillbaka till startsidan
          </a>
        </div>
      </div>
    )
  }

  if (showThankYou) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center max-w-2xl mx-auto px-4">
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-2xl shadow-2xl p-8"
          >
            <div className="text-green-500 text-8xl mb-6">🎉</div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Tack för din beställning!</h1>
            <p className="text-xl text-gray-600 mb-8">
              Du har accepterat offerten för <strong>{quote.project_name || 'projektet'}</strong>
            </p>
            
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-blue-900 mb-4">Nästa steg</h2>
              <div className="space-y-3 text-left">
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-600 text-white rounded-full p-1 mt-0.5">
                    <Check className="h-4 w-4" />
                  </div>
                  <p className="text-blue-800">Vi bekräftar din beställning inom 24 timmar</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-600 text-white rounded-full p-1 mt-0.5">
                    <Check className="h-4 w-4" />
                  </div>
                  <p className="text-blue-800">Projektplanering startar inom 2-3 arbetsdagar</p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="bg-blue-600 text-white rounded-full p-1 mt-0.5">
                    <Check className="h-4 w-4" />
                  </div>
                  <p className="text-blue-800">Du får uppdateringar via e-post</p>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <p className="text-gray-600 mb-4">För frågor, kontakta oss:</p>
              <div className="flex justify-center space-x-4">
                <a 
                  href="tel:+46701234567" 
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Ring oss
                </a>
                <a 
                  href="mailto:info@företag.se" 
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  E-post
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  const optionGroups = getOptionGroups()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="bg-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex justify-center mb-6">
                <div className="bg-blue-600 text-white p-4 rounded-full">
                  <Building2 className="h-8 w-8" />
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                {copy.common.quote.title} för {quote.customer_name}
              </h1>
              {quote.project_name && (
                <p className="text-xl md:text-2xl text-gray-600 mb-6">{quote.project_name}</p>
              )}
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-6 text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  {copy.common.quote.title} #{token.slice(0, 8)}
                </div>
                <div className="flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  {copy.common.quote.title} #{token.slice(0, 8)}
                </div>
              </div>
            </motion.div>
          </div>
          
          {/* Contact CTA */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white text-center">
            <h2 className="text-xl font-semibold mb-3">{copy.common.questions}</h2>
            <p className="mb-4 opacity-90">{copy.common.helpText}</p>
            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <a 
                href="tel:+46701234567" 
                className="inline-flex items-center px-6 py-3 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
              >
                <Phone className="h-4 w-4 mr-2" />
                {copy.common.customer.phone}
              </a>
              <a 
                href="mailto:info@företag.se" 
                className="inline-flex items-center px-6 py-3 bg-transparent border-2 border-white text-white font-medium rounded-lg hover:bg-white hover:text-blue-600 transition-colors"
              >
                <Mail className="h-4 w-4 mr-2" />
                {copy.common.customer.email}
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Package Selection with Tabs */}
        <div className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-8"
          >
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {copy.common.choosePackage}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {copy.common.packageDescription}
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {quote.packages.map((pkg, index) => (
              <motion.div
                key={pkg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 + index * 0.1 }}
                className={`relative bg-white rounded-2xl shadow-xl border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${
                  acceptedPackage === pkg.id
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                {/* Package Badges */}
                <div className="absolute -top-4 left-6 right-6 flex justify-center">
                  {pkg.is_default && (
                    <span className="bg-blue-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg">
                      ⭐ Bäst värde
                    </span>
                  )}
                  {pkg.name.toLowerCase().includes('premium') && (
                    <span className="bg-purple-600 text-white text-sm font-bold px-4 py-2 rounded-full shadow-lg ml-2">
                      👑 Premium
                    </span>
                  )}
                </div>

                {/* Package Header */}
                <div className="p-8 pt-12">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{pkg.name}</h3>
                  <div className="text-4xl font-bold text-blue-600 mb-6">
                    {pkg.total} {quote.currency}
                  </div>
                  
                  {/* Package Features */}
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                      <span>Komplett projektplanering</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                      <span>Kvalificerade hantverkare</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                      <span>Materialgaranti</span>
                    </div>
                    {pkg.name.toLowerCase().includes('premium') && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Star className="h-4 w-4 text-yellow-500 mr-3 flex-shrink-0" />
                        <span>Premium material & finish</span>
                      </div>
                    )}
                  </div>

                  {/* Package Details */}
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">{copy.common.quote.subtotal}:</span>
                        <span className="font-medium">{pkg.subtotal} {quote.currency}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">{copy.common.quote.vat}:</span>
                        <span className="font-medium">{pkg.vat} {quote.currency}</span>
                      </div>
                      <div className="border-t pt-2">
                        <div className="flex justify-between font-semibold">
                          <span>{copy.common.quote.total}:</span>
                          <span className="text-blue-600">{pkg.total} {quote.currency}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Accept Button */}
                  {acceptedPackage === pkg.id ? (
                    <div className="text-center">
                      <div className="bg-green-100 text-green-800 px-6 py-3 rounded-lg font-medium">
                        ✅ Accepterad
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAcceptPackage(pkg.id)}
                      disabled={accepting === pkg.id}
                      className={`w-full py-4 px-6 rounded-lg font-semibold text-lg transition-all duration-200 ${
                        accepting === pkg.id
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg transform hover:scale-105'
                      }`}
                      aria-label={`Acceptera ${pkg.name} paket`}
                    >
                      {accepting === pkg.id ? 'Accepterar...' : `${copy.actions.accept} ${pkg.name}`}
                    </button>
                  )}
                </div>

                {/* Package Items */}
                <div className="border-t border-gray-100">
                  <button
                    onClick={() => toggleSection(`package-${pkg.id}`)}
                    className="w-full px-8 py-4 text-left text-sm text-blue-600 hover:text-blue-800 hover:bg-gray-50 transition-colors flex items-center justify-between"
                    aria-expanded={expandedSections.has(`package-${pkg.id}`)}
                    aria-label={`Visa detaljer för ${pkg.name} paket`}
                  >
                    <span>{copy.common.whatIncluded}</span>
                    {expandedSections.has(`package-${pkg.id}`) ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>
                  
                  <AnimatePresence>
                    {expandedSections.has(`package-${pkg.id}`) && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="px-8 pb-6"
                      >
                        <div className="space-y-3">
                          {pkg.items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-b-0">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{item.description || item.kind}</div>
                                <div className="text-sm text-gray-500">
                                  {item.qty} {item.unit} × {item.unit_price} {quote.currency}
                                </div>
                              </div>
                              <div className="text-right font-medium text-gray-900">
                                {item.line_total} {quote.currency}
                              </div>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Option Selection Section */}
        {optionGroups.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-white rounded-2xl shadow-xl p-8 mb-12"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {copy.common.customizeQuote}
              </h2>
              <p className="text-lg text-gray-600">
                {copy.common.customizeDescription}
              </p>
            </div>
            
            <div className="space-y-8">
              {optionGroups.map((group) => (
                <div key={group.name} className="border border-gray-200 rounded-xl p-6">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{group.title}</h3>
                    {group.description && (
                      <p className="text-gray-600">{group.description}</p>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {group.items.map((item) => {
                      const isSelected = selectedItemIds.includes(item.id)
                      
                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`flex items-center space-x-4 p-4 border-2 rounded-lg transition-all duration-200 ${
                            isSelected 
                              ? 'border-blue-500 bg-blue-50' 
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          {group.type === 'single' ? (
                            <input
                              type="radio"
                              id={item.id}
                              name={group.name}
                              checked={isSelected}
                              onChange={() => handleItemSelectionChange(item.id, true, group.name)}
                              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300"
                              aria-label={`Välj ${item.description || item.kind}`}
                            />
                          ) : (
                            <input
                              type="checkbox"
                              id={item.id}
                              checked={isSelected}
                              onChange={(e) => handleItemSelectionChange(item.id, e.target.checked)}
                              className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              aria-label={`Välj ${item.description || item.kind}`}
                            />
                          )}
                          
                          <label htmlFor={item.id} className="flex-1 cursor-pointer">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900">{item.description || item.kind}</div>
                                <div className="text-sm text-gray-500">
                                  {item.qty} {item.unit} × {item.unit_price} {quote.currency}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className={`font-semibold text-lg ${isSelected ? 'text-blue-600' : 'text-gray-400'}`}>
                                  {isSelected ? item.line_total : '0'} {quote.currency}
                                </div>
                                {item.is_optional && (
                                  <div className="text-xs text-gray-500">
                                    {isSelected ? 'Valt' : 'Ej valt'}
                                  </div>
                                )}
                              </div>
                            </div>
                          </label>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
            
            {updatingSelection && (
              <div className="text-center py-6">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-gray-600">{copy.common.updatingTotals}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Info Sections with Accordions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="space-y-6 mb-12"
        >
          {/* Assumptions */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <button
              onClick={() => toggleSection('assumptions')}
              className="w-full px-8 py-6 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
              aria-expanded={expandedSections.has('assumptions')}
              aria-label="Visa antaganden"
            >
              <div className="flex items-center">
                <div className="bg-blue-100 text-blue-600 p-2 rounded-lg mr-4">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{copy.common.quote.assumptions}</h3>
                  <p className="text-gray-600">Vad vi antar om projektet</p>
                </div>
              </div>
              {expandedSections.has('assumptions') ? (
                <ChevronUp className="h-6 w-6 text-gray-400" />
              ) : (
                <ChevronDown className="h-6 w-6 text-gray-400" />
              )}
            </button>
            
            <AnimatePresence>
              {expandedSections.has('assumptions') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="px-8 pb-6"
                >
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700">
                      Denna offert baseras på följande antaganden:
                    </p>
                    <ul className="mt-4 space-y-2">
                      <li>• Projektet kan startas inom 2-3 veckor efter accept</li>
                      <li>• Alla nödvändiga tillstånd är på plats</li>
                      <li>• Material kan levereras enligt planerad tidslinje</li>
                      <li>• Vädret tillåter utomhusarbete vid planerad start</li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Exclusions */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <button
              onClick={() => toggleSection('exclusions')}
              className="w-full px-8 py-6 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
              aria-expanded={expandedSections.has('exclusions')}
              aria-label="Visa exkluderingar"
            >
              <div className="flex items-center">
                <div className="bg-red-100 text-red-600 p-2 rounded-lg mr-4">
                  <X className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{copy.common.quote.exclusions}</h3>
                  <p className="text-gray-600">Vad som inte ingår</p>
                </div>
              </div>
              {expandedSections.has('exclusions') ? (
                <ChevronUp className="h-6 w-6 text-gray-400" />
              ) : (
                <ChevronDown className="h-6 w-6 text-gray-400" />
              )}
            </button>
            
            <AnimatePresence>
              {expandedSections.has('exclusions') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="px-8 pb-6"
                >
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700">
                      Följande saker ingår inte i denna offert:
                    </p>
                    <ul className="mt-4 space-y-2">
                      <li>• Arkitektritningar och bygglov</li>
                      <li>• Elarbete och VVS-installationer</li>
                      <li>• Möbler och inredning</li>
                      <li>• Trädgårdsarbete och markarbete</li>
                    </ul>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <button
              onClick={() => toggleSection('timeline')}
              className="w-full px-8 py-6 text-left hover:bg-gray-50 transition-colors flex items-center justify-between"
              aria-expanded={expandedSections.has('timeline')}
              aria-label="Visa tidslinje"
            >
              <div className="flex items-center">
                <div className="bg-green-100 text-green-600 p-2 rounded-lg mr-4">
                  <Zap className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{copy.common.quote.timeline}</h3>
                  <p className="text-gray-600">Projektschema och milstolpar</p>
                </div>
              </div>
              {expandedSections.has('timeline') ? (
                <ChevronUp className="h-6 w-6 text-gray-400" />
              ) : (
                <ChevronDown className="h-6 w-6 text-gray-400" />
              )}
            </button>
            
            <AnimatePresence>
              {expandedSections.has('timeline') && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="px-8 pb-6"
                >
                  <div className="prose prose-gray max-w-none">
                    <div className="space-y-6">
                      <div className="flex items-start space-x-4">
                        <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                          1
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Projektplanering</h4>
                          <p className="text-gray-600">2-3 arbetsdagar efter accept</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-4">
                        <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                          2
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Materialleverans</h4>
                          <p className="text-gray-600">1-2 veckor efter planering</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-4">
                        <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                          3
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Utförande</h4>
                          <p className="text-gray-600">2-4 veckor beroende på paket</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-4">
                        <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold flex-shrink-0">
                          4
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">Genomgång & överlämning</h4>
                          <p className="text-gray-600">1 arbetsdag</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center text-gray-500"
        >
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Viktig information</h3>
            <div className="space-y-2 text-sm">
              <p>• Denna offert är giltig i 30 dagar från skapandedatum</p>
              <p>• Priserna är angivna exklusive moms om inget annat anges</p>
              <p>• För frågor, kontakta oss via telefon eller e-post</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sticky Mobile Totals */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="px-4 py-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">{copy.common.quote.total}:</span>
            <span className="text-2xl font-bold text-blue-600">
              {currentTotals.total.toFixed(2)} {quote?.currency}
            </span>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => {
                const defaultPackage = quote?.packages.find(p => p.is_default)
                if (defaultPackage) {
                  handleAcceptPackage(defaultPackage.id)
                }
              }}
              disabled={!!acceptedPackage}
              className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold disabled:bg-gray-300 disabled:text-gray-500"
            >
              {acceptedPackage ? 'Accepterad' : `${copy.actions.accept} offert`}
            </button>
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-4 py-3 bg-gray-200 text-gray-700 rounded-lg"
            >
              <ChevronUp className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 
