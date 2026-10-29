# Memory — 交接（2026-10-29）

## 當前進展

目標：把報價系統部署上 Cloudflare。

- ✅ 後端從 Node + node:sqlite 改成 Worker + D1（`987778b`）；設計與取捨見 `docs/adr/0002-deploy-on-cloudflare-workers-d1.md`
- ✅ 已部署到 https://cotizador.rudd6617.workers.dev，Cloudflare Access 已設；版本預覽網址已關（`658620d`）
- ✅ 本機 `data/cotizador.db` 已匯入遠端 D1（客戶 1、報價單 1、公司 1；內容雜湊比對一致）
- ✅ 使用者已登入正式環境驗證：列表、設定頁公司資料、PDF 字型都正常
- ✅ 文件已更新並 commit：`.claude/Wiki.md`（正式環境段）、`README.md`（換掉 Next.js 範本）、ADR-0002；本檔進版控

## 已確認結論

- 部署方式：本機手動 `npm run deploy`，不接 GitHub CI（使用者拍板）。改 CI 的觸發條件寫在 ADR-0002
- 其餘決定都已寫進 Wiki「正式環境」段與 ADR-0002

## 待辦

- （觸發型，不急）`react-pdf` chunk 1.5MB 的建置警告；目前不影響使用

## 下次入口

部署任務已收尾，沒有進行中的工作。下次從使用者的新需求開始。

## 建議 skill

- `/r-review`：審 `987778b` 的 D1 改寫（重點：`server/sqlite-d1.ts` 轉接層與真 D1 行為差異），這次沒做過獨立審查
- 之後有新功能：照 `.claude/CLAUDE.md` 路由走 `/r-grill` → 動工
