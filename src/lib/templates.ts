import { amountInWords, calcSubtotal, calcTax, calcTotal } from "@/lib/format"
import {
  QUOTATION_TEMPLATES,
  type ClientInfo,
  type CompanyInfo,
  type Quotation,
  type QuotationMeta,
  type QuotationTemplate,
} from "@/types/quotation"

export const TEMPLATE_LABELS: Record<QuotationTemplate, string> = {
  modern: "現代",
  classic: "傳統",
}

export const TEMPLATE_ITEMS = QUOTATION_TEMPLATES.map((t) => ({ value: t, label: TEMPLATE_LABELS[t] }))

// 傳統版型的資料區塊都是「一行一項、附標籤」

export interface LabeledLine {
  label: string
  value: string
}

/** 沒填的欄位不顯示 */
function filled(lines: { label: string; value?: string }[]): LabeledLine[] {
  return lines.filter((l): l is LabeledLine => Boolean(l.value))
}

export function classicCompanyLines(company: CompanyInfo): LabeledLine[] {
  return filled([
    { label: "統一編號", value: company.taxId },
    { label: "地址", value: company.address },
    { label: "電話", value: company.phone },
    { label: "Email", value: company.email },
  ])
}

export function classicClientLines(client: ClientInfo): LabeledLine[] {
  return filled([
    { label: "客戶名稱", value: client.company },
    { label: "統一編號", value: client.taxId },
    { label: "聯絡人", value: client.contactPerson },
    { label: "電話", value: client.phone },
    { label: "Email", value: client.email },
    { label: "地址", value: client.address },
  ])
}

export function bankLines(company: CompanyInfo): LabeledLine[] {
  return filled([
    { label: "銀行", value: company.bankName },
    { label: "分行", value: company.bankBranch },
    { label: "戶名", value: company.bankAccountName },
    { label: "帳號", value: company.bankAccountNumber },
  ])
}

/** 報價資訊一律顯示（未存檔時編號留白） */
export function classicMetaLines(meta: QuotationMeta, quoter: string): LabeledLine[] {
  return [
    { label: "報價編號", value: meta.quotationNumber },
    { label: "報價日期", value: meta.date },
    { label: "報價人", value: quoter },
  ]
}

/** 小計左邊要顯示的付款條件、備註：開關打開且有填 */
export function visibleTermsAndNotes(q: Quotation): LabeledLine[] {
  return filled([
    { label: "付款條件", value: q.showPaymentTerms ? q.paymentTerms : "" },
    { label: "備註", value: q.showNotes ? q.notes : "" },
  ])
}

/** 傳統版型小計左邊的大寫金額：開關打開且為新台幣才顯示 */
export function visibleAmountInWords(q: Quotation): string | null {
  if (!q.showAmountInWords) return null
  const subtotal = calcSubtotal(q.items)
  return amountInWords(calcTotal(subtotal, calcTax(subtotal, q.taxRate)), q.meta.currency)
}
