---
name: r-eli5
description: |
  Explain a topic, mechanism, or piece of code to someone who knows nothing
  about it — as an HTML artifact of big pictures and very few words.
  Use when asked to explain something for a non-expert audience, or to make
  an explainer for a manager / colleague / outsider.
disable-model-invocation: true
argument-hint: "[topic, file, or mechanism to explain]"
---

Explain: $ARGUMENTS

把這個主題解釋給**完全不懂的人**，產出一份 HTML artifact：**大圖、極少字**。

## 規則

1. **圖優先，字最少** — 主要載體是圖示；文字只做標註。塞不進圖的細節就是不該講的細節。
2. **先講「是什麼 / 為什麼存在」，再講「怎麼運作」** — 沒人在意機制，除非先知道它為何存在。
3. **一個類比撐全篇** — 選一個聽眾已知的事物貫穿到底，不要每段換一個比喻。
4. **80% 準確度勝過講到聽眾流失** — 主題真的複雜時，果斷簡化；但不能講成錯的。
5. **不居高臨下** — 簡化是為了好懂，不是把人當笨蛋。
6. **繁中輸出**，術語首次出現時給原文（如「快取（cache）」）。

## 預設聽眾

未指定時，預設「聰明但完全不懂這個領域的成年人」，不是五歲小孩。指定了聽眾（主管 / 同事 / 家人 / 特定角色）就據此校準類比與在意的點：主管在意影響與決策，家人在意生活類比。

## 產出

依 `artifact-design`（必讀）與 `artifact-diagramming` 的規範產 HTML，發布成 artifact 後把連結給用戶。

**環境不支援 artifact 發布時**：寫成單一自帶樣式的本地 HTML 檔（放 scratchpad 或用戶指定位置），用 `xdg-open` / `open` 開起來，並把路徑給用戶。不要因為不能發布就退化成純文字聊天——**輸出媒介是這支 skill 的全部價值**。

## 與其他 skill 的界線

- 給**別人**看的一次性解釋 → 本 skill
