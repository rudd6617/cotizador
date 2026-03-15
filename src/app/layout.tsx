import type { Metadata } from "next"
import { Noto_Sans_TC } from "next/font/google"
import "./globals.css"

const notoSansTC = Noto_Sans_TC({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-noto-sans-tc",
})

export const metadata: Metadata = {
  title: "報價單產生器",
  description: "快速建立專業報價單並匯出 PDF",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-TW">
      <body className={`${notoSansTC.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  )
}
