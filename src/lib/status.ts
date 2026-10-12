import type { QuotationStatus } from "@/types/quotation"

export const STATUS_LABELS: Record<QuotationStatus, string> = {
  draft: "草稿",
  sent: "已送出",
  won: "成交",
  lost: "未成交",
}

/** 四種狀態除了色相，明度也不同，色盲也分得出來 */
export const STATUS_BADGE_CLASSES: Record<QuotationStatus, string> = {
  draft: "border border-gray-300 bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-900",
  won: "bg-blue-900 text-white",
  lost: "bg-orange-100 text-orange-800",
}
