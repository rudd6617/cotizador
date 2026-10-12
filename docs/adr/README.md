# Architecture Decision Records

本目錄記錄專案中**值得留下原因**的架構決策。

## 何時建立 ADR

三條件全部成立才建，判準與「什麼算」的例子見 [../ADR-FORMAT.md](../ADR-FORMAT.md)。

## 命名規則

`NNNN-short-kebab-name.md`，編號連續遞增，不重用編號。

## 格式

見 [../ADR-FORMAT.md](../ADR-FORMAT.md)。

## 狀態流轉

- `Proposed` → `Accepted` → （需要時）`Superseded by ADR-XXXX`
- 不刪舊 ADR；廢止的標 Superseded，於 Status 註記取代它的 ADR 編號。
