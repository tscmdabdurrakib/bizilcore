import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 11, fontFamily: "Helvetica", backgroundColor: "#FFFFFF" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 24, paddingBottom: 16, borderBottomWidth: 2, borderBottomColor: "#0F6E56" },
  shopName: { fontSize: 18, fontWeight: "bold", color: "#0F6E56" },
  shopMeta: { fontSize: 9, color: "#5A5A56", marginTop: 2 },
  invoiceLabel: { fontSize: 22, fontWeight: "bold", color: "#0F6E56", textAlign: "right" },
  invoiceNum: { fontSize: 11, color: "#5A5A56", textAlign: "right" },
  section: { marginBottom: 16 },
  sectionLabel: { fontSize: 9, fontWeight: "bold", color: "#A8A69E", textTransform: "uppercase", marginBottom: 4 },
  bodyText: { fontSize: 10, color: "#1A1A18", lineHeight: 1.5 },
  table: { marginBottom: 16 },
  tableHeader: { flexDirection: "row", backgroundColor: "#0F6E56", padding: "6 8", marginBottom: 0 },
  tableHeaderCell: { color: "#FFFFFF", fontSize: 9, fontWeight: "bold" },
  tableRow: { flexDirection: "row", padding: "6 8", borderBottomWidth: 1, borderBottomColor: "#E8E6DF" },
  tableRowAlt: { flexDirection: "row", padding: "6 8", backgroundColor: "#F7F6F2", borderBottomWidth: 1, borderBottomColor: "#E8E6DF" },
  tableCell: { fontSize: 10, color: "#1A1A18" },
  colName: { flex: 3 },
  colQty: { flex: 1, textAlign: "center" },
  colPrice: { flex: 1.5, textAlign: "right" },
  colTotal: { flex: 1.5, textAlign: "right" },
  summaryRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 4 },
  summaryLabel: { fontSize: 10, color: "#5A5A56", width: 100, textAlign: "right", marginRight: 8 },
  summaryValue: { fontSize: 10, color: "#1A1A18", width: 80, textAlign: "right" },
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 6, paddingTop: 6, borderTopWidth: 2, borderTopColor: "#0F6E56" },
  totalLabel: { fontSize: 12, fontWeight: "bold", color: "#0F6E56", width: 100, textAlign: "right", marginRight: 8 },
  totalValue: { fontSize: 12, fontWeight: "bold", color: "#0F6E56", width: 80, textAlign: "right" },
  dueRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 4 },
  dueLabel: { fontSize: 10, color: "#E24B4A", width: 100, textAlign: "right", marginRight: 8 },
  dueValue: { fontSize: 10, color: "#E24B4A", width: 80, textAlign: "right" },
  footer: { marginTop: 32, paddingTop: 16, borderTopWidth: 1, borderTopColor: "#E8E6DF", textAlign: "center" },
  footerText: { fontSize: 10, color: "#5A5A56" },
});

export interface InvoiceData {
  orderId: string;
  createdAt: string;
  shop: { name: string; phone?: string | null };
  customer?: { name: string; phone?: string | null; address?: string | null } | null;
  items: { quantity: number; unitPrice: number; subtotal: number; resolvedName?: string; product?: { name: string } | null }[];
  totalAmount: number;
  paidAmount: number;
  dueAmount: number;
}

function fmt(n: number) {
  return `৳${n.toLocaleString("en-BD", { minimumFractionDigits: 0 })}`;
}

export interface ShopInvoiceData {
  invoiceNumber: string;
  createdAt: string;
  dueDate?: string | null;
  shop: {
    name: string;
    phone?: string | null;
    address?: string | null;
    invoiceNote?: string | null;
    bankName?: string | null;
    bankAccount?: string | null;
  };
  customer?: { name: string; phone?: string | null; address?: string | null } | null;
  items: { description: string; quantity: number; unitPrice: number; subtotal: number }[];
  subtotal: number;
  discount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  notes?: string | null;
}

