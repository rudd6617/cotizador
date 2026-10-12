import type {
  Client,
  ClientInfo,
  ClientWithCount,
  CompanyInfo,
  QuotationRecord,
  QuotationStatus,
  QuotationSummary,
} from "@/types/quotation"

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) {
    const { error } = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(error)
  }
  return res.status === 204 ? (undefined as T) : res.json()
}

export const api = {
  getCompany: () => request<CompanyInfo>("GET", "/company"),
  updateCompany: (c: CompanyInfo) => request<CompanyInfo>("PUT", "/company", c),

  listClients: () => request<ClientWithCount[]>("GET", "/clients"),
  createClient: (c: ClientInfo) => request<Client>("POST", "/clients", c),
  updateClient: (id: number, c: ClientInfo) => request<Client>("PUT", `/clients/${id}`, c),
  deleteClient: (id: number) => request<void>("DELETE", `/clients/${id}`),

  listQuotations: (filter: { q: string; status: QuotationStatus | "" }) =>
    request<QuotationSummary[]>("GET", `/quotations?${new URLSearchParams(filter)}`),
  getQuotation: (number: string) => request<QuotationRecord>("GET", `/quotations/${number}`),
  createQuotation: (r: QuotationRecord) => request<QuotationRecord>("POST", "/quotations", r),
  updateQuotation: (number: string, r: QuotationRecord) =>
    request<QuotationRecord>("PUT", `/quotations/${number}`, r),
  deleteQuotation: (number: string) => request<void>("DELETE", `/quotations/${number}`),
}
