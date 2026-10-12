import { createElement } from "react"
import type { DocumentProps } from "@react-pdf/renderer"
import { downloadBlob } from "@/lib/download"
import type { Quotation } from "@/types/quotation"

export async function downloadQuotationPdf(quotation: Quotation) {
  const [{ pdf }, { QuotationDocument }] = await Promise.all([
    import("@react-pdf/renderer"),
    import("@/components/pdf/quotation-document"),
  ])
  const blob = await pdf(
    createElement(QuotationDocument, { data: quotation }) as React.ReactElement<DocumentProps>,
  ).toBlob()
  const name = quotation.meta.quotationNumber || "draft"
  downloadBlob(blob, `quotation-${name}.pdf`)
}
