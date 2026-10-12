import { cn } from "@/lib/utils"
import { href } from "@/lib/route"
import type { CompanyInfo } from "@/types/quotation"

interface Props {
  company: CompanyInfo
  active: "quotations" | "clients"
}

const NAV = [
  { key: "quotations", label: "報價單", to: href.quotations() },
  { key: "clients", label: "客戶", to: href.clients() },
] as const

export function CompanyHeader({ company, active }: Props) {
  const details = [company.taxId && `統編 ${company.taxId}`, company.address, company.phone, company.email]
    .filter(Boolean)
    .join(" ・ ")

  return (
    <header className="flex flex-wrap items-center justify-between gap-6 bg-slate-800 px-8 py-5 text-slate-50">
      <div className="flex items-center gap-4">
        {company.logo && <img src={company.logo} alt="" className="h-12 w-12 rounded bg-white object-contain p-1" />}
        <div>
          <div className="text-xl font-bold tracking-wide">{company.name}</div>
          <div className="mt-1 text-sm text-slate-300">{details}</div>
        </div>
      </div>
      <nav aria-label="主選單" className="flex gap-2">
        {NAV.map((item) => (
          <a
            key={item.key}
            href={item.to}
            className={cn(
              "rounded-md px-4 py-2.5 text-sm",
              item.key === active
                ? "bg-slate-50 font-medium text-slate-900"
                : "border border-slate-600 text-slate-50 hover:bg-slate-700",
            )}
          >
            {item.label}
          </a>
        ))}
      </nav>
    </header>
  )
}