export function ShopInvoiceDocument({ data }: { data: ShopInvoiceData }) {
  const dateStr = new Date(data.createdAt).toLocaleDateString("en-BD", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const due = Math.max(0, data.total - data.paidAmount);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.shopName}>{data.shop.name}</Text>
            {data.shop.phone && <Text style={styles.shopMeta}>{data.shop.phone}</Text>}
            {data.shop.address && <Text style={styles.shopMeta}>{data.shop.address}</Text>}
          </View>
          <View>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={styles.invoiceNum}>{data.invoiceNumber}</Text>
            <Text style={styles.invoiceNum}>{dateStr}</Text>
            {data.dueDate && (
              <Text style={styles.invoiceNum}>
                Due: {new Date(data.dueDate).toLocaleDateString("en-BD")}
              </Text>
            )}
          </View>
        </View>

        {data.customer && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Bill To</Text>
            <Text style={styles.bodyText}>{data.customer.name}</Text>
            {data.customer.phone && <Text style={styles.bodyText}>{data.customer.phone}</Text>}
            {data.customer.address && <Text style={styles.bodyText}>{data.customer.address}</Text>}
          </View>
        )}

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colName]}>বিবরণ</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>পরিমাণ</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>একক মূল্য</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>মোট</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={[styles.tableCell, styles.colName]}>{item.description}</Text>
              <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.colPrice]}>{fmt(item.unitPrice)}</Text>
              <Text style={[styles.tableCell, styles.colTotal]}>{fmt(item.subtotal)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{fmt(data.subtotal)}</Text>
        </View>
        {data.discount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Discount</Text>
            <Text style={styles.summaryValue}>- {fmt(data.discount)}</Text>
          </View>
        )}
        {data.taxAmount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>VAT ({data.taxRate}%)</Text>
            <Text style={styles.summaryValue}>+ {fmt(data.taxAmount)}</Text>
          </View>
        )}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>মোট</Text>
          <Text style={styles.totalValue}>{fmt(data.total)}</Text>
        </View>
        {data.paidAmount > 0 && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Paid</Text>
            <Text style={styles.summaryValue}>{fmt(data.paidAmount)}</Text>
          </View>
        )}
        {due > 0 && (
          <View style={styles.dueRow}>
            <Text style={styles.dueLabel}>Due</Text>
            <Text style={styles.dueValue}>{fmt(due)}</Text>
          </View>
        )}

        {data.shop.bankName && data.shop.bankAccount && (
          <View style={[styles.section, { marginTop: 16 }]}>
            <Text style={styles.sectionLabel}>Bank Payment</Text>
            <Text style={styles.bodyText}>{data.shop.bankName}</Text>
            <Text style={styles.bodyText}>{data.shop.bankAccount}</Text>
          </View>
        )}

        {data.shop.invoiceNote && (
          <View style={[styles.section, { marginTop: 8 }]}>
            <Text style={styles.bodyText}>{data.shop.invoiceNote}</Text>
          </View>
        )}

        {data.notes && (
          <View style={[styles.section, { marginTop: 8 }]}>
            <Text style={styles.sectionLabel}>Note</Text>
            <Text style={styles.bodyText}>{data.notes}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>ধন্যবাদ!</Text>
          <Text style={[styles.footerText, { marginTop: 4, fontSize: 8, color: "#A8A69E" }]}>
            Powered by BizilCore
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export function InvoiceDocument({ data }: { data: InvoiceData }) {
  const invNum = `INV-${data.orderId.slice(-8).toUpperCase()}`;
  const dateStr = new Date(data.createdAt).toLocaleDateString("en-BD", { day: "2-digit", month: "short", year: "numeric" });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.shopName}>{data.shop.name}</Text>
            {data.shop.phone && <Text style={styles.shopMeta}>{data.shop.phone}</Text>}
          </View>
          <View>
            <Text style={styles.invoiceLabel}>INVOICE</Text>
            <Text style={styles.invoiceNum}>{invNum}</Text>
            <Text style={styles.invoiceNum}>{dateStr}</Text>
          </View>
        </View>

        {data.customer && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Bill To</Text>
            <Text style={styles.bodyText}>{data.customer.name}</Text>
            {data.customer.phone && <Text style={styles.bodyText}>{data.customer.phone}</Text>}
            {data.customer.address && <Text style={styles.bodyText}>{data.customer.address}</Text>}
          </View>
        )}

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colName]}>পণ্য</Text>
            <Text style={[styles.tableHeaderCell, styles.colQty]}>পরিমাণ</Text>
            <Text style={[styles.tableHeaderCell, styles.colPrice]}>একক মূল্য</Text>
            <Text style={[styles.tableHeaderCell, styles.colTotal]}>মোট</Text>
          </View>
          {data.items.map((item, i) => (
            <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
              <Text style={[styles.tableCell, styles.colName]}>{item.resolvedName ?? item.product?.name ?? "পণ্য"}</Text>
              <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
              <Text style={[styles.tableCell, styles.colPrice]}>{fmt(item.unitPrice)}</Text>
              <Text style={[styles.tableCell, styles.colTotal]}>{fmt(item.subtotal)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal</Text>
          <Text style={styles.summaryValue}>{fmt(data.totalAmount)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>পরিশোধিত</Text>
          <Text style={styles.summaryValue}>{fmt(data.paidAmount)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>মোট</Text>
          <Text style={styles.totalValue}>{fmt(data.totalAmount)}</Text>
        </View>
        {data.dueAmount > 0 && (
          <View style={styles.dueRow}>
            <Text style={styles.dueLabel}>বাকি</Text>
            <Text style={styles.dueValue}>{fmt(data.dueAmount)}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <Text style={styles.footerText}>ধন্যবাদ আপনার কেনাকাটার জন্য!</Text>
          <Text style={[styles.footerText, { marginTop: 4, fontSize: 8, color: "#A8A69E" }]}>
            Powered by BizilCore
          </Text>
        </View>
      </Page>
    </Document>
  );
}
