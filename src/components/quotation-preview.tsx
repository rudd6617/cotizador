import { memo } from "react"
import type { Quotation } from "@/types/quotation"
import {
  calcLineAmount,
  calcSubtotal,
  calcTax,
  calcTotal,
  formatNumber,
  getCurrencySymbol,
} from "@/lib/format"

interface Props {
  data: Quotation
}

export const QuotationPreview = memo(function QuotationPreview({ data }: Props) {
  const { company, client, meta, items, taxRate, paymentTerms, notes } = data
  const subtotal = calcSubtotal(items)
  const tax = calcTax(subtotal, taxRate)
  const total = calcTotal(subtotal, tax)
  const sym = getCurrencySymbol(meta.currency)

  return (
    <div
      className="mx-auto max-w-[210mm] bg-white text-gray-900 shadow-lg"
      style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
    >
      <div className="p-10">
        {/* 1. Title (left) + meta (right) */}
        <div className="mb-5 flex items-end justify-between border-b-2 border-slate-800 pb-4">
          <h1 className="text-2xl font-bold tracking-[0.4em] text-slate-800">
            報價單
          </h1>
          <div className="text-sm">
            <div className="flex">
              <span className="w-16 text-xs text-gray-500">報價編號</span>
              <span className="text-xs font-bold text-gray-700">{meta.quotationNumber}</span>
            </div>
            <div className="mt-0.5 flex">
              <span className="w-16 text-xs text-gray-500">報價日期</span>
              <span className="text-xs font-bold text-gray-700">{meta.date}</span>
            </div>
          </div>
        </div>

        {/* 2. Quoter (left) | Client (right) */}
        <div className="mb-6 grid grid-cols-2 gap-8">
          <div className="flex gap-3">
            {company.logo && (
              <img
                src={company.logo}
                alt="Logo"
                className="h-11 w-11 object-contain"
              />
            )}
            <div>
              {company.name && (
                <p className="text-sm font-bold text-slate-800">
                  {company.name}
                </p>
              )}
              <p className="mt-0.5 text-xs text-gray-600">
                聯絡人：{company.quoter}
              </p>
              <p className="text-xs text-gray-600">
                聯絡電話：{company.phone}
              </p>
              <p className="text-xs text-gray-600">
                聯絡信箱：{company.email}
              </p>
              {company.address && (
                <p className="text-xs text-gray-500">{company.address}</p>
              )}
              {company.taxId && (
                <p className="text-xs text-gray-500">
                  統一編號：{company.taxId}
                </p>
              )}
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-600">
              客戶名稱：{client.company || "—"}
            </p>
            {client.contactPerson && (
              <p className="mt-0.5 text-xs text-gray-600">
                聯絡人：{client.contactPerson}
              </p>
            )}
            {client.address && (
              <p className="mt-0.5 text-xs text-gray-600">
                {client.address}
              </p>
            )}
            {client.phone && (
              <p className="mt-0.5 text-xs text-gray-600">
                電話：{client.phone}
              </p>
            )}
            {client.email && (
              <p className="mt-0.5 text-xs text-gray-600">
                Email：{client.email}
              </p>
            )}
          </div>
        </div>

        {/* 3. Table */}
        <div className="mb-6">
          <div className="grid grid-cols-12 rounded-t bg-slate-800 px-3 py-2 text-xs font-bold text-white">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5">品項說明</div>
            <div className="col-span-1 text-right">數量</div>
            <div className="col-span-1 text-center">單位</div>
            <div className="col-span-2 text-right">單價</div>
            <div className="col-span-2 text-right">金額</div>
          </div>
          {items.map((item, i) => (
            <div
              key={item.id}
              className={`grid grid-cols-12 border-b border-gray-200 px-3 py-2 text-sm ${
                i % 2 === 1 ? "bg-gray-50" : ""
              }`}
            >
              <div className="col-span-1 text-center text-gray-500">
                {i + 1}
              </div>
              <div className="col-span-5">{item.description}</div>
              <div className="col-span-1 text-right">
                {formatNumber(item.quantity)}
              </div>
              <div className="col-span-1 text-center">{item.unit}</div>
              <div className="col-span-2 text-right">
                {sym} {formatNumber(item.unitPrice)}
              </div>
              <div className="col-span-2 text-right">
                {sym} {formatNumber(calcLineAmount(item))}
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="border-b border-gray-200 py-8 text-center text-sm text-gray-400">
              尚未新增品項
            </div>
          )}
        </div>

        {/* 4. Totals */}
        <div className="mb-6 flex justify-end">
          <div className="w-64">
            <div className="flex justify-between px-3 py-1.5">
              <span className="text-sm text-gray-500">小計</span>
              <span className="text-sm font-bold">
                {sym} {formatNumber(subtotal)}
              </span>
            </div>
            {taxRate > 0 && (
              <div className="flex justify-between px-3 py-1.5">
                <span className="text-sm text-gray-500">
                  稅金 ({(taxRate * 100).toFixed(0)}%)
                </span>
                <span className="text-sm font-bold">
                  {sym} {formatNumber(tax)}
                </span>
              </div>
            )}
            <div className="mt-1 flex justify-between rounded bg-slate-800 px-3 py-2.5 text-white">
              <span className="font-bold">總計</span>
              <span className="text-lg font-bold">
                {sym} {formatNumber(total)}
              </span>
            </div>
          </div>
        </div>

        {/* 5. Notes */}
        {(paymentTerms || notes) && (
          <div className="rounded bg-gray-50 p-4">
            {paymentTerms && (
              <div className="mb-3">
                <p className="mb-1 text-[10px] tracking-wide text-gray-500">
                  付款條件
                </p>
                <p className="whitespace-pre-wrap text-sm text-gray-700">
                  {paymentTerms}
                </p>
              </div>
            )}
            {notes && (
              <div>
                <p className="mb-1 text-[10px] tracking-wide text-gray-500">
                  備註
                </p>
                <p className="whitespace-pre-wrap text-sm text-gray-700">
                  {notes}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
})
