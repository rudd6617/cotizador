import type { Currency, LineItem } from "@/types/quotation"

const numberFormatter = new Intl.NumberFormat("zh-TW")

export function formatNumber(n: number): string {
  return numberFormatter.format(n)
}

const CURRENCY_SYMBOLS: Record<Currency, string> = {
  TWD: "NT$",
  USD: "$",
  EUR: "€",
  JPY: "¥",
  CNY: "¥",
}

export function getCurrencySymbol(currency: Currency): string {
  return CURRENCY_SYMBOLS[currency]
}

export function calcLineAmount(item: LineItem): number {
  return item.quantity * item.unitPrice
}

export function calcSubtotal(items: LineItem[]): number {
  return items.reduce((sum, item) => sum + calcLineAmount(item), 0)
}

export function calcTax(subtotal: number, taxRate: number): number {
  return Math.round(subtotal * taxRate)
}

export function calcTotal(subtotal: number, tax: number): number {
  return subtotal + tax
}

const UPPER_DIGITS = "零壹貳參肆伍陸柒捌玖"
const SMALL_UNITS = ["", "拾", "佰", "仟"]
const BIG_UNITS = ["", "萬", "億", "兆"]

/** 0–9999 轉大寫；中間的連續 0 只讀一個「零」，尾端的 0 不讀 */
function groupToChinese(group: number): string {
  let out = ""
  let pendingZero = false
  for (let i = 3; i >= 0; i--) {
    const d = Math.floor(group / 10 ** i) % 10
    if (d === 0) {
      pendingZero = out !== ""
      continue
    }
    if (pendingZero) out += "零"
    out += UPPER_DIGITS[d] + SMALL_UNITS[i]
    pendingZero = false
  }
  return out
}

/** 非負整數轉中文大寫數字，例：128100 → 壹拾貳萬捌仟壹佰 */
export function toChineseUpper(n: number): string {
  if (n === 0) return "零"
  const groups: number[] = []
  for (let rest = n; rest > 0; rest = Math.floor(rest / 10000)) groups.push(rest % 10000)

  let out = ""
  let pendingZero = false
  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i]
    if (group === 0) {
      pendingZero = out !== ""
      continue
    }
    if (out !== "" && (pendingZero || group < 1000)) out += "零"
    out += groupToChinese(group) + BIG_UNITS[i]
    pendingZero = false
  }
  return out
}

/** 只有新台幣有大寫金額寫法；其他幣別回傳 null */
export function amountInWords(total: number, currency: Currency): string | null {
  if (currency !== "TWD") return null
  return `新台幣（含稅）：${toChineseUpper(Math.round(total))}元整`
}

const pad = (n: number) => String(n).padStart(2, "0")

/** QT-YYYYMMDD-HHmmss，用本地時間；開新報價單的當下產生 */
export function formatQuotationNumber(d: Date): string {
  const date = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
  const time = `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  return `QT-${date}-${time}`
}

export function isQuotationNumber(s: string): boolean {
  return /^QT-\d{8}-\d{6}$/.test(s)
}
