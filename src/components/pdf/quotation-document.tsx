import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  Font,
} from "@react-pdf/renderer"
import path from "path"
import type { Quotation } from "@/types/quotation"
import {
  calcLineAmount,
  calcSubtotal,
  calcTax,
  calcTotal,
  formatNumber,
  getCurrencySymbol,
} from "@/lib/format"
import { COLORS } from "@/lib/design-tokens"

Font.register({
  family: "Noto Sans TC",
  src: path.join(process.cwd(), "public/fonts/NotoSansTC.ttf"),
})

Font.registerHyphenationCallback((word) => [word])

const s = StyleSheet.create({
  page: {
    fontFamily: "Noto Sans TC",
    fontSize: 9,
    padding: 40,
    paddingBottom: 60,
    color: COLORS.text,
  },

  // 1. Title block
  titleBlock: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: COLORS.accent,
    letterSpacing: 8,
  },
  titleMeta: {
    alignItems: "flex-end",
    gap: 2,
  },
  titleMetaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  titleMetaLabel: {
    fontSize: 8,
    color: COLORS.muted,
    width: 45,
  },
  titleMetaValue: {
    fontSize: 8,
    fontWeight: 700,
    color: COLORS.textMedium,
  },

  // 2. Two-column info
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    gap: 20,
  },
  infoCol: {
    flex: 1,
  },
  infoColWithLogo: {
    flex: 1,
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
  },
  logo: {
    width: 44,
    height: 44,
  },
  infoLabel: {
    fontSize: 7,
    color: COLORS.muted,
    letterSpacing: 1,
    marginBottom: 6,
  },
  infoName: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 3,
    color: COLORS.accent,
  },
  infoDetail: {
    fontSize: 8,
    color: COLORS.textMedium,
    marginTop: 2,
  },

  // 3. Table
  tableHeader: {
    flexDirection: "row",
    backgroundColor: COLORS.accent,
    padding: "7 10",
    borderRadius: 3,
  },
  tableHeaderText: {
    color: COLORS.white,
    fontSize: 7.5,
    fontWeight: 700,
    letterSpacing: 0.3,
  },
  tableRow: {
    flexDirection: "row",
    padding: "7 10",
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tableRowAlt: {
    backgroundColor: COLORS.bgAlt,
  },
  colNo: { width: "6%", textAlign: "center" },
  colDesc: { width: "40%" },
  colQty: { width: "12%", textAlign: "right" },
  colUnit: { width: "12%", textAlign: "center" },
  colPrice: { width: "15%", textAlign: "right" },
  colAmount: { width: "15%", textAlign: "right" },

  // 4. Totals
  totalsWrap: {
    alignItems: "flex-end",
    marginTop: 12,
    marginBottom: 20,
  },
  totalsBlock: {
    width: "40%",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
  },
  totalLabel: {
    fontSize: 9,
    color: COLORS.muted,
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 700,
  },
  totalFinalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: "9 12",
    backgroundColor: COLORS.accent,
    borderRadius: 4,
    marginTop: 4,
  },
  totalFinalLabel: {
    fontSize: 11,
    fontWeight: 700,
    color: COLORS.white,
  },
  totalFinalValue: {
    fontSize: 14,
    fontWeight: 700,
    color: COLORS.white,
  },

  // 5. Notes
  notesBox: {
    backgroundColor: COLORS.bgAlt,
    padding: 14,
    borderRadius: 4,
    marginTop: 8,
  },
  notesLabel: {
    fontSize: 7,
    color: COLORS.muted,
    letterSpacing: 1,
    marginBottom: 6,
  },
  notesText: {
    fontSize: 8.5,
    lineHeight: 1.6,
    color: COLORS.textMedium,
  },
  notesSpacer: {
    marginTop: 10,
  },
})

interface Props {
  data: Quotation
}

