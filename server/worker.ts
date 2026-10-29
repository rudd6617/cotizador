import type { D1Database, ExecutionContext } from "@cloudflare/workers-types"
import { createApp } from "./app.ts"

interface Env {
  DB: D1Database
}

// /api/* 由這裡處理；其他路徑由 wrangler.jsonc 的 assets 提供 dist/ 靜態檔
export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return createApp({ db: env.DB, now: () => new Date() }).fetch(request, env, ctx)
  },
}
