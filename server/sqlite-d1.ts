import { readdirSync, readFileSync } from "node:fs"
import { DatabaseSync, type SQLInputValue } from "node:sqlite"
import type { D1Database } from "@cloudflare/workers-types"

const MIGRATIONS_DIR = new URL("../migrations/", import.meta.url)

/**
 * 測試用：把 node:sqlite 包成 db.ts 用到的那部分 D1 介面（prepare / bind / first / all / run），
 * 並套用 migrations/ 的建表 SQL。D1 預設開啟外鍵檢查，這裡同步開啟。
 */
export function openTestDb(): D1Database {
  const db = new DatabaseSync(":memory:")
  db.exec("PRAGMA foreign_keys = ON")
  for (const file of readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith(".sql")).sort()) {
    db.exec(readFileSync(new URL(file, MIGRATIONS_DIR), "utf8"))
  }

  const statement = (sql: string, params: SQLInputValue[]) => ({
    bind: (...args: SQLInputValue[]) => statement(sql, args),
    first: async () => db.prepare(sql).get(...params) ?? null,
    all: async () => ({ results: db.prepare(sql).all(...params) }),
    run: async () => {
      const { changes, lastInsertRowid } = db.prepare(sql).run(...params)
      return { meta: { changes: Number(changes), last_row_id: Number(lastInsertRowid) } }
    },
  })

  return { prepare: (sql: string) => statement(sql, []) } as unknown as D1Database
}
