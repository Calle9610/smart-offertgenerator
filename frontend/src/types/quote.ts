// How to run: This file defines shared types for quote-related API responses
// Used by both frontend components and API routes

import { z } from 'zod'

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

// Zod validation schemas
export const QuoteItemSchema = z.object({
  kind: z.enum(['labor', 'material', 'custom']),
  ref: z.string().optional(),
  description: z.string().min(1, 'Beskrivning måste fyllas i').max(200, 'Beskrivning får inte vara längre än 200 tecken'),
  qty: z.number().positive('Antal måste vara större än 0').max(10000, 'Antal får inte vara större än 10 000'),
  unit: z.string().min(1, 'Enhet måste fyllas i').max(20, 'Enhet får inte vara längre än 20 tecken'),
  unit_price: z.number().min(0, 'Pris får inte vara negativt').max(1000000, 'Pris får inte vara högre än 1 000 000'),
  is_optional: z.boolean().default(false),
  option_group: z.string().nullable().optional()
})

export const CreateQuoteRequestSchema = z.object({
  customer_name: z.string().min(1, 'Kundnamn måste fyllas i').max(100, 'Kundnamn får inte vara längre än 100 tecken'),
  project_name: z.string().min(1, 'Projektnamn måste fyllas i').max(200, 'Projektnamn får inte vara längre än 200 tecken'),
  profile_id: z.string().min(1, 'Profil måste väljas'),
  currency: z.string().min(1, 'Valuta måste väljas'),
  vat_rate: z.number().min(0, 'Moms får inte vara negativ').max(100, 'Moms får inte vara högre än 100%'),
  items: z.array(QuoteItemSchema).min(1, 'Minst en offertrad måste läggas till')
})

// Type inference from schemas
export type ValidatedQuoteItem = z.infer<typeof QuoteItemSchema>
export type ValidatedCreateQuoteRequest = z.infer<typeof CreateQuoteRequestSchema>
