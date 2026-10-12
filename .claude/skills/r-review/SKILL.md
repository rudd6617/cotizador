---
name: r-review
description: |
  Code review following project standards. Use when reviewing code, reading unfamiliar code,
  or when the user asks for a review or code quality assessment.
argument-hint: "[file or directory]"
---

Review the code at $ARGUMENTS following this structure.

無 `$ARGUMENTS` 時，預設審查當前 git diff（`git diff HEAD`；無未提交變更則退回 `git diff main...HEAD`）。

## 先找規格來源

審查分**兩軸**：內在品質（標準軸）與是否照票交付（規格軸）。規格軸需要一份規格，依序找：

1. `$ARGUMENTS` 直接給的 issue 編號 / URL / spec 路徑
2. diff 範圍內的 commit 訊息裡的 `#N`
3. 當前 branch 名稱裡的 issue 編號
4. 都沒有 → **明說「無規格來源，只跑標準軸」**，不要自己編一份規格出來審

找到就讀完 body 與驗收條件：專案有 `docs/backlog/` 就讀 `docs/backlog/<N>-*.md`（已在 diff 裡刪掉的用 `git show <base>:<路徑>` 讀），否則 `gh issue view <N> --comments`。

**兩軸並列呈現，不合併、不互相重排。** 一個嚴重的規格偏移與一個嚴重的品質問題不該互相稀釋。

---

# 標準軸

## 1. 品味評分

Give exactly one rating with a one-line justification:
- 🟢 好品味 — clean, minimal, well-structured
- 🟡 湊合 — works but has unnecessary complexity
- 🔴 需重寫 — fundamental issues

## 2. 致命問題

List any of these found (or explicitly state "none"):
- 邏輯錯誤
- 資源洩漏
- 安全漏洞
- 破壞性變更

## 3. 可消除的複雜性

Identify:
- 不必要的抽象
- 重複代碼
- 超過 3 層的嵌套

## 4. 數據結構合理性

Evaluate:
- 所有權是否清晰
- 生命週期是否合理
- 是否有不必要的複製或轉換

---

# 規格軸

無規格來源時整段跳過並說明。有的話逐項回答，每項**引用票上的原句**再對照 diff：

## 5. 驗收條件逐條核對

票上每一條驗收條件 → ✅ 已達成 / ⚠️ 部分 / ❌ 未達成。部分或未達成要指出缺哪一段。

## 6. 漏做

票上要求、diff 裡找不到對應改動的部分。包含票上明寫要測試而 diff 無測試的情況。

## 7. 做超出（scope creep）

diff 裡存在、但**追溯不回票上任何一條要求**的改動——順手的重構、formatting、多加的抽象、預先支援尚未要求的情境。這條對應 `AGENTS.md` 原則「只改該改的」：每一行改動都要能追溯到需求。

發現時給出：改了什麼 / 追溯不到哪條要求 / 建議（拆成另一張票，或就地移除）。
