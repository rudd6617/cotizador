"use client"

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
import type { Quotation, CompanyInfo, ClientInfo, QuotationMeta, LineItem } from "@/types/quotation"

interface Props {
  value: Quotation
  onChange: (q: Quotation) => void
}

export function QuotationForm({ value, onChange }: Props) {
  function updateCompany(field: keyof CompanyInfo, val: string) {
    onChange({ ...value, company: { ...value.company, [field]: val } })
  }

  function updateClient(field: keyof ClientInfo, val: string) {
    onChange({ ...value, client: { ...value.client, [field]: val } })
  }

  function updateMeta(field: keyof QuotationMeta, val: string) {
    onChange({ ...value, meta: { ...value.meta, [field]: val } })
  }

  function addItem() {
    const item: LineItem = {
      id: crypto.randomUUID(),
      description: "",
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

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => updateCompany("logo", reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-6">
      {/* Contact Info */}
      <Card>
        <CardHeader>
          <CardTitle>聯絡資訊</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>聯絡人</Label>
              <Input
                value={value.company.quoter}
                onChange={(e) => updateCompany("quoter", e.target.value)}
                placeholder="您的姓名"
              />
            </div>
            <div className="space-y-1">
              <Label>公司名稱</Label>
              <Input
                value={value.company.name ?? ""}
                onChange={(e) => updateCompany("name", e.target.value)}
                placeholder="ABC 科技有限公司"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>聯絡電話</Label>
              <Input
                value={value.company.phone}
                onChange={(e) => updateCompany("phone", e.target.value)}
                placeholder="02-1234-5678"
              />
            </div>
            <div className="space-y-1">
              <Label>聯絡信箱</Label>
              <Input
                value={value.company.email}
                onChange={(e) => updateCompany("email", e.target.value)}
                placeholder="contact@company.com"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>地址</Label>
              <Input
                value={value.company.address ?? ""}
                onChange={(e) => updateCompany("address", e.target.value)}
                placeholder="台北市信義區信義路五段 7 號"
              />
            </div>
            <div className="space-y-1">
              <Label>統一編號</Label>
              <Input
                value={value.company.taxId ?? ""}
                onChange={(e) => updateCompany("taxId", e.target.value)}
                placeholder="12345678"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>Logo</Label>
            <Input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
            />
          </div>
        </CardContent>
      </Card>

      {/* Client */}
      <Card>
        <CardHeader>
          <CardTitle>客戶</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>客戶名稱</Label>
              <Input
                value={value.client.company}
                onChange={(e) => updateClient("company", e.target.value)}
                placeholder="客戶名稱"
              />
            </div>
            <div className="space-y-1">
              <Label>聯絡人</Label>
              <Input
                value={value.client.contactPerson ?? ""}
                onChange={(e) =>
                  updateClient("contactPerson", e.target.value)
                }
                placeholder="王大明"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label>地址</Label>
            <Input
              value={value.client.address}
              onChange={(e) => updateClient("address", e.target.value)}
              placeholder="客戶地址"
            />
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
        </CardContent>
      </Card>

      {/* Quotation Meta */}
      <Card>
        <CardHeader>
          <CardTitle>報價資訊</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>報價編號</Label>
              <Input
                value={value.meta.quotationNumber}
                onChange={(e) =>
                  updateMeta("quotationNumber", e.target.value)
                }
              />
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>幣別</Label>
              <Select
                value={value.meta.currency}
                onValueChange={(val) => {
                  if (val) updateMeta("currency", val)
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
            <div
              key={item.id}
              className="grid grid-cols-12 items-end gap-2"
            >
              <div className="col-span-5">
                {index === 0 && (
                  <Label className="text-xs">品項說明</Label>
                )}
                <Input
                  value={item.description}
                  onChange={(e) =>
                    updateItem(item.id, "description", e.target.value)
                  }
                  placeholder="品項說明"
                />
              </div>
              <div className="col-span-2">
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
              <div className="col-span-1">
                {index === 0 && <Label className="text-xs">單位</Label>}
                <Input
                  value={item.unit}
                  onChange={(e) =>
                    updateItem(item.id, "unit", e.target.value)
                  }
                />
              </div>
              <div className="col-span-3">
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
          ))}
        </CardContent>
      </Card>

      {/* Payment Terms & Notes */}
      <Card>
        <CardHeader>
          <CardTitle>付款條件與備註</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>付款條件</Label>
            <Textarea
              value={value.paymentTerms}
              onChange={(e) =>
                onChange({ ...value, paymentTerms: e.target.value })
              }
              placeholder="例：簽約後 30 天內付款"
              rows={3}
            />
          </div>
          <div className="space-y-1">
            <Label>備註</Label>
            <Textarea
              value={value.notes}
              onChange={(e) => onChange({ ...value, notes: e.target.value })}
              placeholder="其他說明事項"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
