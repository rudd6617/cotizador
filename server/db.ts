import { DatabaseSync } from "node:sqlite"
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

const SCHEMA = `
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company TEXT NOT NULL,
  contact_person TEXT,
  address TEXT NOT NULL,
  phone TEXT,
  email TEXT
);

CREATE TABLE IF NOT EXISTS quotations (
  number TEXT PRIMARY KEY,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  status TEXT NOT NULL CHECK (status IN ('draft', 'sent', 'won', 'lost')),
  client_name TEXT NOT NULL,
  date TEXT NOT NULL,
  currency TEXT NOT NULL,
  total REAL NOT NULL,
  data TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS company (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data TEXT NOT NULL
);
`

export function openDb(path: string): DatabaseSync {
  const db = new DatabaseSync(path)
  db.exec("PRAGMA foreign_keys = ON")
  db.exec(SCHEMA)
  return db
}

// ---- company（只有一筆） ----

export function getCompany(db: DatabaseSync): CompanyInfo | undefined {
  const row = db.prepare(`SELECT data FROM company WHERE id = 1`).get() as { data: string } | undefined
  return row && JSON.parse(row.data)
}

export function saveCompany(db: DatabaseSync, c: CompanyInfo): void {
  db.prepare(`INSERT INTO company (id, data) VALUES (1, ?) ON CONFLICT (id) DO UPDATE SET data = excluded.data`).run(
    JSON.stringify(c),
  )
}

// ---- settings（只有一筆） ----

export function getSettings(db: DatabaseSync): AppSettings | undefined {
  const row = db.prepare(`SELECT data FROM settings WHERE id = 1`).get() as { data: string } | undefined
  return row && JSON.parse(row.data)
}

export function saveSettings(db: DatabaseSync, s: AppSettings): void {
  db.prepare(`INSERT INTO settings (id, data) VALUES (1, ?) ON CONFLICT (id) DO UPDATE SET data = excluded.data`).run(
    JSON.stringify(s),
  )
}

// ---- clients ----

const CLIENT_COLUMNS = `id, company, contact_person AS contactPerson, address, phone, email`

export function listClients(db: DatabaseSync): ClientWithCount[] {
  return db
    .prepare(
      `SELECT ${CLIENT_COLUMNS},
        (SELECT COUNT(*) FROM quotations q WHERE q.client_id = clients.id) AS quotationCount
       FROM clients ORDER BY company`,
    )
    .all() as unknown as ClientWithCount[]
}

export function insertClient(db: DatabaseSync, c: ClientInfo): number {
  const result = db
    .prepare(
      `INSERT INTO clients (company, contact_person, address, phone, email) VALUES (?, ?, ?, ?, ?)`,
    )
    .run(c.company, c.contactPerson ?? null, c.address, c.phone ?? null, c.email ?? null)
  return Number(result.lastInsertRowid)
}

export function updateClient(db: DatabaseSync, id: number, c: ClientInfo): boolean {
  const result = db
    .prepare(
      `UPDATE clients SET company = ?, contact_person = ?, address = ?, phone = ?, email = ? WHERE id = ?`,
    )
    .run(c.company, c.contactPerson ?? null, c.address, c.phone ?? null, c.email ?? null, id)
  return result.changes > 0
}

export function countClientQuotations(db: DatabaseSync, id: number): number {
  const row = db.prepare(`SELECT COUNT(*) AS n FROM quotations WHERE client_id = ?`).get(id) as { n: number }
  return row.n
}

export function deleteClient(db: DatabaseSync, id: number): boolean {
  return db.prepare(`DELETE FROM clients WHERE id = ?`).run(id).changes > 0
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

export function listQuotations(
  db: DatabaseSync,
  filter: { q: string; status: QuotationStatus | "" },
): QuotationSummary[] {
  const like = `%${filter.q}%`
  return db
    .prepare(
      `SELECT number, client_id AS clientId, client_name AS clientName, status, date, currency, total
       FROM quotations
       WHERE (number LIKE ? OR client_name LIKE ?) AND (? = '' OR status = ?)
       ORDER BY number DESC`,
    )
    .all(like, like, filter.status, filter.status) as unknown as QuotationSummary[]
}

/** 舊格式品項只有 description；轉成品名，規格留空 */
function upgradeItem({ description, ...item }: LineItem & { description?: string }): LineItem {
  return description === undefined ? item : { ...item, name: description, spec: "" }
}

export function getQuotation(db: DatabaseSync, number: string): QuotationRecord | undefined {
  const row = db
    .prepare(`SELECT status, client_id AS clientId, data FROM quotations WHERE number = ?`)
    .get(number) as { status: QuotationStatus; clientId: number; data: string } | undefined
  if (!row) return undefined
  // 版型功能之前存的單沒有 template，一律視為 modern
  const parsed = JSON.parse(row.data)
  const data = { template: "modern", ...parsed, items: parsed.items.map(upgradeItem) }
  return { status: row.status, clientId: row.clientId, data }
}

/** 編號重複時 SQLite 會拋 UNIQUE 錯誤，交給呼叫端回報 */
export function insertQuotation(db: DatabaseSync, number: string, r: QuotationRecord, now: string): void {
  const s = summaryColumns(r)
  db.prepare(
    `INSERT INTO quotations (number, client_id, status, client_name, date, currency, total, data, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(number, r.clientId, r.status, s.clientName, s.date, s.currency, s.total, JSON.stringify(r.data), now, now)
}

export function updateQuotation(db: DatabaseSync, number: string, r: QuotationRecord, now: string): boolean {
  const s = summaryColumns(r)
  const result = db
    .prepare(
      `UPDATE quotations
       SET client_id = ?, status = ?, client_name = ?, date = ?, currency = ?, total = ?, data = ?, updated_at = ?
       WHERE number = ?`,
    )
    .run(r.clientId, r.status, s.clientName, s.date, s.currency, s.total, JSON.stringify(r.data), now, number)
  return result.changes > 0
}

export function deleteQuotation(db: DatabaseSync, number: string): boolean {
  return db.prepare(`DELETE FROM quotations WHERE number = ?`).run(number).changes > 0
}
