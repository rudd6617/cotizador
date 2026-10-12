import type { DatabaseSync } from "node:sqlite"
import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"
import {
  QUOTATION_STATUSES,
  type ClientInfo,
  type CompanyInfo,
  type QuotationRecord,
  type QuotationStatus,
} from "../src/types/quotation.ts"
import * as store from "./db.ts"

interface Deps {
  db: DatabaseSync
  now: () => Date
}

const EMPTY_COMPANY: CompanyInfo = { name: "", quoter: "", phone: "", email: "", address: "", taxId: "" }

const pad = (n: number) => String(n).padStart(2, "0")

/** QT-YYYYMMDD-HHmmss，用伺服器本地時間 */
export function formatQuotationNumber(d: Date): string {
  const date = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
  const time = `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`
  return `QT-${date}-${time}`
}

function fail(status: 400 | 404 | 409, message: string): never {
  throw new HTTPException(status, { message })
}

function isStatus(s: unknown): s is QuotationStatus {
  return QUOTATION_STATUSES.includes(s as QuotationStatus)
}

function parseRecord(body: QuotationRecord): QuotationRecord {
  if (!isStatus(body.status)) fail(400, "狀態不正確")
  if (!Number.isInteger(body.clientId)) fail(400, "請選擇客戶")
  if (!body.data?.meta || !Array.isArray(body.data.items)) fail(400, "報價單內容不完整")
  return body
}

function parseClient(body: ClientInfo): ClientInfo {
  if (!body.company?.trim()) fail(400, "請填寫客戶名稱")
  if (typeof body.address !== "string") fail(400, "請填寫客戶地址")
  return body
}

function parseCompany(body: CompanyInfo): CompanyInfo {
  const required = [body.name, body.quoter, body.phone, body.email, body.address, body.taxId]
  if (required.some((v) => typeof v !== "string")) fail(400, "公司資料不完整")
  return body
}

function parseId(raw: string): number {
  const id = Number(raw)
  if (!Number.isInteger(id)) fail(400, "客戶編號不正確")
  return id
}

export function createApp({ db, now }: Deps) {
  const app = new Hono().basePath("/api")

  app.onError((err, c) => {
    if (err instanceof HTTPException) return c.json({ error: err.message }, err.status)
    console.error(err)
    return c.json({ error: err.message }, 500)
  })

  app.get("/company", (c) => c.json(store.getCompany(db) ?? EMPTY_COMPANY))

  app.put("/company", async (c) => {
    const company = parseCompany(await c.req.json())
    store.saveCompany(db, company)
    return c.json(company)
  })

  // ---- clients ----

  app.get("/clients", (c) => c.json(store.listClients(db)))

  app.post("/clients", async (c) => {
    const client = parseClient(await c.req.json())
    const id = store.insertClient(db, client)
    return c.json({ ...client, id }, 201)
  })

  app.put("/clients/:id", async (c) => {
    const id = parseId(c.req.param("id"))
    const client = parseClient(await c.req.json())
    if (!store.updateClient(db, id, client)) fail(404, "找不到客戶")
    return c.json({ ...client, id })
  })

  app.delete("/clients/:id", (c) => {
    const id = parseId(c.req.param("id"))
    if (store.countClientQuotations(db, id) > 0) fail(409, "這個客戶已有報價單，不能刪除")
    if (!store.deleteClient(db, id)) fail(404, "找不到客戶")
    return c.body(null, 204)
  })

  // ---- quotations ----

  app.get("/quotations", (c) => {
    const q = c.req.query("q") ?? ""
    const status = c.req.query("status") ?? ""
    if (status !== "" && !isStatus(status)) fail(400, "狀態不正確")
    return c.json(store.listQuotations(db, { q, status }))
  })

  app.get("/quotations/:number", (c) => {
    const record = store.getQuotation(db, c.req.param("number"))
    if (!record) fail(404, "找不到報價單")
    return c.json(record)
  })

  app.post("/quotations", async (c) => {
    const record = parseRecord(await c.req.json())
    const at = now()
    const number = formatQuotationNumber(at)
    if (store.getQuotation(db, number)) fail(409, `報價編號 ${number} 已存在，請稍後再存一次`)
    const saved = { ...record, data: { ...record.data, meta: { ...record.data.meta, quotationNumber: number } } }
    store.insertQuotation(db, number, saved, at.toISOString())
    return c.json(saved, 201)
  })

  app.put("/quotations/:number", async (c) => {
    const number = c.req.param("number")
    const record = parseRecord(await c.req.json())
    const saved = { ...record, data: { ...record.data, meta: { ...record.data.meta, quotationNumber: number } } }
    if (!store.updateQuotation(db, number, saved, now().toISOString())) fail(404, "找不到報價單")
    return c.json(saved)
  })

  app.delete("/quotations/:number", (c) => {
    const number = c.req.param("number")
    const record = store.getQuotation(db, number)
    if (!record) fail(404, "找不到報價單")
    if (record.status !== "draft") fail(409, "只有草稿可以刪除")
    store.deleteQuotation(db, number)
    return c.body(null, 204)
  })

  return app
}
