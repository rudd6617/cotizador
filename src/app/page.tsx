"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { QuotationForm } from "@/components/quotation-form"
import { QuotationPreview } from "@/components/quotation-preview"
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

export default function Home() {
  const [quotation, setQuotation] = useState<Quotation>(createDefaultQuotation)
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    setDownloading(true)
    try {
      const res = await fetch("/api/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quotation),
      })
      if (!res.ok) throw new Error("PDF generation failed")

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `quotation-${quotation.meta.quotationNumber}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error(err)
      alert("PDF 產生失敗，請稍後再試")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-800">報價單產生器</h1>
          <Button onClick={handleDownload} disabled={downloading}>
            {downloading ? "產生中..." : "下載 PDF"}
          </Button>
        </div>

        <Tabs defaultValue="edit" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="edit">編輯</TabsTrigger>
            <TabsTrigger value="preview">預覽</TabsTrigger>
          </TabsList>

          <TabsContent value="edit">
            <QuotationForm value={quotation} onChange={setQuotation} />
          </TabsContent>

          <TabsContent value="preview">
            <QuotationPreview data={quotation} />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
