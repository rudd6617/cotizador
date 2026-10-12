import { useSyncExternalStore } from "react"

export type Route =
  | { page: "quotations" }
  | { page: "editor"; number: string | null; copyFrom: string | null }
  | { page: "clients" }
  | { page: "settings" }

/**
 * #/                         報價單列表
 * #/quotations/new           新增報價單
 * #/quotations/new?from=X    複製 X 成新報價單
 * #/quotations/X             編輯 X
 * #/clients                  客戶資料
 * #/settings                 公司資料設定
 */
export function parseRoute(hash: string): Route {
  const [path, query] = hash.replace(/^#/, "").split("?")
  if (path === "/clients") return { page: "clients" }
  if (path === "/settings") return { page: "settings" }
  const match = path.match(/^\/quotations\/(.+)$/)
  if (!match) return { page: "quotations" }
  if (match[1] === "new") {
    return { page: "editor", number: null, copyFrom: new URLSearchParams(query).get("from") }
  }
  return { page: "editor", number: decodeURIComponent(match[1]), copyFrom: null }
}

function subscribe(onChange: () => void) {
  window.addEventListener("hashchange", onChange)
  return () => window.removeEventListener("hashchange", onChange)
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash)
  return parseRoute(hash)
}

export const href = {
  quotations: () => "#/",
  newQuotation: () => "#/quotations/new",
  copyQuotation: (number: string) => `#/quotations/new?from=${encodeURIComponent(number)}`,
  quotation: (number: string) => `#/quotations/${encodeURIComponent(number)}`,
  clients: () => "#/clients",
  settings: () => "#/settings",
}

export function navigate(to: string) {
  window.location.hash = to
}
