export interface PublicQuoteItem {
  id: string
  kind: string
  ref?: string
  description?: string
  qty: string
  unit?: string
  unit_price: string
  line_total: string
}

export interface PublicQuotePackage {
  id: string
  name: string
  items: PublicQuoteItem[]
  subtotal: string
  vat: string
  total: string
  is_default: boolean
  created_at: string
}

export interface PublicQuote {
  id: string
  customer_name: string
  project_name?: string
  currency: string
  subtotal: string
  vat: string
  total: string
  status: string
  created_at: string
  packages: PublicQuotePackage[]
  accepted_package_id?: string
}

export interface AcceptQuoteRequest {
  packageId: string
}

export interface AcceptQuoteResponse {
  success: boolean
  message: string
  accepted_package_id: string
} 
