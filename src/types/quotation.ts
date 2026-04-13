export interface CompanyInfo {
  name?: string
  quoter: string
  address?: string
  phone: string
  email: string
  logo?: string
  taxId?: string
}

export interface ClientInfo {
  company: string
  contactPerson?: string
  address: string
  phone?: string
  email?: string
}

export type Currency = "TWD" | "USD" | "EUR" | "JPY" | "CNY"

export interface QuotationMeta {
  quotationNumber: string
  date: string
  currency: Currency
}

export interface LineItem {
  id: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
}

export interface Quotation {
  company: CompanyInfo
  client: ClientInfo
  meta: QuotationMeta
  items: LineItem[]
  taxRate: number
  paymentTerms: string
  notes: string
}