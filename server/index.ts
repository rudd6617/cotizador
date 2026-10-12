import { mkdirSync, readFileSync } from "node:fs"
import { extname } from "node:path"
import { serve } from "@hono/node-server"
import { serveStatic } from "@hono/node-server/serve-static"
import { Hono } from "hono"
import type { CompanyInfo } from "../src/types/quotation.ts"
import { createApp } from "./app.ts"
import { openDb } from "./db.ts"

const PORT = 8787

/** company.json 的 logoFile 是檔案路徑；轉成 data URL 給預覽與 PDF 用 */
function loadCompany(): CompanyInfo {
  const { logoFile, ...company } = JSON.parse(readFileSync("company.json", "utf8"))
  if (!logoFile) return company
  const mime = extname(logoFile) === ".svg" ? "image/svg+xml" : `image/${extname(logoFile).slice(1)}`
  const base64 = readFileSync(logoFile).toString("base64")
  return { ...company, logo: `data:${mime};base64,${base64}` }
}

mkdirSync("data", { recursive: true })
const api = createApp({ db: openDb("data/cotizador.db"), company: loadCompany(), now: () => new Date() })

// 正式模式由這裡提供前端（先 vite build）；開發時前端由 Vite 提供，/api 經 Vite proxy 轉來
const app = new Hono()
app.route("/", api)
app.use("/*", serveStatic({ root: "./dist" }))

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`)
})
