import type { DatabaseSync } from "node:sqlite"
import { Hono } from "hono"
import { HTTPException } from "hono/http-exception"
import {
  QUOTATION_STATUSES,
  QUOTATION_TEMPLATES,
  type AppSettings,
  type ClientInfo,
  type CompanyInfo,
  type QuotationRecord,
  type QuotationStatus,
  type QuotationTemplate,
} from "../src/types/quotation.ts"
import { isQuotationNumber } from "../src/lib/format.ts"
import * as store from "./db.ts"

interface Deps {
  db: DatabaseSync
  now: () => Date
}

const EMPTY_COMPANY: CompanyInfo = { name: "", quoter: "", phone: "", email: "", address: "", taxId: "" }
const DEFAULT_SETTINGS: AppSettings = { defaultTemplate: "modern" }

function fail(status: 400 | 404 | 409, message: string): never {
  throw new HTTPException(status, { message })
}

function isStatus(s: unknown): s is QuotationStatus {
  return QUOTATION_STATUSES.includes(s as QuotationStatus)
}

function isTemplate(t: unknown): t is QuotationTemplate {
  return QUOTATION_TEMPLATES.includes(t as QuotationTemplate)
}

function parseRecord(body: QuotationRecord): QuotationRecord {
  if (!isStatus(body.status)) fail(400, "狀態不正確")
  if (!Number.isInteger(body.clientId)) fail(400, "請選擇客戶")
  if (!body.data?.meta || !Array.isArray(body.data.items)) fail(400, "報價單內容不完整")
  if (!isTemplate(body.data.template)) fail(400, "版型不正確")
  return body
}

function parseSettings(body: AppSettings): AppSettings {
  if (!isTemplate(body.defaultTemplate)) fail(400, "版型不正確")
  return { defaultTemplate: body.defaultTemplate }
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

  app.get("/settings", (c) => c.json(store.getSettings(db) ?? DEFAULT_SETTINGS))

  app.put("/settings", async (c) => {
    const settings = parseSettings(await c.req.json())
    store.saveSettings(db, settings)
    return c.json(settings)
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

  // 編號在開單當下由前端產生（formatQuotationNumber），這裡只檢查格式與重複
  app.post("/quotations", async (c) => {
    const record = parseRecord(await c.req.json())
    const number = record.data.meta.quotationNumber
    if (!isQuotationNumber(number)) fail(400, "報價編號格式不正確")
    if (store.getQuotation(db, number)) fail(409, `報價編號 ${number} 已存在，請重新開一張報價單`)
    store.insertQuotation(db, number, record, now().toISOString())
    return c.json(record, 201)
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
