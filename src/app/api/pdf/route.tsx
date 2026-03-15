import { NextRequest, NextResponse } from "next/server"
import { renderToBuffer } from "@react-pdf/renderer"
import { QuotationDocument } from "@/components/pdf/quotation-document"
import type { Quotation } from "@/types/quotation"

export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const data: Quotation = await request.json()

  const buffer = await renderToBuffer(<QuotationDocument data={data} />)

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="quotation-${data.meta.quotationNumber}.pdf"`,
    },
  })
}
