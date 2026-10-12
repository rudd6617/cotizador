import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { StatusBadge } from "@/components/status-badge"
import { api } from "@/lib/api"
import { formatNumber, getCurrencySymbol } from "@/lib/format"
import { downloadQuotationPdf } from "@/lib/pdf"
import { href } from "@/lib/route"
import { STATUS_LABELS } from "@/lib/status"
import { QUOTATION_STATUSES, type QuotationStatus, type QuotationSummary } from "@/types/quotation"

const STATUS_FILTER_ITEMS = [
  { value: "", label: "全部" },
  ...QUOTATION_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] })),
]

export function QuotationList() {
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<QuotationStatus | "">("")
  const [rows, setRows] = useState<QuotationSummary[] | null>(null)
  const [downloading, setDownloading] = useState<string | null>(null)

  useEffect(() => {
    let stale = false
    api.listQuotations({ q, status }).then(
      (data) => !stale && setRows(data),
      (err: Error) => alert(err.message),
    )
    return () => {
      stale = true
    }
  }, [q, status])

  async function handleDownload(number: string) {
    setDownloading(number)
    try {
      const record = await api.getQuotation(number)
      await downloadQuotationPdf(record.data)
    } catch (err) {
      console.error(err)
      alert("PDF 產生失敗，請稍後再試")
    } finally {
      setDownloading(null)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800">報價單</h1>
        <Button render={<a href={href.newQuotation()} />} nativeButton={false} size="lg">
          ＋ 新增報價單
        </Button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="min-w-64 flex-1 space-y-1">
          <Label htmlFor="quotation-search">搜尋</Label>
          <Input
            id="quotation-search"
            type="search"
            placeholder="編號、客戶名稱"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <div className="w-48 space-y-1">
          <Label>狀態</Label>
          <Select
            items={STATUS_FILTER_ITEMS}
            value={status}
            onValueChange={(val) => setStatus((val ?? "") as QuotationStatus | "")}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTER_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3 font-medium">報價編號</th>
              <th className="px-4 py-3 font-medium">客戶</th>
              <th className="px-4 py-3 font-medium">報價日期</th>
              <th className="px-4 py-3 text-right font-medium">總計</th>
              <th className="px-4 py-3 font-medium">狀態</th>
              <th className="px-4 py-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {rows?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  {q || status ? "沒有符合條件的報價單" : "還沒有報價單，點「＋ 新增報價單」開始"}
                </td>
              </tr>
            )}
            {rows?.map((r) => (
              <tr key={r.number} className="border-t border-gray-200">
                <td className="px-4 py-3.5 font-mono text-[13px]">
                  <a href={href.quotation(r.number)} className="text-slate-800 underline-offset-2 hover:underline">
                    {r.number}
                  </a>
                </td>
                <td className="px-4 py-3.5">{r.clientName}</td>
                <td className="px-4 py-3.5 text-gray-600">{r.date}</td>
                <td className="px-4 py-3.5 text-right tabular-nums">
                  {getCurrencySymbol(r.currency)} {formatNumber(r.total)}
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={r.status} />
                </td>
                <td className="space-x-1.5 px-4 py-3.5 text-right whitespace-nowrap">
                  <Button variant="outline" render={<a href={href.copyQuotation(r.number)} />} nativeButton={false}>
                    複製
                  </Button>
                  <Button
                    variant="outline"
                    disabled={downloading === r.number}
                    onClick={() => handleDownload(r.number)}
                  >
                    {downloading === r.number ? "產生中..." : "下載 PDF"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
