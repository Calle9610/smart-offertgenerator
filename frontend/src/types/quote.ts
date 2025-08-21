// How to run: This file defines shared types for quote-related API responses
// Used by both frontend components and API routes

export interface QuoteItem {
  id: string
  kind: 'labor' | 'material' | 'custom'
  ref?: string
  description: string
  qty: number
  unit: string
  unit_price: number
  is_optional: boolean
  option_group?: string | null
}

export interface QuoteTotals {
  subtotal: number
  vat: number
  total: number
  currency: string
}

export interface QuoteDto {
  id: string
  customer: string
  project: string
  items: QuoteItem[]
  totals: QuoteTotals
  status: 'draft' | 'sent' | 'accepted' | 'declined'
  createdAt: string
  updatedAt: string
}

export interface CreateQuoteRequest {
  customer_name: string
  project_name: string
  profile_id: string
  currency: string
  vat_rate: number
  items: Omit<QuoteItem, 'id'>[]
}

export interface CreateQuoteResponse {
  id: string
  message: string
}
