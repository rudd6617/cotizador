import { cn } from "@/lib/utils"
import { STATUS_BADGE_CLASSES, STATUS_LABELS } from "@/lib/status"
import type { QuotationStatus } from "@/types/quotation"

export function StatusBadge({ status }: { status: QuotationStatus }) {
  return (
    <span className={cn("inline-block rounded-full px-2.5 py-1 text-xs font-medium", STATUS_BADGE_CLASSES[status])}>
      {STATUS_LABELS[status]}
    </span>
  )
}
