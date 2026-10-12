import { mkdirSync } from "node:fs"
import { serve } from "@hono/node-server"
import { serveStatic } from "@hono/node-server/serve-static"
import { Hono } from "hono"
import { createApp } from "./app.ts"
import { openDb } from "./db.ts"

const PORT = 8787

mkdirSync("data", { recursive: true })
const api = createApp({ db: openDb("data/cotizador.db"), now: () => new Date() })

// 正式模式由這裡提供前端（先 vite build）；開發時前端由 Vite 提供，/api 經 Vite proxy 轉來
const app = new Hono()
app.route("/", api)
app.use("/*", serveStatic({ root: "./dist" }))

serve({ fetch: app.fetch, port: PORT }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`)
})
