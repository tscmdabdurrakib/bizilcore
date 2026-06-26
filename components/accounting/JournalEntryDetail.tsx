"use client";

import { formatBDT } from "@/lib/utils";
import type { JournalEntryWithLines, JournalStatus } from "@/types/accounting";

const STATUS_STYLE: Record<JournalStatus, string> = {
  draft: "bg-yellow-50 text-yellow-700",
  posted: "bg-emerald-50 text-emerald-700",
  reversed: "bg-gray-100 text-gray-500 line-through",
};

interface Props {
  entry: JournalEntryWithLines;
  onPost?: () => void;
  onReverse?: () => void;
  onClose: () => void;
}

export default function JournalEntryDetail({ entry, onPost, onReverse, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="p-5 border-b flex justify-between items-start">
          <div>
            <p className="font-bold text-lg">{entry.entryNumber}</p>
            <p className="text-sm text-gray-500">{entry.entryDate?.split("T")[0]}</p>
            <span className={`text-xs font-bold px-2 py-1 rounded-full mt-2 inline-block ${STATUS_STYLE[entry.status]}`}>
              {entry.status}
            </span>
          </div>
          <button onClick={onClose} className="text-gray-400 text-xl">×</button>
        </div>
        <div className="p-5">
          <p className="text-sm text-gray-700 mb-4">{entry.description}</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 uppercase border-b">
                <th className="text-left py-2">Account</th>
                <th className="text-right py-2">Debit</th>
                <th className="text-right py-2">Credit</th>
              </tr>
            </thead>
            <tbody>
              {entry.lines.map((l) => (
                <tr key={l.id} className="border-b border-gray-50">
                  <td className="py-2">
                    <span className="font-mono text-xs text-gray-400">{l.accountCode}</span> {l.accountName}
                  </td>
                  <td className="py-2 text-right">{l.debitAmount ? formatBDT(l.debitAmount) : "—"}</td>
                  <td className="py-2 text-right">{l.creditAmount ? formatBDT(l.creditAmount) : "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold">
                <td className="py-3">Total</td>
                <td className="py-3 text-right">{formatBDT(entry.debitTotal)}</td>
                <td className="py-3 text-right">{formatBDT(entry.creditTotal)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div className="p-5 border-t flex gap-2">
          {entry.status === "draft" && onPost && (
            <button
              onClick={onPost}
              className="flex-1 py-3 rounded-xl text-white font-bold"
              style={{ background: "linear-gradient(135deg,#0F6E56,#065E48)" }}
            >
              Post Entry
            </button>
          )}
          {entry.status === "posted" && onReverse && (
            <button onClick={onReverse} className="flex-1 py-3 border rounded-xl font-bold">
              Reverse
            </button>
          )}
          <button onClick={() => window.print()} className="px-4 py-3 border rounded-xl font-bold">
            Print
          </button>
        </div>
      </div>
    </div>
  );
}
