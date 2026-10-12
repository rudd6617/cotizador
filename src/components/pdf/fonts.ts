import { Font } from "@react-pdf/renderer"

// 字型檔不進 git，下載方式見 .claude/Wiki.md 的 Commands 段
Font.register({
  family: "Noto Sans TC",
  fonts: [
    { src: "/fonts/NotoSansTC-Regular.otf", fontWeight: 400 },
    { src: "/fonts/NotoSansTC-Bold.otf", fontWeight: 700 },
  ],
})

Font.registerHyphenationCallback((word) => [word])
