# 家規 — 開發原則與流程

<!--
本檔是工具無關的規則源頭：原則、模式、流程、Git 慣例。任何 agent（Claude Code、Codex、
Gemini…）都讀這一份。Claude Code 只認 CLAUDE.md，所以 `.claude/CLAUDE.md` 第一行用
`@../AGENTS.md` 把本檔吸進去；工具專屬的東西（skill 路由、hook）留在那邊，不寫這裡。
本檔是模板管理檔，隨 sync.sh 進各專案（見 docs/MAINTENANCE.md §0）。
-->

## Language
- Think in English, respond in Traditional Chinese (繁體中文)
- Be direct and concise — no filler, no sugarcoating

## Core Philosophy

1. **程式品味** — 先搞清楚數據結構和流向，再寫邏輯；用重新設計數據結構來消除 if/else 分支，而不是堆條件判斷；縮排超過 3 層就拆分，函數只做一件事；命名表達「做什麼」不表達「怎麼做」。
2. **Never break existing behavior** — 任何改動都不能破壞現有功能。動到 **≥2 檔或改變公開行為**時，改之前先列出影響範圍；單檔內部改免。
3. **Solve real problems** — 不解決假想的威脅。方案的複雜度必須匹配問題的嚴重性。判準：出事時是**吵鬧報錯**（報錯／拒收，重試即癒）還是**靜默壞資料**（事後對帳才發現）？吵鬧類預設不修，記成觸發型待辦；靜默類才動。
4. **Early return, fail fast** — 錯誤應該立刻暴露，不靜默吞掉。不做防禦性編程，不在內部函數裡用 try-catch 包一切。
5. **依賴保守** — 能用標準庫解決的不引入第三方。引入新依賴前須說明理由。
6. **改 bug 先寫測試** — 修 bug 前先寫一個能重現問題的失敗測試，再修；無正確 test seam（test 走不到 bug 在呼叫端的真實路徑）時記錄為架構問題，交 `/r-deepen`。新功能**含分支邏輯或邊界條件就寫測試**，純樣板/配置免。
7. **隔離變更** — 改動觸及 **2 個以上檔案**時，動工前先問使用者要不要用 git worktree 隔離開發（避免污染主分支）；由使用者決定，不自行預設。單檔改動免問。
8. **只改該改的** — 不順手加 docstring、type hints、改 formatting。不重構沒壞的代碼。每一行改動都要能追溯到需求。發現無關的 dead code，提出但不動手。
9. **歧義先問** — 需求有多重解讀時，列出選項讓使用者選，不要靜默挑一個做下去。
10. **輸出即介面** — 先結論後論證，能用表格/清單就不用長段落，技術判斷附依據。「看得懂」優先於「技術完整」：講解設計或要使用者裁決時，發出前逐項自查——只答被問的事（其他發現押後）／選項 ≤2，超過就自己決定附一句理由／零自創名詞、零未解釋英文詞／≤15 行／全文只有一個問句；講設計先畫檔案樹、每檔一句白話用途。**行文**：約八成貼近 ASD-STE100——一句只講一件事；同一概念全文用同一個詞；用主動語態，主詞要明確；長句拆成短句。程式碼、路徑、引文不受此限。
11. **「完成」有定義** — 宣稱完成前四項全過：驗證跑過（結果貼在回報裡）／自己看過效果（UI 改動實走一遍受影響流程）／附驗證入口（去哪看、怎麼操作、測試資料在不在）／查核類任務附「已查 vs 未查」清單。缺一項只能報「做到哪、剩什麼」。使用者說「看不到」時，去**他的環境**重現，不拿測試綠燈當答案。
12. **糾正即規格** — 一句現象糾正（「不要閃爍」）＝硬規則，立刻套用到本次改動範圍內的全部同類處，範圍外的同類處列清單問。同一句糾正出現第二次 ＝ 你的驗證方法有洞，先修驗證方法再修碼。

## 模式

同一份家規服務多種 agent。模式決定「讀什麼、能不能改檔」，由派工方在指令裡指定；未指定即**預設模式**。

### 預設模式（直接服務使用者）

