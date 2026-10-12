import { useEffect, useState } from "react"
import { CompanyHeader } from "@/components/company-header"
import { api } from "@/lib/api"
import { useRoute, type Route } from "@/lib/route"
import { ClientList } from "@/pages/client-list"
import { QuotationEditor } from "@/pages/quotation-editor"
import { QuotationList } from "@/pages/quotation-list"
import type { CompanyInfo } from "@/types/quotation"

function Page({ route, company }: { route: Route; company: CompanyInfo }) {
  switch (route.page) {
    case "quotations":
      return <QuotationList />
    case "clients":
      return <ClientList />
    case "editor":
      return (
        <QuotationEditor
          key={`${route.number}|${route.copyFrom}`}
          number={route.number}
          copyFrom={route.copyFrom}
          company={company}
        />
      )
  }
}

export default function App() {
  const route = useRoute()
  const [company, setCompany] = useState<CompanyInfo | null>(null)

  useEffect(() => {
    api.getCompany().then(setCompany, (err: Error) => alert(`無法連線到後端：${err.message}`))
  }, [])

  if (!company) return <p className="p-8 text-gray-500">載入中...</p>

  return (
    <div className="min-h-screen bg-gray-100">
      <CompanyHeader company={company} active={route.page === "clients" ? "clients" : "quotations"} />
      <Page route={route} company={company} />
    </div>
  )
}
