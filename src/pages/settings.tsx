import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { api } from "@/lib/api"
import { TEMPLATE_ITEMS } from "@/lib/templates"
import type { AppSettings, CompanyInfo, QuotationTemplate } from "@/types/quotation"

interface Props {
  company: CompanyInfo
  settings: AppSettings
  onCompanySaved: (c: CompanyInfo) => void
  onSettingsSaved: (s: AppSettings) => void
}

const MAX_LOGO_BYTES = 512 * 1024

type TextField = { key: keyof Omit<CompanyInfo, "logo">; label: string }

const FIELDS: TextField[] = [
  { key: "name", label: "公司名稱" },
  { key: "taxId", label: "統一編號" },
  { key: "phone", label: "電話" },
  { key: "email", label: "Email" },
  { key: "quoter", label: "預設報價人" },
  { key: "address", label: "地址" },
]

const BANK_FIELDS: TextField[] = [
  { key: "bankName", label: "銀行（含代碼）" },
  { key: "bankBranch", label: "分行" },
  { key: "bankAccountName", label: "戶名" },
  { key: "bankAccountNumber", label: "帳號" },
]

export function Settings({ company, settings, onCompanySaved, onSettingsSaved }: Props) {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-5 px-6 py-7">
      <h1 className="text-2xl font-bold text-slate-800">設定</h1>
      <CompanyCard company={company} onSaved={onCompanySaved} />
      <DefaultsCard settings={settings} onSaved={onSettingsSaved} />
    </main>
  )
}

function DefaultsCard({ settings, onSaved }: { settings: AppSettings; onSaved: (s: AppSettings) => void }) {
  const [template, setTemplate] = useState<QuotationTemplate>(settings.defaultTemplate)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      onSaved(await api.updateSettings({ defaultTemplate: template }))
      setSavedAt(new Date().toLocaleTimeString("zh-TW"))
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>報價單預設</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="max-w-xs space-y-1">
            <Label>新報價單預設版型</Label>
            <Select
              items={TEMPLATE_ITEMS}
              value={template}
              onValueChange={(val) => {
                if (!val) return
                setTemplate(val as QuotationTemplate)
                setSavedAt(null)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TEMPLATE_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">每張報價單可在編輯頁另選版型；修改預設不影響已存的報價單。</p>
          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "儲存中..." : "儲存"}
            </Button>
            {savedAt && <span className="text-sm text-gray-600">已於 {savedAt} 儲存</span>}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function CompanyCard({ company, onSaved }: { company: CompanyInfo; onSaved: (c: CompanyInfo) => void }) {
  const [form, setForm] = useState<CompanyInfo>(company)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  function update(patch: Partial<CompanyInfo>) {
    setForm({ ...form, ...patch })
    setSavedAt(null)
  }

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > MAX_LOGO_BYTES) {
      alert("Logo 檔案不可超過 512 KB")
      e.target.value = ""
      return
    }
    const reader = new FileReader()
    reader.onload = () => update({ logo: reader.result as string })
    reader.readAsDataURL(file)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      onSaved(await api.updateCompany(form))
      setSavedAt(new Date().toLocaleTimeString("zh-TW"))
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  function renderField(f: TextField) {
    return (
      <div key={f.key} className={f.key === "address" ? "space-y-1 sm:col-span-2" : "space-y-1"}>
        <Label htmlFor={`company-${f.key}`}>{f.label}</Label>
        <Input
          id={`company-${f.key}`}
          value={form[f.key] ?? ""}
          onChange={(e) => update({ [f.key]: e.target.value })}
        />
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>公司資料</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map(renderField)}

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="company-logo">Logo</Label>
            <div className="flex flex-wrap items-center gap-4">
              {form.logo && (
                <img src={form.logo} alt="目前的 logo" className="h-16 w-16 rounded border border-gray-200 object-contain p-1" />
              )}
              <Input id="company-logo" type="file" accept="image/*" onChange={handleLogoUpload} className="max-w-xs" />
              {form.logo && (
                <Button type="button" variant="outline" onClick={() => update({ logo: undefined })}>
                  移除 logo
                </Button>
              )}
            </div>
          </div>

          <h3 className="mt-2 border-t border-gray-200 pt-4 text-sm font-medium sm:col-span-2">匯款資料</h3>
          {BANK_FIELDS.map(renderField)}

          <p className="text-sm text-muted-foreground sm:col-span-2">
            修改後只影響之後新增的報價單；已存的報價單保留當時的公司資料。
          </p>

          <div className="flex items-center gap-3 sm:col-span-2">
            <Button type="submit" disabled={saving}>
              {saving ? "儲存中..." : "儲存"}
            </Button>
            {savedAt && <span className="text-sm text-gray-600">已於 {savedAt} 儲存</span>}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
