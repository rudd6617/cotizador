# ADR-0001: Quotation 儲存 Client 快照，不只存 Client 參照

- **Status**: Accepted
- **Date**: 2026-10-12

## Context

報價單產生器要改成報價單管理系統，新增客戶資料（Client）。開單時從客戶資料選 Client。
Client 的地址、聯絡人會變動，但已送出的報價單是對外文件，內容不應在事後被改動。

## Decision

儲存 Quotation 時，把當下的 Client 資料複製一份存進該 Quotation（Client Snapshot），同時保留 Client 參照供查詢與統計。

## Alternatives Considered

- **只存 Client 參照，顯示時即時讀取**：資料不重複，但 Client 改地址後，舊報價單的 PDF 會跟著變，與當初送出的文件不一致。
- **Client 資料做版本紀錄，Quotation 參照特定版本**：正確但複雜，第一版不需要。

## Consequences

- 正面：已存的 Quotation 與送出時內容一致；重新下載 PDF 結果不變。
- 負面：同一份 Client 資料存多份；改 Client 資料不會更新舊單，要更新舊單得手動修改該單。
- 觸發重評估的條件：需要「批次更新某 Client 所有未送出報價單」時。