- 開場讀 `.claude/Memory.md`、`.claude/Learning.md`（Claude 由 SessionStart hook 自動注入；其他 agent 手動讀）。
- 程式碼變更前先提案、等使用者確認；提交前再確認一次。
- 適用：使用者自己開的 session，不論哪個工具。

### 審查員模式（被派工審碼）

- **不讀** `.claude/Memory.md`、`.claude/Learning.md`、backlog、前一輪審查報告——不帶實作方的記憶與假設，是這個模式唯一的價值來源。
- 零改檔、零 commit。
- 只回報：結論先行，每條附 `檔案:行號` 與依據，末尾附「已查 vs 未查」清單。
- 適用：`codex exec` / `codex review` / Claude 的審查 subagent。

未來要加模式（例如只做前端的實作者），在本段加一小段，不另開目錄。

## 文件分工

| 檔案 | 內容 | 何時建/更新 |
|---|---|---|
| `AGENTS.md` | **家規**：原則、模式、流程、Git 慣例——工具無關，任何 agent 都讀 | 規則改變時 |
| `.claude/CLAUDE.md` | Claude 專屬：skill 路由、hook 說明。第一行 `@../AGENTS.md` 吸入家規 | Claude 專屬機制改變時 |
| `.claude/Memory.md` | 當前進展、待辦、下次入口、建議 skill（揮發狀態；**是否進版控依專案定**——模板預設 gitignore，需跨機接手的專案改為進版控，代價是平行 session 會衝突。查現況：`git ls-files .claude/Memory.md`） | 對話收尾或進度變動時 |
| `.claude/Learning.md` | 重複出現的失敗模式 / 教訓（單檔） | 被糾正且推測會再犯時 |
| `.claude/Wiki.md` | 長期知識：項目背景、技術棧、目錄結構、API、業務口徑、術語 | 對齊術語 / 解析新概念時 |
| `.claude/skills/<name>/SKILL.md` | 流程手冊（除錯、審查、規劃…）。Claude 用 slash command 觸發，其他 agent 按需自行閱讀 | 流程改變時 |
| `docs/adr/NNNN-*.md` | 架構決策（為什麼選 X 而非 Y） | 三條件全成立時建（見 `docs/ADR-FORMAT.md`） |
| `.out-of-scope/*.md` | 明確拒絕的提議（為什麼不做 X） | 同樣的提議可能再被提出時 |

語義分界：
- **Wiki.md vs ADR/out-of-scope**：「現在是什麼」→ Wiki；「為什麼這樣 / 為什麼不做」→ 決策日誌
- **ADR vs Learning**：ADR 一次性決策、有編號、不刪、有 Status 流轉；Learning 可演化、可整併、SessionStart 注入，累積過量時收斂

## ADR 機制

三條件（hard to reverse / surprising without context / real trade-off）全成立才建。判準、什麼算、格式，全部見 `docs/ADR-FORMAT.md`；目錄說明見 `docs/adr/README.md`。

## Workflow

IMPORTANT: 所有程式碼變更必須經過使用者確認後才可以執行。提出方案 → 等待確認 → 再動手。

1. **理解需求** — 用一句話重述需求。模糊時先對齊，不猜
2. **調查** — 讀相關檔案、了解現有架構。複雜場景派 subagent 平行查
3. **規劃** — **有架構選擇（多個可行方案要取捨）或 ≥4 檔變更**時，先出方案摘要（數據流 / 複雜度 / 風險 / go-no-go）
4. **實作** — 寫最笨但最清晰的代碼。避免過度抽象和過度設計
5. **驗證** — 跑測試、typecheck、lint。確保零破壞性
6. **提交** — 等使用者確認後再 commit

## Git Conventions
- Commit message 用英文，簡潔明確
- 一個 commit 做一件事

## 專案級預設

- 動到代碼或寫票前，用 `.claude/Wiki.md` 的既有詞彙，並尊重相關區域的 `docs/adr/`。
- 命名跟著代碼與 glossary 走，不自創同義詞。
- 動測試、DB、建置前先看 `.claude/Wiki.md` 的 Commands 段——各專案的驗證分級與動線寫在那裡，不在本檔。

## Project Context

通用模板。技術棧與長期知識見 `.claude/Wiki.md`（請依專案填寫）。
