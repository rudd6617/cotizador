import { useEffect, useState } from "react"
import { CompanyHeader } from "@/components/company-header"
import { api } from "@/lib/api"
import { useRoute, type Route } from "@/lib/route"
import { ClientList } from "@/pages/client-list"
import { Settings } from "@/pages/settings"
import { QuotationEditor } from "@/pages/quotation-editor"
import { QuotationList } from "@/pages/quotation-list"
import type { AppSettings, CompanyInfo } from "@/types/quotation"

interface PageProps {
  route: Route
  company: CompanyInfo
  settings: AppSettings
  onCompanySaved: (c: CompanyInfo) => void
  onSettingsSaved: (s: AppSettings) => void
}

function Page({ route, company, settings, onCompanySaved, onSettingsSaved }: PageProps) {
  switch (route.page) {
    case "quotations":
      return <QuotationList />
    case "clients":
      return <ClientList />
    case "settings":
      return (
        <Settings
          company={company}
          settings={settings}
          onCompanySaved={onCompanySaved}
          onSettingsSaved={onSettingsSaved}
        />
      )
    case "editor":
      return (
        <QuotationEditor
          key={`${route.number}|${route.copyFrom}`}
          number={route.number}
          copyFrom={route.copyFrom}
          company={company}
          defaultTemplate={settings.defaultTemplate}
        />
      )
  }
}

export default function App() {
  const route = useRoute()
  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [settings, setSettings] = useState<AppSettings | null>(null)

  useEffect(() => {
    const onError = (err: Error) => alert(`無法連線到後端：${err.message}`)
    api.getCompany().then(setCompany, onError)
    api.getSettings().then(setSettings, onError)
  }, [])

  if (!company || !settings) return <p className="p-8 text-gray-500">載入中...</p>

  return (
    <div className="min-h-screen bg-gray-100">
      <CompanyHeader company={company} active={route.page === "editor" ? "quotations" : route.page} />
      <Page
        route={route}
        company={company}
        settings={settings}
        onCompanySaved={setCompany}
        onSettingsSaved={setSettings}
      />
    </div>
  )
}
