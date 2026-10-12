import { Document, Page, View, Text, Image, StyleSheet } from "@react-pdf/renderer"
import type { Quotation } from "@/types/quotation"
import {
  amountInWords,
  calcLineAmount,
  calcSubtotal,
  calcTax,
  calcTotal,
  formatNumber,
  getCurrencySymbol,
} from "@/lib/format"
import { COLORS } from "@/lib/design-tokens"
import { classicClientLines, classicCompanyLines, classicMetaLines, type LabeledLine } from "@/lib/templates"
import "./fonts"

const LINE = "#111827"
const HEAD_BG = "#f3f4f6"

// 表格框線：外框畫上、左，每格畫右、下，避免線條重疊加粗
const s = StyleSheet.create({
  page: {
    fontFamily: "Noto Sans TC",
    fontSize: 9,
    padding: "42 45",
    color: COLORS.text,
    gap: 12,
  },

  companyBlock: { flexDirection: "row", alignItems: "flex-start", gap: 9 },
  companyText: { gap: 2 },
  logo: { width: 36, height: 36 },
  companyName: { fontSize: 14, fontWeight: 700, letterSpacing: 2 },
  companyDetail: { fontSize: 8, color: COLORS.textMedium },

  titleBlock: { alignItems: "center", gap: 3 },
  title: { fontSize: 20, fontWeight: 700, letterSpacing: 12, paddingLeft: 12 },
  titleRule: { width: 105, borderTopWidth: 1, borderBottomWidth: 1, borderColor: LINE, height: 3 },

  infoRow: { flexDirection: "row", justifyContent: "space-between", gap: 24 },
  lines: { gap: 3 },

  table: { borderTopWidth: 1, borderLeftWidth: 1, borderColor: LINE },
  row: { flexDirection: "row" },
  cell: { borderRightWidth: 1, borderBottomWidth: 1, borderColor: LINE, padding: "5 7" },
  head: { backgroundColor: HEAD_BG },
  center: { textAlign: "center" },
  right: { textAlign: "right" },
  bold: { fontWeight: 700 },
  muted: { color: COLORS.textMedium, fontSize: 8 },
  tall: { minHeight: 27 },

  signWrap: { alignItems: "flex-end", marginTop: 12 },
  signTable: { width: 216 },
  signBox: { height: 72 },
})

// 品項表欄寬；金額小計區的左格 = 前五欄合計
const COL = { no: "7%", name: "25%", spec: "16%", qty: "8%", unit: "8%", price: "17%", amount: "19%", words: "64%" }
const INFO_LABEL = "15%"

// 全形空白留給客戶手寫年月日
const SIGN_DATE = "日期：\u3000\u3000\u3000年\u3000\u3000月\u3000\u3000日"

function Lines({ lines }: { lines: LabeledLine[] }) {
  return (
    <View style={s.lines}>
      {lines.map((l) => (
        <Text key={l.label}>
          {l.label}：{l.value}
        </Text>
      ))}
    </View>
  )
}

type NamedStyle = (typeof s)[keyof typeof s]

function Cell({ width, style, children }: { width: string; style?: NamedStyle[]; children?: React.ReactNode }) {
  return (
    <View style={[s.cell, { width }, ...(style ?? [])]}>
      <Text>{children}</Text>
    </View>
  )
}

interface Props {
  data: Quotation
}

