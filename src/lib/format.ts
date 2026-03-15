import type { LineItem } from "@/types/quotation"

const numberFormatter = new Intl.NumberFormat("zh-TW")

export function formatNumber(n: number): string {
  return numberFormatter.format(n)
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  TWD: "NT$",
  USD: "$",
  EUR: "€",
  JPY: "¥",
  CNY: "¥",
}

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? currency
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
