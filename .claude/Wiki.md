# Wiki — 長期知識

<!--
本檔記錄專案的「現在是什麼」：背景、技術棧、目錄結構、API、業務口徑、術語。
與 docs/adr/（為什麼選 X）、.out-of-scope/（為什麼不做 X）分工：Wiki 收「現在是什麼」，決策日誌收「為什麼」。
這是會被持續改寫的活文件；不可變的決策請寫 ADR，不要寫這裡。
各段若專案無內容可留空，不必刪。
-->

## 項目背景

<!-- 一段話：這個專案是什麼、解決誰的什麼問題。新人讀完能對齊定位。 -->

通用模板。

## 技術棧


### Runtime
- Vite 8 + React 19 + TypeScript 5 (strict)
- Target: ES2020, browser

### Framework
- CSS: Tailwind CSS 4 (`@tailwindcss/vite`)
- UI: shadcn/ui (Base Nova, `@base-ui/react` primitives) + CVA + lucide-react

### 主要依賴
- PDF: `@react-pdf/renderer` — client-side via dynamic import + `pdf().toBlob()`
- Font: Noto Sans TC（`public/fonts/NotoSansTC-Regular.otf`、`NotoSansTC-Bold.otf`）
- API: Hono（`server/app.ts`），跑在 Cloudflare Worker（入口 `server/worker.ts`）
- DB: Cloudflare D1（binding `DB`），資料表結構在 `migrations/*.sql`
- Deployment: Cloudflare Workers——同一個 Worker 提供 `/api/*` 與前端靜態檔（`wrangler.jsonc`；選型理由見 ADR-0002）

### Commands

| 用途 | 指令 |
|------|------|
| 開發 | `npm run dev`（Vite + Cloudflare 外掛，本機跑 Worker 與本機 D1，資料在 `.wrangler/`） |
| 本機建表 | `npm run db:migrate:local`（第一次開發前、或新增 migration 後） |
| 測試 | `npm test`（`node:test`，測 `server/` 與 `src/lib/`；DB 用 `server/sqlite-d1.ts` 把 node:sqlite 包成 D1 介面） |
| 型別檢查 | `tsc -b && tsc -p server` |
| Lint | `npm run lint` |
| 建置 | `npm run build` (前端 + server 型別檢查 + vite build) |
| 部署 | `npm run deploy`（建置 → 套用遠端 D1 migration → `wrangler deploy`）；只在 `git status` 乾淨時跑 |
| 備份 | `npx wrangler d1 export cotizador --remote --output backup.sql` |

PDF 字型（不進 git，第一次 clone 後要下載，否則 PDF 產生失敗 `Unknown font format`）：

```bash
for w in Regular Bold; do
  curl -L -o public/fonts/NotoSansTC-$w.otf \
    https://github.com/notofonts/noto-cjk/raw/main/Sans/SubsetOTF/TC/NotoSansTC-$w.otf
done
```

不要用 Google Fonts 的可變字重檔 `NotoSansTC[wght].ttf`：react-pdf 只取預設字重（Thin），粗體也出不來。

資料（含公司資訊）都存在 D1。公司資訊在系統的「設定」頁修改。改資料表結構＝在 `migrations/` 加新的編號 SQL 檔，不改舊檔。

### 正式環境

- 網址：https://cotizador.rudd6617.workers.dev
- 部署方式：本機手動 `npm run deploy`，不接 GitHub CI（只有一人開發；字型不進 git，CI 要另外處理）
- D1 資料庫：`cotizador`（APAC），`database_id` 在 `wrangler.jsonc`
- 存取控制：系統本身沒有登入功能，由 Cloudflare Access（Zero Trust → Access → Applications）擋在前面，只允許指定 Email
- `wrangler.jsonc` 的 `preview_urls: false` 不能拿掉：版本預覽網址（`<版本>-cotizador.rudd6617.workers.dev`）不受 Access 保護，開著會讓資料直接公開
- 備份：D1 有 30 天時間回溯（Time Travel）；要留檔用上表的備份指令
- 舊的本機 `data/cotizador.db` 已於 2026-10-29 匯入 D1，之後不再更新，不是備份

### 驗證分級

<!-- 什麼時機跑哪些驗證（紅綠循環中 / 收官前 / commit 前 / push 後）。AGENTS.md 專案級預設會指到這裡。 -->


## 目錄結構

<!-- 關鍵目錄的職責；只列需要解釋的，不複製 tree。 -->

## API 說明

<!-- 對外/對內介面的契約：端點、參數、回傳、錯誤碼。實作細節不放這。 -->

## 業務口徑

<!-- 業務規則與計算口徑：什麼算一筆訂單、退款怎麼算、時區怎麼處理…易誤解處優先記。 -->

## 術語表（Glossary）

<!--
記錄領域語言；不放實作細節，只放領域專家會關心的概念。
格式：
### <Term>
- 定義：一句話
- 邊界：什麼算 / 什麼不算
- 關聯：與哪些 term 相關
-->

**Quotation**（報價單）：
公司對某位 Client 開出的一份報價，含品項、稅率、付款條件與備註。付款條件、備註各有一個「顯示在報價單上」開關（預設顯示），顯示在小計左邊；舊資料的共用開關 showTermsAndNotes 讀取時拆成兩個。傳統版型另有「顯示大寫金額」開關（預設顯示，僅新台幣）。
_Avoid_: Quote, Estimate, Offer

**Quotation Number**（報價編號）：
開新報價單（新增或複製）當下依時間產生的唯一編號，格式 `QT-YYYYMMDD-HHmmss`，之後不可修改。儲存時後端檢查格式與是否重複（重複回 409）；沒存就離開不佔用編號。
_Avoid_: 單號, ID

**Quotation Status**（狀態）：
Quotation 所處的階段，只有四種：草稿（Draft）、已送出（Sent）、成交（Won）、未成交（Lost）。任何狀態都可直接修改；只有草稿可刪除。
_Avoid_: Stage, State

**Quotation Template**（版型）：
報價單預覽與 PDF 的版面，目前有「現代」（modern）與「傳統」（classic）兩種。每張 Quotation 各自存版型；新單預設值在「設定」頁指定。版型功能之前存的單視為現代。
_Avoid_: 樣式, Theme, Layout

**Line Item**（品項）：
Quotation 裡的一行，含品名（name）、規格（spec）、數量、單位、單價。品名與規格分開存、報價單上分兩欄顯示。舊資料只有「說明」（description），讀取時轉成品名、規格留空。
_Avoid_: 品項說明, Description, Product

**Client**（客戶）：
接收 Quotation 的公司，存於客戶資料。已有 Quotation 的 Client 不可刪除。
_Avoid_: Customer, Buyer, Account

**Client Snapshot**（客戶快照）：
儲存 Quotation 時一併複製進該單的 Client 資料。之後 Client 資料變動，不影響已存的 Quotation（見 ADR-0001）。

**Company Profile**（公司資訊）：
本公司自己的名稱、統編、地址、電話、Email、logo、預設報價人與匯款資料（銀行、分行、戶名、帳號），存在資料庫、由「設定」頁維護，顯示在每頁頂端與 PDF 抬頭。新增報價單時複製一份進該單（與 Client Snapshot 同理）。
_Avoid_: CompanyInfo（舊代碼名，每張單手填的版本）

### Bounded Contexts

<!-- 若專案大到有多個 context，於此列出並指向各 context 的位置。單 context 專案可留空。 -->
