import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Quotation, Client, ClientInfo, QuotationMeta, LineItem, Currency } from "@/types/quotation"

interface Props {
  value: Quotation
  onChange: (q: Quotation) => void
  clients: Client[]
  clientId: number | null
  /** 選客戶時把客戶資料複製進報價單（客戶快照，ADR-0001） */
  onSelectClient: (client: Client) => void
}

export function QuotationForm({ value, onChange, clients, clientId, onSelectClient }: Props) {
  const clientItems = clients.map((c) => ({ value: String(c.id), label: c.company }))

  function updateClient(field: keyof ClientInfo, val: string) {
    onChange({ ...value, client: { ...value.client, [field]: val } })
  }

  function updateMeta(field: keyof QuotationMeta, val: string) {
    onChange({ ...value, meta: { ...value.meta, [field]: val } })
  }

  function addItem() {
    const item: LineItem = {
      id: crypto.randomUUID(),
      name: "",
      spec: "",
      quantity: 1,
      unit: "式",
      unitPrice: 0,
    }
    onChange({ ...value, items: [...value.items, item] })
  }

  function removeItem(id: string) {
    onChange({ ...value, items: value.items.filter((i) => i.id !== id) })
  }

  function updateItem(
    id: string,
    field: keyof LineItem,
    val: string | number
  ) {
    onChange({
      ...value,
      items: value.items.map((item) =>
        item.id === id ? { ...item, [field]: val } : item
      ),
    })
  }

  return (
    <div className="space-y-6">
      {/* Quotation Number & Date */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label>報價編號</Label>
          <Input value={value.meta.quotationNumber} readOnly disabled />
        </div>
        <div className="space-y-1">
          <Label>報價日期</Label>
          <Input
            type="date"
            value={value.meta.date}
            onChange={(e) => updateMeta("date", e.target.value)}
          />
        </div>
      </div>

      {/* Client */}
      <Card>
        <CardHeader>
          <CardTitle>客戶</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>選擇客戶</Label>
            <Select
              items={clientItems}
              value={clientId === null ? null : String(clientId)}
              onValueChange={(val) => {
                const client = clients.find((c) => String(c.id) === val)
                if (client) onSelectClient(client)
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={clients.length ? "請選擇" : "尚無客戶，請先到「客戶」新增"} />
              </SelectTrigger>
              <SelectContent>
                {clientItems.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              下方欄位是這張報價單自己的副本，修改不會影響客戶資料。
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>客戶名稱</Label>
              <Input
                value={value.client.company}
                onChange={(e) => updateClient("company", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>聯絡人</Label>
              <Input
                value={value.client.contactPerson ?? ""}
                onChange={(e) =>
                  updateClient("contactPerson", e.target.value)
                }

              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>電話</Label>
              <Input
                value={value.client.phone ?? ""}
                onChange={(e) => updateClient("phone", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                value={value.client.email ?? ""}
                onChange={(e) => updateClient("email", e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>地址</Label>
            <Input
              value={value.client.address}
              onChange={(e) => updateClient("address", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader>
          <CardTitle>報價品項</CardTitle>
          <CardAction>
            <Button onClick={addItem} variant="outline" size="sm">
              + 新增品項
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="space-y-3">
          {value.items.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              尚未新增品項，點擊「+ 新增品項」開始
            </p>
          )}
          {value.items.map((item, index) => (
            <div key={item.id} className="space-y-2 border-b border-gray-100 pb-3 last:border-0">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  {index === 0 && <Label className="text-xs">品名</Label>}
                  <Input
                    value={item.name}
                    onChange={(e) => updateItem(item.id, "name", e.target.value)}
                  />
                </div>
                <div>
                  {index === 0 && <Label className="text-xs">規格</Label>}
                  <Input
                    value={item.spec}
                    onChange={(e) => updateItem(item.id, "spec", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid grid-cols-12 items-end gap-2">
                <div className="col-span-3">
                  {index === 0 && <Label className="text-xs">數量</Label>}
                  <Input
                    type="number"
                    min={0}
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(
                        item.id,
                        "quantity",
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>
                <div className="col-span-3">
                  {index === 0 && <Label className="text-xs">單位</Label>}
                  <Input
                    value={item.unit}
                    onChange={(e) =>
                      updateItem(item.id, "unit", e.target.value)
                    }
                  />
                </div>
                <div className="col-span-5">
                  {index === 0 && <Label className="text-xs">單價</Label>}
                  <Input
                    type="number"
                    min={0}
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(
                        item.id,
                        "unitPrice",
                        parseFloat(e.target.value) || 0
                      )
                    }
                  />
                </div>
                <div className="col-span-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(item.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    ✕
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Payment Terms & Notes */}
      <Card>
        <CardHeader>
          <CardTitle>付款條件與備註</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>幣別</Label>
              <Select
                value={value.meta.currency}
                onValueChange={(val) => {
                  if (val) updateMeta("currency", val as Currency)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TWD">TWD (新台幣)</SelectItem>
                  <SelectItem value="USD">USD (美元)</SelectItem>
                  <SelectItem value="EUR">EUR (歐元)</SelectItem>
                  <SelectItem value="JPY">JPY (日圓)</SelectItem>
                  <SelectItem value="CNY">CNY (人民幣)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>稅率 (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={value.taxRate * 100}
                onChange={(e) =>
                  onChange({
                    ...value,
                    taxRate: (parseFloat(e.target.value) || 0) / 100,
                  })
                }
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>付款條件</Label>
            <Textarea
              value={value.paymentTerms}
              onChange={(e) =>
                onChange({ ...value, paymentTerms: e.target.value })
              }
              rows={3}
            />
          </div>
          <div className="space-y-1">
            <Label>備註</Label>
            <Textarea
              value={value.notes}
              onChange={(e) => onChange({ ...value, notes: e.target.value })}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
