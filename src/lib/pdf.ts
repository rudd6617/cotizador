import { createElement, type ComponentType } from "react"
import type { DocumentProps } from "@react-pdf/renderer"
import { downloadBlob } from "@/lib/download"
import type { Quotation, QuotationTemplate } from "@/types/quotation"

type PdfDocument = ComponentType<{ data: Quotation }>

/** 依版型動態載入 PDF 元件，PDF 套件不進首頁 bundle */
const DOCUMENTS: Record<QuotationTemplate, () => Promise<PdfDocument>> = {
  modern: () => import("@/components/pdf/quotation-document").then((m) => m.QuotationDocument),
  classic: () => import("@/components/pdf/quotation-document-classic").then((m) => m.QuotationDocumentClassic),
}

export async function downloadQuotationPdf(quotation: Quotation) {
  const [{ pdf }, Doc] = await Promise.all([import("@react-pdf/renderer"), DOCUMENTS[quotation.template]()])
  const blob = await pdf(createElement(Doc, { data: quotation }) as React.ReactElement<DocumentProps>).toBlob()
  const name = quotation.meta.quotationNumber || "draft"
  downloadBlob(blob, `quotation-${name}.pdf`)
}
