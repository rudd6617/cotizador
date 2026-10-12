import { test } from "node:test"
import assert from "node:assert/strict"
import type { ClientInfo, Quotation, QuotationRecord } from "../src/types/quotation.ts"
import { formatQuotationNumber } from "../src/lib/format.ts"
import { createApp } from "./app.ts"
import { DatabaseSync } from "node:sqlite"
import { insertClient, insertQuotation, listClients, migrate, openDb } from "./db.ts"

const COMPANY = {
  name: "測試公司",
  quoter: "王小明",
  phone: "02-1234",
  email: "a@b.c",
  address: "台北市",
  taxId: "12345678",
  bankName: "測試銀行 999",
  bankBranch: "測試分行",
  bankAccountName: "測試公司",
  bankAccountNumber: "000-111-222",
}
const CLIENT: ClientInfo = { company: "客戶甲", taxId: "87654321", address: "台北市一路 1 號" }

function setup() {
  const db = openDb(":memory:")
  const app = createApp({ db, now: () => new Date(2026, 9, 12, 14, 30, 52) })
  const call = (method: string, path: string, body?: unknown) =>
    app.request(`/api${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  return { call, db }
}

function quotationData(client: ClientInfo): Quotation {
  return {
    template: "modern",
    company: COMPANY,
    client,
    meta: { quotationNumber: "", date: "2026-10-12", currency: "TWD" },
    items: [{ id: "1", name: "設計", spec: "A4 雙面", quantity: 2, unit: "式", unitPrice: 1000 }],
    taxRate: 0.05,
    paymentTerms: "",
    notes: "",
    showPaymentTerms: true,
    showNotes: true,
    showAmountInWords: true,
  }
}

async function createClient(call: ReturnType<typeof setup>["call"]) {
  const res = await call("POST", "/clients", CLIENT)
  return ((await res.json()) as { id: number }).id
}

const NUMBER = "QT-20261012-143052"

function record(clientId: number, status: QuotationRecord["status"] = "draft", number = NUMBER): QuotationRecord {
  const data = quotationData(CLIENT)
  return { status, clientId, data: { ...data, meta: { ...data.meta, quotationNumber: number } } }
}

test("報價編號格式為 QT-YYYYMMDD-HHmmss（本地時間）", () => {
  assert.equal(formatQuotationNumber(new Date(2026, 0, 5, 9, 8, 7)), "QT-20260105-090807")
})

test("新增報價單沿用開單當下產生的編號", async () => {
  const { call } = setup()
  const clientId = await createClient(call)
  const res = await call("POST", "/quotations", record(clientId, "draft", "QT-20261012-090000"))
  assert.equal(res.status, 201)
  assert.equal((await call("GET", "/quotations/QT-20261012-090000")).status, 200)
})

test("編號格式不正確或沒給時拒收", async () => {
  const { call } = setup()
  const clientId = await createClient(call)
  assert.equal((await call("POST", "/quotations", record(clientId, "draft", "QT-FAKE"))).status, 400)
  assert.equal((await call("POST", "/quotations", record(clientId, "draft", ""))).status, 400)
})

test("編號重複時回 409，不覆蓋第一張", async () => {
  const { call } = setup()
  const clientId = await createClient(call)
  await call("POST", "/quotations", record(clientId))
  const res = await call("POST", "/quotations", record(clientId, "sent"))
  assert.equal(res.status, 409)
  const first = (await (await call("GET", "/quotations/QT-20261012-143052")).json()) as QuotationRecord
  assert.equal(first.status, "draft")
})

test("只有草稿可以刪除", async () => {
  const { call } = setup()
  const clientId = await createClient(call)
  await call("POST", "/quotations", record(clientId, "sent"))
  await call("POST", "/quotations", record(clientId, "draft", "QT-20261012-150000"))

  assert.equal((await call("DELETE", "/quotations/QT-20261012-143052")).status, 409)
  assert.equal((await call("DELETE", "/quotations/QT-20261012-150000")).status, 204)
  assert.equal((await call("GET", "/quotations/QT-20261012-150000")).status, 404)
})

test("已有報價單的客戶不能刪除；沒有的可以", async () => {
  const { call } = setup()
  const used = await createClient(call)
  const unused = await createClient(call)
  await call("POST", "/quotations", record(used))

  assert.equal((await call("DELETE", `/clients/${used}`)).status, 409)
  assert.equal((await call("DELETE", `/clients/${unused}`)).status, 204)
})

test("修改客戶資料不影響已存報價單的客戶快照", async () => {
  const { call } = setup()
  const clientId = await createClient(call)
  await call("POST", "/quotations", record(clientId))
  await call("PUT", `/clients/${clientId}`, { ...CLIENT, address: "新地址" })

  const saved = (await (await call("GET", "/quotations/QT-20261012-143052")).json()) as QuotationRecord
  assert.equal(saved.data.client.address, "台北市一路 1 號")
})

test("修改報價單不能改掉編號", async () => {
  const { call } = setup()
  const clientId = await createClient(call)
  await call("POST", "/quotations", record(clientId))
  const edited = record(clientId, "won")
  edited.data.meta.quotationNumber = "QT-FAKE"
  await call("PUT", "/quotations/QT-20261012-143052", edited)

  const saved = (await (await call("GET", "/quotations/QT-20261012-143052")).json()) as QuotationRecord
  assert.equal(saved.status, "won")
  assert.equal(saved.data.meta.quotationNumber, "QT-20261012-143052")
})

test("列表可依關鍵字與狀態篩選，並算出含稅總計", async () => {
  const { call } = setup()
  const clientId = await createClient(call)
  await call("POST", "/quotations", record(clientId, "draft"))
  await call("POST", "/quotations", record(clientId, "won", "QT-20261013-100000"))

  const won = (await (await call("GET", "/quotations?status=won")).json()) as { number: string; total: number }[]
  assert.deepEqual(won.map((q) => q.number), ["QT-20261013-100000"])
  assert.equal(won[0].total, 2100)

  const byName = (await (await call("GET", "/quotations?q=客戶甲")).json()) as unknown[]
  assert.equal(byName.length, 2)
  const none = (await (await call("GET", "/quotations?q=不存在")).json()) as unknown[]
  assert.equal(none.length, 0)
})

test("沒選客戶不能存", async () => {
  const { call } = setup()
  const res = await call("POST", "/quotations", { ...record(1), clientId: undefined })
  assert.equal(res.status, 400)
})

test("公司資料尚未設定時回傳空白資料", async () => {
  const { call } = setup()
  const company = await (await call("GET", "/company")).json()
  assert.deepEqual(company, { name: "", quoter: "", phone: "", email: "", address: "", taxId: "" })
})

test("公司資料存了再讀要一致", async () => {
  const { call } = setup()
  const res = await call("PUT", "/company", COMPANY)
  assert.equal(res.status, 200)
  assert.deepEqual(await (await call("GET", "/company")).json(), COMPANY)
})

test("修改公司資料不影響已存報價單的公司快照", async () => {
  const { call } = setup()
  const clientId = await createClient(call)
  await call("POST", "/quotations", record(clientId))
  await call("PUT", "/company", { ...COMPANY, name: "新公司名" })

  const saved = (await (await call("GET", "/quotations/QT-20261012-143052")).json()) as QuotationRecord
  assert.equal(saved.data.company.name, "測試公司")
})

test("公司資料缺必要欄位時拒收", async () => {
  const { call } = setup()
  const res = await call("PUT", "/company", { name: "測試公司" })
  assert.equal(res.status, 400)
})

test("版型不正確時拒收", async () => {
  const { call } = setup()
  const clientId = await createClient(call)
  const bad = record(clientId)
  ;(bad.data as { template: string }).template = "fancy"
  assert.equal((await call("POST", "/quotations", bad)).status, 400)
})

test("舊報價單沒有版型欄位時，讀出為 modern", async () => {
  const { call, db } = setup()
  const clientId = await createClient(call)
  const legacy: Partial<Quotation> = quotationData(CLIENT)
  delete legacy.template
  insertQuotation(db, "QT-OLD", { status: "sent", clientId, data: legacy as Quotation }, "2026-01-01T00:00:00Z")

  const saved = (await (await call("GET", "/quotations/QT-OLD")).json()) as QuotationRecord
  assert.equal(saved.data.template, "modern")
})

test("系統設定預設版型為 modern，可修改", async () => {
  const { call } = setup()
  assert.deepEqual(await (await call("GET", "/settings")).json(), { defaultTemplate: "modern" })
  assert.equal((await call("PUT", "/settings", { defaultTemplate: "classic" })).status, 200)
  assert.deepEqual(await (await call("GET", "/settings")).json(), { defaultTemplate: "classic" })
})

test("系統設定的版型不正確時拒收", async () => {
  const { call } = setup()
  assert.equal((await call("PUT", "/settings", { defaultTemplate: "fancy" })).status, 400)
})

test("舊報價單的品項說明讀出為品名，規格留空", async () => {
  const { call, db } = setup()
  const clientId = await createClient(call)
  const legacy = quotationData(CLIENT)
  const legacyItems = [{ id: "1", description: "舊說明", quantity: 1, unit: "式", unitPrice: 100 }]
  const data = { ...legacy, items: legacyItems } as unknown as Quotation
  insertQuotation(db, "QT-OLD", { status: "sent", clientId, data }, "2026-01-01T00:00:00Z")

  const saved = (await (await call("GET", "/quotations/QT-OLD")).json()) as QuotationRecord
  assert.deepEqual(saved.data.items, [{ id: "1", name: "舊說明", spec: "", quantity: 1, unit: "式", unitPrice: 100 }])
})

/** 寫入舊格式的報價單：拿掉兩個分開的開關，必要時放回舊的共用開關 */
function insertLegacyToggles(db: DatabaseSync, clientId: number, number: string, combined?: boolean) {
  const rest: Partial<Quotation> = quotationData(CLIENT)
  delete rest.showPaymentTerms
  delete rest.showNotes
  const data = combined === undefined ? rest : { ...rest, showTermsAndNotes: combined }
  insertQuotation(db, number, { status: "sent", clientId, data: data as unknown as Quotation }, "2026-01-01T00:00:00Z")
}

test("舊報價單沒有任何顯示開關時，付款條件與備註都顯示", async () => {
  const { call, db } = setup()
  const clientId = await createClient(call)
  insertLegacyToggles(db, clientId, "QT-OLD")

  const { data } = (await (await call("GET", "/quotations/QT-OLD")).json()) as QuotationRecord
  assert.deepEqual([data.showPaymentTerms, data.showNotes], [true, true])
})

test("舊報價單的共用開關拆成兩個開關，沿用原本的值", async () => {
  const { call, db } = setup()
  const clientId = await createClient(call)
  insertLegacyToggles(db, clientId, "QT-OFF", false)

  const { data } = (await (await call("GET", "/quotations/QT-OFF")).json()) as QuotationRecord
  assert.deepEqual([data.showPaymentTerms, data.showNotes], [false, false])
  assert.equal("showTermsAndNotes" in data, false)
})

test("顯示開關不是布林值時拒收", async () => {
  const { call } = setup()
  const clientId = await createClient(call)
  for (const key of ["showPaymentTerms", "showNotes", "showAmountInWords"]) {
    const bad = record(clientId)
    ;(bad.data as unknown as Record<string, unknown>)[key] = "yes"
    assert.equal((await call("POST", "/quotations", bad)).status, 400, key)
  }
})

test("客戶統編可存取", async () => {
  const { call } = setup()
  await createClient(call)
  const [client] = (await (await call("GET", "/clients")).json()) as ClientInfo[]
  assert.equal(client.taxId, "87654321")
})

test("舊資料庫的客戶表沒有統編欄位時，開啟時自動補上，既有客戶保留", () => {
  const db = new DatabaseSync(":memory:")
  db.exec(`CREATE TABLE clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT, company TEXT NOT NULL, contact_person TEXT,
    address TEXT NOT NULL, phone TEXT, email TEXT)`)
  db.exec(`INSERT INTO clients (company, address) VALUES ('舊客戶', '舊地址')`)

  migrate(db)
  migrate(db) // 重複執行不出錯
  insertClient(db, { company: "新客戶", taxId: "12345678", address: "新地址" })

  const clients = listClients(db)
  assert.deepEqual(
    clients.map((c) => [c.company, c.taxId]),
    [["新客戶", "12345678"], ["舊客戶", null]],
  )
})

test("舊報價單沒有大寫金額開關時，預設顯示", async () => {
  const { call, db } = setup()
  const clientId = await createClient(call)
  const legacy: Partial<Quotation> = quotationData(CLIENT)
  delete legacy.showAmountInWords
  insertQuotation(db, "QT-OLD", { status: "sent", clientId, data: legacy as Quotation }, "2026-01-01T00:00:00Z")

  const { data } = (await (await call("GET", "/quotations/QT-OLD")).json()) as QuotationRecord
  assert.equal(data.showAmountInWords, true)
})
