# cotizador — 報價單管理系統

建立、管理報價單與客戶資料，並匯出 PDF。

- 前端：Vite + React（`src/`）
- API：Hono，跑在 Cloudflare Worker（`server/`）
- 資料：Cloudflare D1（`migrations/`）
- 正式環境：https://cotizador.rudd6617.workers.dev（需通過 Cloudflare Access 登入）

## 開始開發

```bash
npm install
# 下載 PDF 字型（不進 git）
for w in Regular Bold; do
  curl -L -o public/fonts/NotoSansTC-$w.otf \
    https://github.com/notofonts/noto-cjk/raw/main/Sans/SubsetOTF/TC/NotoSansTC-$w.otf
done
npm run db:migrate:local   # 建本機 D1 資料表
npm run dev
```

## 常用指令

| 用途 | 指令 |
|------|------|
| 測試 | `npm test` |
| 建置 | `npm run build` |
| 部署 | `npm run deploy`（只在 `git status` 乾淨時跑） |

完整說明（指令、部署、正式環境注意事項、術語）見 `.claude/Wiki.md`；架構決策見 `docs/adr/`。
