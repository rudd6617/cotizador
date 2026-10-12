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
export const QUOTATION_STATUSES = ["draft", "sent", "won", "lost"] as const

export type QuotationStatus = (typeof QUOTATION_STATUSES)[number]

export interface Client extends ClientInfo {
  id: number
}

export interface ClientWithCount extends Client {
  quotationCount: number
}

/** 存進資料庫的一張報價單；data 內含客戶與公司快照（ADR-0001） */
export interface QuotationRecord {
  status: QuotationStatus
  clientId: number
  data: Quotation
}

export interface QuotationSummary {
  number: string
  clientId: number
  clientName: string
  status: QuotationStatus
  date: string
  currency: Currency
  total: number
}
