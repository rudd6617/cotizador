import { test } from "node:test"
import assert from "node:assert/strict"
import type { ClientInfo, Quotation, QuotationRecord } from "../src/types/quotation.ts"
import { createApp, formatQuotationNumber } from "./app.ts"
import { openDb } from "./db.ts"

const COMPANY = { name: "測試公司", quoter: "王小明", phone: "02-1234", email: "a@b.c", address: "台北市", taxId: "12345678" }
const CLIENT: ClientInfo = { company: "客戶甲", address: "台北市一路 1 號" }

function setup(now = new Date(2026, 9, 12, 14, 30, 52)) {
  let current = now
  const app = createApp({ db: openDb(":memory:"), now: () => current })
  const call = (method: string, path: string, body?: unknown) =>
    app.request(`/api${path}`, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  return { call, setNow: (d: Date) => (current = d) }
}

function quotationData(client: ClientInfo): Quotation {
  return {
    company: COMPANY,
    client,
    meta: { quotationNumber: "", date: "2026-10-12", currency: "TWD" },
    items: [{ id: "1", description: "設計", quantity: 2, unit: "式", unitPrice: 1000 }],
    taxRate: 0.05,
    paymentTerms: "",
    notes: "",
  }
}

async function createClient(call: ReturnType<typeof setup>["call"]) {
  const res = await call("POST", "/clients", CLIENT)
  return ((await res.json()) as { id: number }).id
}

function record(clientId: number, status: QuotationRecord["status"] = "draft"): QuotationRecord {
  return { status, clientId, data: quotationData(CLIENT) }
}

test("報價編號格式為 QT-YYYYMMDD-HHmmss（本地時間）", () => {
  assert.equal(formatQuotationNumber(new Date(2026, 0, 5, 9, 8, 7)), "QT-20260105-090807")
})

test("新增報價單時由後端給編號，並寫進 data.meta", async () => {
  const { call } = setup()
  const clientId = await createClient(call)
  const res = await call("POST", "/quotations", record(clientId))
  assert.equal(res.status, 201)
  const saved = (await res.json()) as QuotationRecord
  assert.equal(saved.data.meta.quotationNumber, "QT-20261012-143052")
})

test("同一秒存第二張單，回 409，不覆蓋第一張", async () => {
  const { call } = setup()
  const clientId = await createClient(call)
  await call("POST", "/quotations", record(clientId))
  const res = await call("POST", "/quotations", record(clientId, "sent"))
  assert.equal(res.status, 409)
  const first = (await (await call("GET", "/quotations/QT-20261012-143052")).json()) as QuotationRecord
  assert.equal(first.status, "draft")
})

test("只有草稿可以刪除", async () => {
  const { call, setNow } = setup()
  const clientId = await createClient(call)
  await call("POST", "/quotations", record(clientId, "sent"))
  setNow(new Date(2026, 9, 12, 15, 0, 0))
  await call("POST", "/quotations", record(clientId, "draft"))

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
  const { call, setNow } = setup()
  const clientId = await createClient(call)
  await call("POST", "/quotations", record(clientId, "draft"))
  setNow(new Date(2026, 9, 13, 10, 0, 0))
  await call("POST", "/quotations", record(clientId, "won"))

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
