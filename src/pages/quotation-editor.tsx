import { useEffect, useState, type ComponentType } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { QuotationForm } from "@/components/quotation-form"
import { QuotationPreview } from "@/components/quotation-preview"
import { QuotationPreviewClassic } from "@/components/quotation-preview-classic"
import { StatusBadge } from "@/components/status-badge"
import { api } from "@/lib/api"
import { formatQuotationNumber } from "@/lib/format"
import { downloadQuotationPdf } from "@/lib/pdf"
import { href, navigate } from "@/lib/route"
import { STATUS_LABELS } from "@/lib/status"
import { TEMPLATE_ITEMS } from "@/lib/templates"
import {
  QUOTATION_STATUSES,
  type Client,
  type CompanyInfo,
  type Quotation,
  type QuotationStatus,
  type QuotationTemplate,
} from "@/types/quotation"

interface Props {
  number: string | null
  copyFrom: string | null
  company: CompanyInfo
  defaultTemplate: QuotationTemplate
}

interface Draft {
  status: QuotationStatus
  clientId: number | null
  data: Quotation
}

const STATUS_ITEMS = QUOTATION_STATUSES.map((s) => ({ value: s, label: STATUS_LABELS[s] }))

const PREVIEWS: Record<QuotationTemplate, ComponentType<{ data: Quotation }>> = {
  modern: QuotationPreview,
  classic: QuotationPreviewClassic,
}

/** 開單當下：產生報價編號，日期設為今天 */
function openedNow() {
  const now = new Date()
  return { quotationNumber: formatQuotationNumber(now), date: now.toLocaleDateString("sv-SE") }
}

function createDraft(company: CompanyInfo, template: QuotationTemplate): Draft {
  return {
    status: "draft",
    clientId: null,
    data: {
      template,
      company,
      client: { company: "", address: "" },
      meta: { ...openedNow(), currency: "TWD" },
      items: [],
      taxRate: 0.05,
      paymentTerms: "",
      notes: "",
    },
  }
}

/** 複製成新單：重新產生編號、日期改今天、狀態回草稿、公司資訊用目前的設定 */
function copyDraft(source: Draft, company: CompanyInfo): Draft {
  return {
    status: "draft",
    clientId: source.clientId,
    data: { ...source.data, company, meta: { ...source.data.meta, ...openedNow() } },
  }
}

async function loadDraft({ number, copyFrom, company, defaultTemplate }: Props): Promise<Draft> {
  if (number) return api.getQuotation(number)
  if (copyFrom) return copyDraft(await api.getQuotation(copyFrom), company)
  return createDraft(company, defaultTemplate)
}

export function QuotationEditor(props: Props) {
  const { number } = props
  const [draft, setDraft] = useState<Draft | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [busy, setBusy] = useState<"save" | "download" | "delete" | null>(null)

  useEffect(() => {
    loadDraft(props).then(setDraft, (err: Error) => alert(err.message))
    api.listClients().then(setClients, (err: Error) => alert(err.message))
    // 只在第一次載入；換頁時 App 以 key 重新掛載本元件
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!draft) return <p className="p-8 text-gray-500">載入中...</p>

  function selectClient(client: Client) {
    const { id, ...info } = client
    setDraft((d) => d && { ...d, clientId: id, data: { ...d.data, client: info } })
  }

  async function run(action: NonNullable<typeof busy>, fn: () => Promise<void>) {
    setBusy(action)
    try {
      await fn()
    } catch (err) {
      console.error(err)
      alert((err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  function handleSave(d: Draft & { clientId: number }) {
    return run("save", async () => {
      if (!number) {
        const saved = await api.createQuotation(d)
        navigate(href.quotation(saved.data.meta.quotationNumber))
        return
      }
      setDraft(await api.updateQuotation(number, d))
    })
  }

  function handleDelete(n: string) {
    if (!confirm(`確定刪除草稿 ${n}？刪除後無法復原。`)) return
    return run("delete", async () => {
      await api.deleteQuotation(n)
      navigate(href.quotations())
    })
  }

  const { clientId } = draft
  const Preview = PREVIEWS[draft.data.template]

  return (
    <main className="mx-auto max-w-[1440px] px-6 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <a href={href.quotations()} className="py-2 text-sm text-slate-700 hover:text-slate-900">
            ← 返回列表
          </a>
          <h1 className="font-mono text-xl font-bold text-slate-800">{draft.data.meta.quotationNumber}</h1>
          {!number && <span className="text-sm text-gray-500">（未儲存）</span>}
          <StatusBadge status={draft.status} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            items={STATUS_ITEMS}
            value={draft.status}
            onValueChange={(val) => val && setDraft({ ...draft, status: val as QuotationStatus })}
          >
            <SelectTrigger aria-label="狀態" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            items={TEMPLATE_ITEMS}
            value={draft.data.template}
            onValueChange={(val) =>
              val && setDraft({ ...draft, data: { ...draft.data, template: val as QuotationTemplate } })
            }
          >
            <SelectTrigger aria-label="版型" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TEMPLATE_ITEMS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}版型
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {number && draft.status === "draft" && (
            <Button variant="destructive" disabled={busy !== null} onClick={() => handleDelete(number)}>
              刪除
            </Button>
          )}
          <Button
            variant="outline"
            disabled={busy !== null}
            onClick={() => run("download", () => downloadQuotationPdf(draft.data))}
          >
            {busy === "download" ? "產生中..." : "下載 PDF"}
          </Button>
          <Button
            disabled={busy !== null || clientId === null}
            title={clientId === null ? "請先選擇客戶" : undefined}
            onClick={() => clientId !== null && handleSave({ ...draft, clientId })}
          >
            {busy === "save" ? "儲存中..." : "儲存"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-start gap-6">
        <div className="min-w-0 flex-[999_1_640px]">
          <Preview data={draft.data} />
        </div>
        <div className="min-w-0 flex-[1_1_420px] rounded-lg border border-gray-200 bg-white p-4">
          <QuotationForm
            value={draft.data}
            onChange={(data) => setDraft({ ...draft, data })}
            clients={clients}
            clientId={clientId}
            onSelectClient={selectClient}
          />
        </div>
      </div>
    </main>
  )
}
