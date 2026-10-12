export interface CompanyInfo {
  name?: string
  quoter: string
  address?: string
  phone: string
  email: string
  logo?: string
  taxId?: string
  /** 匯款資料；舊報價單的公司快照沒有這些欄位 */
  bankName?: string
  bankBranch?: string
  bankAccountName?: string
  bankAccountNumber?: string
}

export interface ClientInfo {
  company: string
  taxId?: string
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
  name: string
  spec: string
  quantity: number
  unit: string
  unitPrice: number
}

export const QUOTATION_TEMPLATES = ["modern", "classic"] as const

/** 報價單版型；每張單各自存（同客戶快照的理由，ADR-0001） */
export type QuotationTemplate = (typeof QUOTATION_TEMPLATES)[number]

export interface Quotation {
  template: QuotationTemplate
  company: CompanyInfo
  client: ClientInfo
  meta: QuotationMeta
  items: LineItem[]
  taxRate: number
  paymentTerms: string
  notes: string
  /** 報價單上是否顯示付款條件 */
  showPaymentTerms: boolean
  /** 報價單上是否顯示備註 */
  showNotes: boolean
  /** 報價單上是否顯示大寫金額（僅傳統版型、新台幣） */
  showAmountInWords: boolean
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

/** 系統設定（不進報價單快照） */
export interface AppSettings {
  defaultTemplate: QuotationTemplate
}
