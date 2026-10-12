import { memo } from "react"
import type { Quotation } from "@/types/quotation"
import {
  amountInWords,
  calcLineAmount,
  calcSubtotal,
  calcTax,
  calcTotal,
  formatNumber,
  getCurrencySymbol,
} from "@/lib/format"
import { classicClientLines, classicCompanyLines, classicMetaLines, type LabeledLine } from "@/lib/templates"

interface Props {
  data: Quotation
}

const cell = "border border-gray-900 px-2.5 py-1.5"
const head = `${cell} bg-gray-100 text-left font-medium`

function Lines({ lines }: { lines: LabeledLine[] }) {
  return (
    <div className="flex flex-col gap-0.5">
      {lines.map((l) => (
        <div key={l.label}>
          {l.label}：{l.value}
        </div>
      ))}
    </div>
  )
}

// 全形空白留給客戶手寫年月日
const SIGN_DATE = "日期：\u3000\u3000\u3000年\u3000\u3000月\u3000\u3000日"

/** 傳統版型：公司在標題上方靠左、全框線表格、底部客戶簽章欄 */
export const QuotationPreviewClassic = memo(function QuotationPreviewClassic({ data }: Props) {
  const { company, client, meta, items, taxRate, paymentTerms, notes } = data
  const subtotal = calcSubtotal(items)
  const tax = calcTax(subtotal, taxRate)
  const total = calcTotal(subtotal, tax)
  const sym = getCurrencySymbol(meta.currency)
  const words = amountInWords(total, meta.currency)
  const companyLines = classicCompanyLines(company)

  return (
    <div
      className="mx-auto max-w-[210mm] bg-white text-xs text-gray-900 shadow-lg"
      style={{ fontFamily: "'Noto Sans TC', sans-serif" }}
    >
      <div className="flex flex-col gap-4 px-14 py-12">
        {/* 1. Company (left, above title) */}
        <div className="flex items-start gap-3">
          {company.logo && <img src={company.logo} alt="Logo" className="h-12 w-12 object-contain" />}
          <div className="flex flex-col gap-0.5">
            <span className="text-lg font-bold tracking-widest">{company.name}</span>
            {companyLines.map((l) => (
              <div key={l.label} className="text-[11px] text-gray-700">
                {l.label}：{l.value}
              </div>
            ))}
          </div>
        </div>

        {/* 2. Title */}
        <div className="flex flex-col items-center gap-1">
          <h1 className="pl-[0.6em] text-2xl font-bold tracking-[0.6em]">報價單</h1>
          <div className="h-[5px] w-36 border-y border-gray-900" />
        </div>

        {/* 3. Client (left) | Meta (right) */}
        <div className="flex justify-between gap-8">
          <Lines lines={classicClientLines(client)} />
          <Lines lines={classicMetaLines(meta, company.quoter)} />
        </div>

        {/* 4. Items + totals */}
        <table className="w-full border-collapse">
          <thead className="bg-gray-100 whitespace-nowrap">
            <tr>
              <th className={`${cell} w-10 text-center font-medium`}>項次</th>
              <th className={`${cell} text-left font-medium`}>品名</th>
              <th className={`${cell} text-left font-medium`}>規格</th>
              <th className={`${cell} w-12 text-center font-medium`}>數量</th>
              <th className={`${cell} w-11 text-center font-medium`}>單位</th>
              <th className={`${cell} w-24 text-right font-medium`}>單價</th>
              <th className={`${cell} w-28 text-right font-medium`}>金額</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.id}>
                <td className={`${cell} text-center`}>{i + 1}</td>
                <td className={cell}>{item.name}</td>
                <td className={cell}>{item.spec}</td>
                <td className={`${cell} text-right`}>{formatNumber(item.quantity)}</td>
                <td className={`${cell} text-center`}>{item.unit}</td>
                <td className={`${cell} text-right`}>
                  {sym} {formatNumber(item.unitPrice)}
                </td>
                <td className={`${cell} text-right`}>
                  {sym} {formatNumber(calcLineAmount(item))}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={7} className={`${cell} py-6 text-center text-gray-400`}>
                  尚未新增品項
                </td>
              </tr>
            )}
            <tr>
              <td colSpan={5} rowSpan={3} className={`${cell} align-top text-[11px] text-gray-700`}>
                {words}
              </td>
              <th className={`${cell} text-right font-medium`}>小計</th>
              <td className={`${cell} text-right`}>
                {sym} {formatNumber(subtotal)}
              </td>
            </tr>
            <tr>
              <th className={`${cell} text-right font-medium`}>營業稅 {(taxRate * 100).toFixed(0)}%</th>
              <td className={`${cell} text-right`}>
                {sym} {formatNumber(tax)}
              </td>
            </tr>
            <tr>
              <th className={`${cell} text-right font-bold`}>總計</th>
              <td className={`${cell} text-right font-bold`}>
                {sym} {formatNumber(total)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* 5. Payment terms & notes */}
        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <th className={`${head} w-20 align-top`}>付款條件</th>
              <td className={`${cell} h-9 align-top whitespace-pre-wrap`}>{paymentTerms}</td>
            </tr>
            <tr>
              <th className={`${head} align-top`}>備註</th>
              <td className={`${cell} h-9 align-top whitespace-pre-wrap`}>{notes}</td>
            </tr>
          </tbody>
        </table>

        {/* 6. Client signature */}
        <div className="mt-4 flex justify-end">
          <table className="w-72 border-collapse">
            <tbody>
              <tr>
                <th className={`${cell} bg-gray-100 font-medium`}>客戶確認簽章</th>
              </tr>
              <tr>
                <td className={`${cell} h-24`} />
              </tr>
              <tr>
                <td className={cell}>{SIGN_DATE}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
})