export function QuotationDocument({ data }: Props) {
  const { company, client, meta, items, taxRate, paymentTerms, notes } = data
  const subtotal = calcSubtotal(items)
  const tax = calcTax(subtotal, taxRate)
  const total = calcTotal(subtotal, tax)
  const sym = getCurrencySymbol(meta.currency)

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* 1. Title (left) + meta (right) */}
        <View style={s.titleBlock}>
          <Text style={s.title}>報價單</Text>
          <View style={s.titleMeta}>
            <View style={s.titleMetaRow}>
              <Text style={s.titleMetaLabel}>報價編號</Text>
              <Text style={s.titleMetaValue}>{meta.quotationNumber}</Text>
            </View>
            <View style={s.titleMetaRow}>
              <Text style={s.titleMetaLabel}>報價日期</Text>
              <Text style={s.titleMetaValue}>{meta.date}</Text>
            </View>
          </View>
        </View>

        {/* 2. Quoter (left) | Client (right) */}
        <View style={s.infoRow}>
          <View style={company.logo ? s.infoColWithLogo : s.infoCol}>
            {company.logo && <Image src={company.logo} style={s.logo} />}
            <View>
              {company.name ? (
                <Text style={s.infoName}>{company.name}</Text>
              ) : null}
              <Text style={s.infoDetail}>聯絡人：{company.quoter}</Text>
              <Text style={s.infoDetail}>聯絡電話：{company.phone}</Text>
              <Text style={s.infoDetail}>聯絡信箱：{company.email}</Text>
              {company.address ? (
                <Text style={s.infoDetail}>{company.address}</Text>
              ) : null}
              {company.taxId ? (
                <Text style={s.infoDetail}>統一編號：{company.taxId}</Text>
              ) : null}
            </View>
          </View>

          <View style={s.infoCol}>
            <Text style={s.infoDetail}>客戶名稱：{client.company}</Text>
            {client.contactPerson ? (
              <Text style={s.infoDetail}>
                聯絡人：{client.contactPerson}
              </Text>
            ) : null}
            {client.address ? (
              <Text style={s.infoDetail}>{client.address}</Text>
            ) : null}
            {client.phone ? (
              <Text style={s.infoDetail}>電話：{client.phone}</Text>
            ) : null}
            {client.email ? (
              <Text style={s.infoDetail}>Email：{client.email}</Text>
            ) : null}
          </View>
        </View>

        {/* 3. Items Table */}
        <View>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderText, s.colNo]}>#</Text>
            <Text style={[s.tableHeaderText, s.colDesc]}>品項說明</Text>
            <Text style={[s.tableHeaderText, s.colQty]}>數量</Text>
            <Text style={[s.tableHeaderText, s.colUnit]}>單位</Text>
            <Text style={[s.tableHeaderText, s.colPrice]}>單價</Text>
            <Text style={[s.tableHeaderText, s.colAmount]}>金額</Text>
          </View>
          {items.map((item, i) => (
            <View
              key={item.id}
              style={i % 2 === 1 ? [s.tableRow, s.tableRowAlt] : s.tableRow}
            >
              <Text style={s.colNo}>{i + 1}</Text>
              <Text style={s.colDesc}>{item.description}</Text>
              <Text style={s.colQty}>{formatNumber(item.quantity)}</Text>
              <Text style={s.colUnit}>{item.unit}</Text>
              <Text style={s.colPrice}>
                {sym} {formatNumber(item.unitPrice)}
              </Text>
              <Text style={s.colAmount}>
                {sym} {formatNumber(calcLineAmount(item))}
              </Text>
            </View>
          ))}
        </View>

        {/* 4. Totals */}
        <View style={s.totalsWrap}>
          <View style={s.totalsBlock}>
            <View style={s.totalRow}>
              <Text style={s.totalLabel}>小計</Text>
              <Text style={s.totalValue}>
                {sym} {formatNumber(subtotal)}
              </Text>
            </View>
            {taxRate > 0 && (
              <View style={s.totalRow}>
                <Text style={s.totalLabel}>
                  稅金 ({(taxRate * 100).toFixed(0)}%)
                </Text>
                <Text style={s.totalValue}>
                  {sym} {formatNumber(tax)}
                </Text>
              </View>
            )}
            <View style={s.totalFinalRow}>
              <Text style={s.totalFinalLabel}>總計</Text>
              <Text style={s.totalFinalValue}>
                {sym} {formatNumber(total)}
              </Text>
            </View>
          </View>
        </View>

        {/* 5. Notes */}
        {(paymentTerms || notes) && (
          <View style={s.notesBox}>
            {paymentTerms && (
              <View>
                <Text style={s.notesLabel}>付款條件</Text>
                <Text style={s.notesText}>{paymentTerms}</Text>
              </View>
            )}
            {paymentTerms && notes && <View style={s.notesSpacer} />}
            {notes && (
              <View>
                <Text style={s.notesLabel}>備註</Text>
                <Text style={s.notesText}>{notes}</Text>
              </View>
            )}
          </View>
        )}
      </Page>
    </Document>
  )
}
