import type { D1Database } from "@cloudflare/workers-types"
import type {
  AppSettings,
  LineItem,
  ClientInfo,
  CompanyInfo,
  ClientWithCount,
  QuotationRecord,
  QuotationStatus,
  QuotationSummary,
} from "../src/types/quotation.ts"
import { calcSubtotal, calcTax, calcTotal } from "../src/lib/format.ts"

// 資料表結構在 migrations/*.sql，由 wrangler d1 migrations apply 建立

// ---- company（只有一筆） ----

export async function getCompany(db: D1Database): Promise<CompanyInfo | undefined> {
  const row = await db.prepare(`SELECT data FROM company WHERE id = 1`).first<{ data: string }>()
  return row ? JSON.parse(row.data) : undefined
}

export async function saveCompany(db: D1Database, c: CompanyInfo): Promise<void> {
  await db
    .prepare(`INSERT INTO company (id, data) VALUES (1, ?) ON CONFLICT (id) DO UPDATE SET data = excluded.data`)
    .bind(JSON.stringify(c))
    .run()
}

// ---- settings（只有一筆） ----

export async function getSettings(db: D1Database): Promise<AppSettings | undefined> {
  const row = await db.prepare(`SELECT data FROM settings WHERE id = 1`).first<{ data: string }>()
  return row ? JSON.parse(row.data) : undefined
}

export async function saveSettings(db: D1Database, s: AppSettings): Promise<void> {
  await db
    .prepare(`INSERT INTO settings (id, data) VALUES (1, ?) ON CONFLICT (id) DO UPDATE SET data = excluded.data`)
    .bind(JSON.stringify(s))
    .run()
}

// ---- clients ----

const CLIENT_COLUMNS = `id, company, tax_id AS taxId, contact_person AS contactPerson, address, phone, email`

export async function listClients(db: D1Database): Promise<ClientWithCount[]> {
  const { results } = await db
    .prepare(
      `SELECT ${CLIENT_COLUMNS},
        (SELECT COUNT(*) FROM quotations q WHERE q.client_id = clients.id) AS quotationCount
       FROM clients ORDER BY company`,
    )
    .all<ClientWithCount>()
  return results
}

export async function insertClient(db: D1Database, c: ClientInfo): Promise<number> {
  const { meta } = await db
    .prepare(
      `INSERT INTO clients (company, tax_id, contact_person, address, phone, email) VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .bind(c.company, c.taxId ?? null, c.contactPerson ?? null, c.address, c.phone ?? null, c.email ?? null)
    .run()
  return meta.last_row_id
}

export async function updateClient(db: D1Database, id: number, c: ClientInfo): Promise<boolean> {
  const { meta } = await db
    .prepare(
      `UPDATE clients SET company = ?, tax_id = ?, contact_person = ?, address = ?, phone = ?, email = ? WHERE id = ?`,
    )
    .bind(c.company, c.taxId ?? null, c.contactPerson ?? null, c.address, c.phone ?? null, c.email ?? null, id)
    .run()
  return meta.changes > 0
}

export async function countClientQuotations(db: D1Database, id: number): Promise<number> {
  const row = await db.prepare(`SELECT COUNT(*) AS n FROM quotations WHERE client_id = ?`).bind(id).first<{ n: number }>()
  return row!.n
}

export async function deleteClient(db: D1Database, id: number): Promise<boolean> {
  const { meta } = await db.prepare(`DELETE FROM clients WHERE id = ?`).bind(id).run()
  return meta.changes > 0
}

// ---- quotations ----

/** 列表與搜尋用的欄位，從 data 推導 */
function summaryColumns(r: QuotationRecord) {
  const subtotal = calcSubtotal(r.data.items)
  return {
    clientName: r.data.client.company,
    date: r.data.meta.date,
    currency: r.data.meta.currency,
    total: calcTotal(subtotal, calcTax(subtotal, r.data.taxRate)),
  }
}

export async function listQuotations(
  db: D1Database,
  filter: { q: string; status: QuotationStatus | "" },
): Promise<QuotationSummary[]> {
  const like = `%${filter.q}%`
  const { results } = await db
    .prepare(
      `SELECT number, client_id AS clientId, client_name AS clientName, status, date, currency, total
       FROM quotations
       WHERE (number LIKE ? OR client_name LIKE ?) AND (? = '' OR status = ?)
       ORDER BY number DESC`,
    )
    .bind(like, like, filter.status, filter.status)
    .all<QuotationSummary>()
  return results
}

/** 舊格式品項只有 description；轉成品名，規格留空 */
function upgradeItem({ description, ...item }: LineItem & { description?: string }): LineItem {
  return description === undefined ? item : { ...item, name: description, spec: "" }
}

export async function getQuotation(db: D1Database, number: string): Promise<QuotationRecord | undefined> {
  const row = await db
    .prepare(`SELECT status, client_id AS clientId, data FROM quotations WHERE number = ?`)
    .bind(number)
    .first<{ status: QuotationStatus; clientId: number; data: string }>()
  if (!row) return undefined
  // 舊資料缺的欄位補預設值：版型 modern、顯示大寫金額；舊的共用開關 showTermsAndNotes 拆成兩個，沒有就都顯示
  const { showTermsAndNotes = true, ...parsed } = JSON.parse(row.data)
  const data = {
    template: "modern",
    showPaymentTerms: showTermsAndNotes,
    showNotes: showTermsAndNotes,
    showAmountInWords: true,
    ...parsed,
    items: parsed.items.map(upgradeItem),
  }
  return { status: row.status, clientId: row.clientId, data }
}

/** 編號重複時 SQLite 會拋 UNIQUE 錯誤，交給呼叫端回報 */
export async function insertQuotation(db: D1Database, number: string, r: QuotationRecord, now: string): Promise<void> {
  const s = summaryColumns(r)
  await db
    .prepare(
      `INSERT INTO quotations (number, client_id, status, client_name, date, currency, total, data, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(number, r.clientId, r.status, s.clientName, s.date, s.currency, s.total, JSON.stringify(r.data), now, now)
    .run()
}

export async function updateQuotation(db: D1Database, number: string, r: QuotationRecord, now: string): Promise<boolean> {
  const s = summaryColumns(r)
  const { meta } = await db
    .prepare(
      `UPDATE quotations
       SET client_id = ?, status = ?, client_name = ?, date = ?, currency = ?, total = ?, data = ?, updated_at = ?
       WHERE number = ?`,
    )
    .bind(r.clientId, r.status, s.clientName, s.date, s.currency, s.total, JSON.stringify(r.data), now, number)
    .run()
  return meta.changes > 0
}

export async function deleteQuotation(db: D1Database, number: string): Promise<boolean> {
  const { meta } = await db.prepare(`DELETE FROM quotations WHERE number = ?`).bind(number).run()
  return meta.changes > 0
}
