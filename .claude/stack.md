# Tech Stack

- **Runtime**: Vite 8 + React 19 + TypeScript 5 (strict)
- **Target**: ES2020, browser
- **CSS**: Tailwind CSS 4 (`@tailwindcss/vite`)
- **UI**: shadcn/ui (Base Nova, `@base-ui/react` primitives) + CVA + lucide-react
- **PDF**: `@react-pdf/renderer` — client-side via dynamic import + `pdf().toBlob()`
- **Font**: Noto Sans TC (`public/fonts/NotoSansTC.ttf`)
- **Deployment**: Cloudflare Pages (static site)

# Commands

| 用途 | 指令 |
|------|------|
| 開發 | `npm run dev` |
| 型別檢查 | `tsc --noEmit` |
| 建置 | `npm run build` (tsc + vite build) |
| 預覽 | `npm run preview` |
