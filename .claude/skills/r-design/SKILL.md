---
name: r-design
description: |
  Frontend design anti-pattern checklist — avoid the tells that make UI look AI-generated.
  Use when building, polishing, or reviewing frontend / UI (layout, color, type, motion).
  Zero dependency; pure guidance.
argument-hint: "[file, component, or page]"
---

審查或建構 $ARGUMENTS 的前端設計時，對照以下守則。沒有 `$ARGUMENTS` 時，當成通用設計準則套用在當前 UI 工作上。

技術數值（contrast、clamp、ch、OKLCH 參數）是硬約束，框架判斷才可權衡。

## 1. 絕對禁止（match-and-refuse）

看到自己要寫這些，換結構重寫，不要微調：

- **側邊條 border** — `border-left/right` > 1px 當彩色強調（卡片/列表/alert）。改用完整邊框、背景色塊、前導數字/icon，或什麼都不加。
- **漸層文字** — `background-clip: text` + gradient。用單色；強調靠 weight / size。
- **預設玻璃擬態** — 裝飾性 blur / glass card。要嘛罕見且有目的，要嘛不用。
- **Hero-metric 模板** — 大數字 + 小標 + 旁邊一排統計 + 漸層強調。SaaS 陳腔。
- **整齊劃一的卡片網格** — 同尺寸卡片 icon + 標題 + 文字無限重複。
- **每段上方的小寫 tracked eyebrow** — 寬字距小標（「ABOUT」「PROCESS」）出現在每個 section 就是 AI 文法。一個刻意的品牌 kicker 是聲音；每段都有就是反射。
- **預設的編號段落標記（01 / 02 / 03）** — 只有「真的是有序流程」才用編號；當裝飾掛在每個 section 上就是 eyebrow 的深一層。
- **標題裡的斜體強調字** — headline 中挑一兩個字改 italic（常配 serif）當重點。強調靠結構與 weight，不靠這個反射。
- **等寬字小標** — monospace 當 label / eyebrow / meta 資訊製造「技術感」。只有真的是程式碼、數據或對齊需求才用。
- **膠囊按鈕** — 全圓角 pill 當預設按鈕形狀。圓角要從整體形狀語言推出來，不是預設 `border-radius: 9999px`。
- **溢出容器的文字** — 長標題 + 大 clamp + 窄網格在平板/手機爆版。每個斷點都測標題；爆了就降 clamp max 或改文案。viewport 是設計的一部分。

## 2. 配色

- **驗對比**：正文 ≥ 4.5:1；大字（≥18px 或 bold ≥14px）≥ 3:1；placeholder 同樣要 4.5:1。最常見失敗是「淺灰正文壓在帶色近白底」——對比接近就把正文往 ink 端推。淺灰「為了優雅」是 AI 設計難讀的頭號原因。
- **彩色背景上不要灰字**——用背景同色相的更深階，或文字色的透明度。
- 用 **OKLCH**。
- **cream / sand / beige 底色是 2026 的 AI 預設**（OKLCH L 0.84–0.97、C < 0.06、hue 40–100，整條暖中性帶都讀作米色/紙感）。`--paper` `--cream` `--sand` `--linen` `--parchment` `--ivory` 這類 token 名本身就是 tell。「暖、傳統、雜誌感」不要翻譯成帶暖調的近白底；暖意靠 accent + 字體 + 影像帶，不是底色。
- 帶色中性：往品牌色相加 0.005–0.015 chroma。別預設往暖/冷偏「因為品牌感覺如此」。
- **先選色彩策略再選顏色**（承諾軸四階）：Restrained（中性 + 一個 accent ≤10%）/ Committed（一個飽和色佔 30–60% 表面）/ Full palette（3–4 個命名角色）/ Drenched（表面本身就是顏色）。
- Dark vs light **不是預設**。先寫一句物理場景：誰用、在哪、什麼光線、什麼情緒。句子不逼出答案就是還不夠具體。

## 3. 字體排版

- 正文行長 **65–75ch** 封頂。
- 不要配「相似但不同」的字體（兩個 geometric sans）。配在對比軸上（serif + sans、geometric + humanist），或同一家族多 weight。
- Hero / display 標題上限 `clamp()` max **≤ 6rem（~96px）**。再大是喊叫不是設計。
- Display 字距下限 **≥ -0.04em**，更緊字會黏。
- h1–h3 用 `text-wrap: balance`，長文用 `text-wrap: pretty` 減孤行。

## 4. 佈局

- 變化間距製造節奏，別等距。
- **卡片是偷懶的答案**，只在它確實是最佳 affordance 時用。**巢狀卡片永遠是錯的**。
- 1D 用 Flexbox，2D 用 Grid。別在 `flex-wrap` 夠用時預設 Grid。
- 免斷點的響應式網格：`repeat(auto-fit, minmax(280px, 1fr))`。
- 建語義化 z-index 階梯（dropdown → sticky → modal-backdrop → modal → toast → tooltip）。不要 999 / 9999。

## 5. 動效

- 動效是 build 的一部分，不是事後加。
- 別動畫 CSS layout 屬性（除非真的必要）。
- Ease-out 用指數曲線（quart / quint / expo）。**不要 bounce、不要 elastic**。
- 進階動效用庫（motion、gsap、anime.js、lenis）。
- `@media (prefers-reduced-motion: reduce)` **不是選配**，每個動畫都要有替代（crossfade 或瞬切）。
- 列表內 stagger 合法；tell 是「整頁每段套同一個入場」的反射，不是動效本身。
- **Reveal 動畫必須強化「已經可見」的預設**。別把內容可見性綁在 class 觸發的 transition 上——隱藏分頁與 headless 渲染下 transition 不跑，section 會空白上線。

## 6. 互動

- `position: absolute` 的 dropdown 放在 `overflow: hidden/auto` 容器裡會被裁切。用原生 `<dialog>` / popover API、`position: fixed`，或 portal 脫離 stacking context。

## 7. AI 味檢測（兩個高度都跑）

- **第一層**：光看品類就能猜中 theme + 配色 → 訓練資料反射。重寫場景句與色彩策略，直到答案不能從領域直接猜出。
- **第二層**：用「品類 + 反參照」就能猜中美學家族（「不是 SaaS-cream 的 AI 工具 → editorial-typographic」「不是藏青配金的 fintech → terminal dark」）→ 深一層的陷阱。改到兩層答案都不顯然。

- **第三層（迭代）**：第一版出來後，列出實際用了哪些樣式（底色、字體、標題手法、小標、按鈕形狀、版型）。其中沒有具體理由、只是預設反射的，具名加進禁止清單再出下一版。籠統的「避免 AI 味」只會把一個預設換成另一個；點名才有效。

判準：若有人能毫無疑問地說「這是 AI 做的」，就是沒過。

---

蒸餾自 [impeccable](https://github.com/pbakaus/impeccable)（Paul Bakaus, Apache 2.0）的設計守則。只取準則，不引入其 CLI / hook / runtime。
