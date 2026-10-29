# ADR-0002: 部署在 Cloudflare Workers，資料存 D1

- **Status**: Accepted
- **Date**: 2026-10-29

## Context

後端原本是 Node 伺服器（`@hono/node-server`）加本機 SQLite 檔（`node:sqlite`，`data/cotizador.db`），只能在本機跑。
要讓系統上線，又不想自己管伺服器。前端原本就打算放 Cloudflare。

## Decision

前端與 API 由同一個 Cloudflare Worker 提供，資料存 D1；資料表結構用 D1 migrations（`migrations/*.sql`）管理。

## Alternatives Considered

- **Node 伺服器放 VPS / Fly / Railway（掛持久磁碟）**：程式幾乎不用改，但要管主機、備份、HTTPS 與登入，對單人內部工具負擔過重。
- **Durable Object 的 SQLite storage**：API 是同步的，改動比 D1 少；但寫法冷門、多一層 Durable Object 綁定，日後查資料與備份都不如 D1 直接。
- **GitHub CI 自動部署**：見 Consequences；目前只有一人開發，先手動。

## Consequences

- 正面：不用管主機；同一個 Worker 提供前端與 API，開發（`@cloudflare/vite-plugin`）與正式環境同一套執行環境；D1 內建 30 天時間回溯。
- 負面：
  - `server/db.ts` 綁 D1 的非同步 API；離開 Cloudflare 要改資料層。
  - 測試不跑真的 D1，而是用 `server/sqlite-d1.ts` 把 node:sqlite 包成 D1 介面；轉接層與 D1 行為若有差異，測試抓不到。
  - 系統沒有登入，靠 Cloudflare Access 保護；Worker 的版本預覽網址不受 Access 保護，所以 `preview_urls` 必須關閉。
- 觸發重評估的條件：需要多人各自登入與權限（要做真正的帳號系統）；資料量逼近 D1 單庫上限；不只一人部署（改用 CI）。
