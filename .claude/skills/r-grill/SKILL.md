---
name: r-grill
description: |
  Pre-implementation alignment via relentless interview.
  Walk the design tree in rounds, asking the whole answerable frontier each time;
  maintains Wiki.md vocabulary and proposes ADRs when decisions qualify.
  Use when requirements are fuzzy or before any non-trivial /r-plan.
disable-model-invocation: true
argument-hint: "[need or feature description]"
---

Grill: $ARGUMENTS

把這個需求畫成**設計樹**：每個決定都分岔出掛在它下面的決定。質問到我們達成共同理解。

## 開場

`.claude/Wiki.md`（術語段）與 `docs/adr/` 有內容就先讀，把既有詞彙與既有決策納入問答上下文——你要質問的是「這次的需求跟已經定案的東西是否一致」，不是從零開始。

## 輪次與 frontier

**frontier** = 所有「前置條件已定案」的決定，也就是不必猜測未知答案就能問的題。

**一輪問完整個 frontier**：每題編號、附推薦答案，然後停下來等我回答。我的回答會重塑樹形——已定案的決定把 frontier 往外推，解鎖依賴它們的題。重算 frontier，問下一輪。

**答案依賴本輪其他未決題的問題，屬於後面的輪次**，不是這輪。

## 輪次格式

```
❓ **Q1** - **<題目標題>**：<題目內容，可含多個選項>

➡️ <我的推薦答案與理由>

---

❓ **Q2** - **<題目標題>**：<題目內容>

➡️ <我的推薦答案與理由>
```

## 規則

1. **每題附我的推薦答案**——不只問「你想 X 還是 Y？」而是「我傾向 X，因為 Z；你？」
2. **找事實是我的工作，不是你的**——frontier 上的題需要環境事實（代碼、檔案、工具輸出）時，自己去查或派 subagent。**不要因此卡住整輪**：正在跑的調查只是一個未定前置條件，只有下游的題要等它，frontier 其餘的題現在就問。**決定是你的**，逐題交給你等回答。
3. **拒絕模糊措辭**：你說「account」時逼問「Customer 還是 User？這是兩個不同 entity」。提議精準的標準術語。
4. **對照既有 glossary**：你用的術語衝突於 `.claude/Wiki.md` 既有定義時**立即點出**：「你的 glossary 把 cancellation 定義為 X，但你似乎指 Y——是哪個？」
5. **對照代碼**：你描述某機制如何運作時，檢查代碼是否同意。矛盾立刻 surface：「你的代碼整單取消 Order，但你剛說可以部分取消——哪個是對的？」
6. **用具體情境壓測**：邊界、極端、衝突情境。「若 A 和 B 同時發生，誰贏？」
7. **前面決定改變後面選項時，回頭重訪**已問過的分支。

## 文件維護（條件觸發）

以下兩件**只在條件成立時做**，不是每次 grill 的必要動作。判準是這次 grill 產生了什麼，不是需求有多複雜。

### 更新 Wiki.md 術語段

**觸發條件**：這次為了對齊而**真的重新定義了一個領域術語**（或解掉了一個術語衝突）。單純澄清實作細節**不寫**。

術語解析的**當下**就寫，不批次累積。寫法（**要有主張**：同一概念有多個說法時挑一個最好的，其餘列進 `_Avoid_` 明確拒絕）：

```md
**Order**：
客戶下的一筆採購請求，成立後即進入履約流程。
_Avoid_: Purchase, Transaction

**Customer**：
下單的個人或組織。
_Avoid_: Client, Buyer, Account
```

- 定義要**緊**：一到兩句，講它**是什麼**，不講它做什麼。
- 只收**這個專案領域特有**的術語。通用程式概念（timeout、error type、utility pattern）不進來，即使專案大量使用。加之前先問：這是本領域獨有的概念，還是通用程式概念？只有前者該進。
- 術語自然叢聚時用子標題分組；同一區塊則平鋪即可。
- **用語模糊處明確標註解法**：「本專案的『取消』一律指整單取消；部分退貨另立術語」。

### 提議 ADR

**觸發條件**：三條件**全部成立**——hard to reverse / surprising without context / real trade-off。任一不成立，跳過。

判準展開、什麼算 ADR、格式，全部見 `docs/ADR-FORMAT.md`；新增 ADR 寫入 `docs/adr/NNNN-*.md`。

## 何時停

**frontier 空了**：設計樹每個分支都走過，沒有任何東西是默默假設的。此時用一段話總結需求給你確認，確認前不動工。有觸發文件維護的話，一併報告寫了什麼進 Wiki / 提議了哪個 ADR。

## 與 /r-plan 的銜接

grill 結束後，若需求複雜到需要架構選擇，呼叫 `/r-plan` 進入收斂。簡單變更可直接動工。
