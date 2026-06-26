"use client";

import { formatBDT } from "@/lib/utils";

interface VATInvoiceProps {
  shopName: string;
  shopAddress?: string;
  vatBin?: string | null;
  customerName: string;
  customerPhone?: string;
  invoiceNumber: string;
  date: string;
  items: Array<{ description: string; qty: number; unitPrice: number; vatAmount: number }>;
  subtotal: number;
  vatTotal: number;
  grandTotal: number;
}

export default function VATInvoice(props: VATInvoiceProps) {
  return (
    <div className="max-w-lg mx-auto bg-white p-8 print:p-4 text-sm" id="vat-invoice">
      <div className="text-center border-b pb-4 mb-4">
        <h1 className="font-bold text-lg">{props.shopName}</h1>
        {props.shopAddress && <p className="text-gray-500">{props.shopAddress}</p>}
        {props.vatBin && <p className="text-xs mt-1">BIN: {props.vatBin}</p>}
        <p className="font-bold mt-2">VAT Invoice</p>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4 text-xs">
        <div>
          <p className="text-gray-500">Customer</p>
          <p className="font-semibold">{props.customerName}</p>
          {props.customerPhone && <p>{props.customerPhone}</p>}
        </div>
        <div className="text-right">
          <p className="text-gray-500">Invoice #</p>
          <p className="font-semibold">{props.invoiceNumber}</p>
          <p>{props.date}</p>
        </div>
      </div>
      <table className="w-full text-xs mb-4">
        <thead>
          <tr className="border-b">
            <th className="text-left py-1">Item</th>
            <th className="text-right py-1">Qty</th>
            <th className="text-right py-1">Price</th>
            <th className="text-right py-1">VAT</th>
          </tr>
        </thead>
        <tbody>
          {props.items.map((item, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-1">{item.description}</td>
              <td className="text-right py-1">{item.qty}</td>
              <td className="text-right py-1">{formatBDT(item.unitPrice)}</td>
              <td className="text-right py-1">{formatBDT(item.vatAmount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="space-y-1 text-right">
        <p>Subtotal: {formatBDT(props.subtotal)}</p>
        <p>VAT: {formatBDT(props.vatTotal)}</p>
        <p className="font-bold text-base">Grand Total: {formatBDT(props.grandTotal)}</p>
      </div>
      <button
        onClick={() => window.print()}
        className="mt-6 w-full py-3 rounded-xl text-white font-bold print:hidden"
        style={{ background: "linear-gradient(135deg,#0F6E56,#065E48)" }}
      >
        Print Invoice
      </button>
    </div>
  );
}
