export interface PublicQuoteItem {
  id: string
  kind: string
  ref?: string
  description?: string
  qty: string
  unit?: string
  unit_price: string
  line_total: string
  is_optional?: boolean
  option_group?: string
  isSelected?: boolean
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
  items?: PublicQuoteItem[] // Individual items for custom selection
}

export interface AcceptQuoteRequest {
  packageId: string
  selectedItemIds?: string[] // Include selected optional items
}

export interface AcceptQuoteResponse {
  success: boolean
  message: string
  accepted_package_id: string
}

// New types for option selection
export interface UpdateSelectionRequest {
  selectedItemIds: string[]
}

export interface UpdateSelectionResponse {
  items: PublicQuoteItem[]
  subtotal: number
  vat: number
  total: number
  base_subtotal: number
  optional_subtotal: number
  selected_item_count: number
  message: string
}

export interface OptionGroup {
  name: string
  title: string
  description?: string
  type: 'single' | 'multiple'
  items: PublicQuoteItem[]
  selected_items: string[]
} 
