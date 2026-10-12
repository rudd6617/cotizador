# ADR-NNNN: <短標題>

- **Status**: Proposed | Accepted | Superseded by ADR-XXXX
- **Date**: YYYY-MM-DD

## Context

為什麼現在要做這個決定？背景與壓力。

## Decision

我們選了什麼。一句話。

## Alternatives Considered

至少 2 個替代方案，每個附「為什麼沒選」。

## Consequences

- 正面：
- 負面：
- 觸發重評估的條件：

## 何時建

三條件**全部成立**才建：

1. **Hard to reverse** — 改回去成本高
2. **Surprising without context** — 未來讀者會問「為什麼這樣做」
3. **Real trade-off** — 真有替代方案

易回退的決定不必記——反正會回退；不意外的決定沒人會問為什麼；沒有真替代方案的決定，除了「我們做了顯而易見的事」沒東西可記。

## 什麼算

- **架構形狀** — 「用 monorepo」「寫模型 event-sourced，讀模型投影到 Postgres」
- **模組/服務間的整合方式** — 「A 與 B 走 domain event，不走同步 HTTP」
- **帶鎖定成本的技術選擇** — DB、message bus、auth provider、部署平台。不是每個 library，只有換掉要花一季的那種
- **邊界與範圍決定** — 「客戶資料由 X 模組擁有，其他模組只能持 ID 引用」。明確的「不做」跟「做」一樣有價值
- **刻意偏離顯而易見做法** — 「手寫 SQL 不用 ORM，因為 X」。任何讓合理讀者以為該反過來做的事——這能阻止下一個人「修好」一個刻意的設計
- **代碼裡看不到的約束** — 「合規要求不能用 AWS」「回應時間必須 <200ms，因為夥伴 API 合約」
- **拒絕理由不顯然的替代方案** — 若曾評估 GraphQL 而因微妙理由選了 REST，記下來；否則半年後有人會再提一次