export function QuotationDocumentClassic({ data }: Props) {
  const { company, client, meta, items, taxRate, paymentTerms, notes, showTermsAndNotes } = data
  const subtotal = calcSubtotal(items)
  const tax = calcTax(subtotal, taxRate)
  const total = calcTotal(subtotal, tax)
  const sym = getCurrencySymbol(meta.currency)
  const words = amountInWords(total, meta.currency)
  const companyLines = classicCompanyLines(company)

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* 1. Company (left, above title) */}
        <View style={s.companyBlock}>
          {company.logo && <Image src={company.logo} style={s.logo} />}
          <View style={s.companyText}>
            <Text style={s.companyName}>{company.name}</Text>
            {companyLines.map((l) => (
              <Text key={l.label} style={s.companyDetail}>
                {l.label}：{l.value}
              </Text>
            ))}
          </View>
        </View>

        {/* 2. Title */}
        <View style={s.titleBlock}>
          <Text style={s.title}>報價單</Text>
          <View style={s.titleRule} />
        </View>

        {/* 3. Client (left) | Meta (right) */}
        <View style={s.infoRow}>
          <Lines lines={classicClientLines(client)} />
          <Lines lines={classicMetaLines(meta, company.quoter)} />
        </View>

        {/* 4. Items + totals */}
        <View style={s.table}>
          <View style={[s.row, s.head]} fixed>
            <Cell width={COL.no} style={[s.center]}>項次</Cell>
            <Cell width={COL.name}>品名</Cell>
            <Cell width={COL.spec}>規格</Cell>
            <Cell width={COL.qty} style={[s.center]}>數量</Cell>
            <Cell width={COL.unit} style={[s.center]}>單位</Cell>
            <Cell width={COL.price} style={[s.right]}>單價</Cell>
            <Cell width={COL.amount} style={[s.right]}>金額</Cell>
          </View>
          {items.map((item, i) => (
            <View key={item.id} style={s.row} wrap={false}>
              <Cell width={COL.no} style={[s.center]}>{i + 1}</Cell>
              <Cell width={COL.name}>{item.name}</Cell>
              <Cell width={COL.spec}>{item.spec}</Cell>
              <Cell width={COL.qty} style={[s.right]}>{formatNumber(item.quantity)}</Cell>
              <Cell width={COL.unit} style={[s.center]}>{item.unit}</Cell>
              <Cell width={COL.price} style={[s.right]}>{sym} {formatNumber(item.unitPrice)}</Cell>
              <Cell width={COL.amount} style={[s.right]}>{sym} {formatNumber(calcLineAmount(item))}</Cell>
            </View>
          ))}
          <View style={s.row} wrap={false}>
            <Cell width={COL.words} style={[s.muted]}>{words}</Cell>
            <View style={{ width: "36%" }}>
              <View style={s.row}>
                <Cell width="47.2%" style={[s.right]}>小計</Cell>
                <Cell width="52.8%" style={[s.right]}>{sym} {formatNumber(subtotal)}</Cell>
              </View>
              <View style={s.row}>
                <Cell width="47.2%" style={[s.right]}>營業稅 {(taxRate * 100).toFixed(0)}%</Cell>
                <Cell width="52.8%" style={[s.right]}>{sym} {formatNumber(tax)}</Cell>
              </View>
              <View style={s.row}>
                <Cell width="47.2%" style={[s.right, s.bold]}>總計</Cell>
                <Cell width="52.8%" style={[s.right, s.bold]}>{sym} {formatNumber(total)}</Cell>
              </View>
            </View>
          </View>
        </View>

        {/* 5. Payment terms & notes */}
        {showTermsAndNotes && (
          <View style={s.table} wrap={false}>
            <View style={s.row}>
              <Cell width={INFO_LABEL} style={[s.head]}>付款條件</Cell>
              <Cell width="85%" style={[s.tall]}>{paymentTerms}</Cell>
            </View>
            <View style={s.row}>
              <Cell width={INFO_LABEL} style={[s.head]}>備註</Cell>
              <Cell width="85%" style={[s.tall]}>{notes}</Cell>
            </View>
          </View>
        )}

        {/* 6. Client signature */}
        <View style={s.signWrap} wrap={false}>
          <View style={[s.table, s.signTable]}>
            <View style={s.row}>
              <Cell width="100%" style={[s.head, s.center]}>客戶確認簽章</Cell>
            </View>
            <View style={s.row}>
              <View style={[s.cell, s.signBox, { width: "100%" }]} />
            </View>
            <View style={s.row}>
              <Cell width="100%">{SIGN_DATE}</Cell>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}
