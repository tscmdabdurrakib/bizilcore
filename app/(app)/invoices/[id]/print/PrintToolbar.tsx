"use client";

import { Printer, Download } from "lucide-react";

export function PrintToolbar({ invoiceNumber, invoiceId }: { invoiceNumber: string; invoiceId: string }) {
  return (
    <div className="no-print sticky top-0 z-10 px-6 py-3 bg-gray-900 flex items-center gap-3">
      <span className="text-gray-400 text-sm flex-1">Invoice Preview — {invoiceNumber}</span>
      <button
        onClick={() => window.print()}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 text-white text-sm font-semibold"
      >
        <Printer size={14} /> Print / PDF
      </button>
      <a
        href={`/api/invoices/${invoiceId}/pdf`}
        target="_blank"
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 text-gray-200 text-sm"
      >
        <Download size={14} /> PDF
      </a>
    </div>
  );
}
