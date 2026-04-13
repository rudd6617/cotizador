import { createElement, useState } from "react"
import type { DocumentProps } from "@react-pdf/renderer"
import { Button } from "@/components/ui/button"
import { QuotationForm } from "@/components/quotation-form"
import { QuotationPreview } from "@/components/quotation-preview"
import { downloadBlob } from "@/lib/download"
import type { Quotation } from "@/types/quotation"

function createDefaultQuotation(): Quotation {
  const today = new Date().toISOString().split("T")[0]
  return {
    company: {
      quoter: "",
      phone: "",
      email: "",
    },
    client: {
      company: "",
      address: "",
    },
    meta: {
      quotationNumber: `QT-${today.replace(/-/g, "")}-001`,
      date: today,
      currency: "TWD",
    },
    items: [],
    taxRate: 0.05,
    paymentTerms: "",
    notes: "",
  }
}

export default function App() {
  const [quotation, setQuotation] = useState<Quotation>(createDefaultQuotation)
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    setDownloading(true)
    try {
      const [{ pdf }, { QuotationDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./components/pdf/quotation-document"),
      ])
      const blob = await pdf(
        createElement(QuotationDocument, { data: quotation }) as React.ReactElement<DocumentProps>,
      ).toBlob()
      downloadBlob(blob, `quotation-${quotation.meta.quotationNumber}.pdf`)
    } catch (err) {
      console.error(err)
      alert("PDF 產生失敗，請稍後再試")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-10 flex h-14 items-center justify-between border-b border-gray-200 bg-white px-6">
        <h1 className="text-lg font-bold text-slate-800">報價單產生器</h1>
        <Button onClick={handleDownload} disabled={downloading}>
          {downloading ? "產生中..." : "下載 PDF"}
        </Button>
      </header>

      <div className="fixed inset-0 top-14 flex">
        <div className="flex-1 overflow-y-auto bg-gray-100 p-6">
          <QuotationPreview data={quotation} />
        </div>
        <div className="w-[420px] shrink-0 overflow-y-auto border-l border-gray-200 bg-white p-4">
          <QuotationForm value={quotation} onChange={setQuotation} />
        </div>
      </div>
    </>
  )
}
