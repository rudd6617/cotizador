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
- Font: Noto Sans TC (`public/fonts/NotoSansTC.ttf`)
- Deployment: Cloudflare Pages (static site)

### Commands

| 用途 | 指令 |
|------|------|
| 開發 | `npm run dev`（Hono API :8787 + Vite，`/api` 由 Vite proxy 轉送） |
| 測試 | `npm test`（`node:test`，測 `server/`） |
| 型別檢查 | `tsc -b && tsc -p server` |
| Lint | `npm run lint` |
| 建置 | `npm run build` (前端 + server 型別檢查 + vite build) |
| 正式執行 | `npm run build && npm start`（Hono 同時提供 API 與 `dist/`） |

資料（含公司資訊）都存在 `data/cotizador.db`（SQLite，不進 git；備份＝複製檔案）。公司資訊在系統的「設定」頁修改。

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
公司對某位 Client 開出的一份報價，含品項、稅率、付款條件與備註。
_Avoid_: Quote, Estimate, Offer

**Quotation Number**（報價編號）：
Quotation 第一次儲存時由後端依時間產生的唯一編號，格式 `QT-YYYYMMDD-HHmmss`，之後不可修改。
_Avoid_: 單號, ID

**Quotation Status**（狀態）：
Quotation 所處的階段，只有四種：草稿（Draft）、已送出（Sent）、成交（Won）、未成交（Lost）。任何狀態都可直接修改；只有草稿可刪除。
_Avoid_: Stage, State

**Client**（客戶）：
接收 Quotation 的公司，存於客戶資料。已有 Quotation 的 Client 不可刪除。
_Avoid_: Customer, Buyer, Account

**Client Snapshot**（客戶快照）：
儲存 Quotation 時一併複製進該單的 Client 資料。之後 Client 資料變動，不影響已存的 Quotation（見 ADR-0001）。

**Company Profile**（公司資訊）：
本公司自己的名稱、統編、地址、電話、Email、logo 與預設報價人，存在資料庫、由「設定」頁維護，顯示在每頁頂端與 PDF 抬頭。新增報價單時複製一份進該單（與 Client Snapshot 同理）。
_Avoid_: CompanyInfo（舊代碼名，每張單手填的版本）

### Bounded Contexts

<!-- 若專案大到有多個 context，於此列出並指向各 context 的位置。單 context 專案可留空。 -->
