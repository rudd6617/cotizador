import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import type { ClientInfo, ClientWithCount } from "@/types/quotation"

/** id 為 null 表示新增 */
interface Editing {
  id: number | null
  info: ClientInfo
}

const EMPTY_CLIENT: ClientInfo = { company: "", contactPerson: "", address: "", phone: "", email: "" }

const FIELDS: { key: keyof ClientInfo; label: string; required?: boolean }[] = [
  { key: "company", label: "公司名稱", required: true },
  { key: "contactPerson", label: "聯絡人" },
  { key: "phone", label: "電話" },
  { key: "email", label: "Email" },
  { key: "address", label: "地址" },
]

export function ClientList() {
  const [clients, setClients] = useState<ClientWithCount[] | null>(null)
  const [q, setQ] = useState("")
  const [editing, setEditing] = useState<Editing | null>(null)
  const [saving, setSaving] = useState(false)

  function reload() {
    api.listClients().then(setClients, (err: Error) => alert(err.message))
  }

  useEffect(reload, [])

  async function handleSave(e: React.FormEvent, { id, info }: Editing) {
    e.preventDefault()
    setSaving(true)
    try {
      await (id === null ? api.createClient(info) : api.updateClient(id, info))
      setEditing(null)
      reload()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(c: ClientWithCount) {
    if (!confirm(`確定刪除客戶「${c.company}」？`)) return
    try {
      await api.deleteClient(c.id)
      reload()
    } catch (err) {
      alert((err as Error).message)
    }
  }

  const keyword = q.trim().toLowerCase()
  const visible = clients?.filter((c) =>
    [c.company, c.contactPerson].some((v) => v?.toLowerCase().includes(keyword)),
  )

  return (
    <main className="mx-auto max-w-6xl px-6 py-7">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-slate-800">客戶</h1>
        <Button size="lg" onClick={() => setEditing({ id: null, info: EMPTY_CLIENT })}>
          ＋ 新增客戶
        </Button>
      </div>

      {editing && (
        <Card className="mb-5">
          <CardHeader>
            <CardTitle>{editing.id === null ? "新增客戶" : "編輯客戶"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => handleSave(e, editing)} className="grid gap-4 sm:grid-cols-2">
              {FIELDS.map((f) => (
                <div key={f.key} className={f.key === "address" ? "space-y-1 sm:col-span-2" : "space-y-1"}>
                  <Label htmlFor={`client-${f.key}`}>{f.label}</Label>
                  <Input
                    id={`client-${f.key}`}
                    required={f.required}
                    value={editing.info[f.key] ?? ""}
                    onChange={(e) => setEditing({ ...editing, info: { ...editing.info, [f.key]: e.target.value } })}
                  />
                </div>
              ))}
              <div className="flex gap-2 sm:col-span-2">
                <Button type="submit" disabled={saving}>
                  {saving ? "儲存中..." : "儲存"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  取消
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="mb-4 max-w-sm space-y-1">
        <Label htmlFor="client-search">搜尋</Label>
        <Input
          id="client-search"
          type="search"
          placeholder="公司名稱、聯絡人"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-3 font-medium">公司名稱</th>
              <th className="px-4 py-3 font-medium">聯絡人</th>
              <th className="px-4 py-3 font-medium">電話</th>
              <th className="px-4 py-3 font-medium">地址</th>
              <th className="px-4 py-3 text-right font-medium">報價單數</th>
              <th className="px-4 py-3 text-right font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {visible?.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                  {keyword ? "沒有符合條件的客戶" : "還沒有客戶，點「＋ 新增客戶」開始"}
                </td>
              </tr>
            )}
            {visible?.map((c) => (
              <tr key={c.id} className="border-t border-gray-200">
                <td className="px-4 py-3.5 font-medium">{c.company}</td>
                <td className="px-4 py-3.5">{c.contactPerson}</td>
                <td className="px-4 py-3.5 text-gray-600">{c.phone}</td>
                <td className="px-4 py-3.5 text-gray-600">{c.address}</td>
                <td className="px-4 py-3.5 text-right tabular-nums">{c.quotationCount}</td>
                <td className="space-x-1.5 px-4 py-3.5 text-right whitespace-nowrap">
                  <Button variant="outline" onClick={() => setEditing({ id: c.id, info: c })}>
                    編輯
                  </Button>
                  {c.quotationCount === 0 && (
                    <Button variant="destructive" onClick={() => handleDelete(c)}>
                      刪除
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}
