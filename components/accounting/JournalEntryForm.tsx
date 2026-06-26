"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import { isJournalBalanced, type JournalLineInput } from "@/types/accounting";
import DatePicker from "@/components/ui/DatePicker";

interface AccountOption {
  id: string;
  code: string;
  name: string;
}

interface Props {
  accounts: AccountOption[];
  initial?: {
    entryDate: string;
    description: string;
    lines: JournalLineInput[];
  };
}

export default function JournalEntryForm({ accounts, initial }: Props) {
  const router = useRouter();
  const [entryDate, setEntryDate] = useState(
    initial?.entryDate ?? new Date().toISOString().split("T")[0],
  );
  const [description, setDescription] = useState(initial?.description ?? "");
  const [lines, setLines] = useState<JournalLineInput[]>(
    initial?.lines ?? [{ accountId: "", debitAmount: 0, creditAmount: 0, description: "" }],
  );
  const [loading, setLoading] = useState(false);

  const debitTotal = lines.reduce((s, l) => s + (l.debitAmount || 0), 0);
  const creditTotal = lines.reduce((s, l) => s + (l.creditAmount || 0), 0);
  const balanced = isJournalBalanced(lines);

  function updateLine(i: number, patch: Partial<JournalLineInput>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  }

  async function save(post: boolean) {
    setLoading(true);
    const r = await fetch("/api/accounting/journals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryDate, description, lines, post }),
    });
    setLoading(false);
    if (r.ok) router.push("/accounting/journals");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 pb-8">
      <div className="bg-white rounded-2xl border p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700">Entry Date</label>
            <DatePicker value={entryDate} onChange={setEntryDate} className="w-full h-11 border rounded-xl px-3 mt-1" />
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700">Description</label>
            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-11 border rounded-xl px-3 mt-1"
            />
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 uppercase">
              <th className="text-left py-2">Account</th>
              <th className="text-left py-2">Line Desc</th>
              <th className="text-right py-2">Debit</th>
              <th className="text-right py-2">Credit</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => (
              <tr key={i}>
                <td className="py-1 pr-2">
                  <select
                    value={line.accountId}
                    onChange={(e) => updateLine(i, { accountId: e.target.value })}
                    className="w-full h-10 border rounded-lg px-2"
                  >
                    <option value="">Select account</option>
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>{a.code} — {a.name}</option>
                    ))}
                  </select>
                </td>
                <td className="py-1 pr-2">
                  <input
                    value={line.description ?? ""}
                    onChange={(e) => updateLine(i, { description: e.target.value })}
                    className="w-full h-10 border rounded-lg px-2"
                  />
                </td>
                <td className="py-1 pr-2">
                  <input
                    type="number"
                    min={0}
                    value={line.debitAmount || ""}
                    onChange={(e) => updateLine(i, { debitAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full h-10 border rounded-lg px-2 text-right"
                  />
                </td>
                <td className="py-1 pr-2">
                  <input
                    type="number"
                    min={0}
                    value={line.creditAmount || ""}
                    onChange={(e) => updateLine(i, { creditAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full h-10 border rounded-lg px-2 text-right"
                  />
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => setLines((p) => p.filter((_, idx) => idx !== i))}
                    className="p-2 text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <button
          type="button"
          onClick={() => setLines((p) => [...p, { accountId: "", debitAmount: 0, creditAmount: 0 }])}
          className="flex items-center gap-1 text-sm font-semibold text-emerald-700"
        >
          <Plus size={14} /> Add line
        </button>

        <div
          className={`p-3 rounded-xl text-sm font-bold ${
            balanced ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
          }`}
        >
          Debit {formatBDT(debitTotal)} vs Credit {formatBDT(creditTotal)} —{" "}
          {balanced ? "Balanced ✓" : "Unbalanced ✗"}
        </div>

        <div className="flex gap-3">
          <Link href="/accounting/journals" className="flex-1 py-3 border rounded-xl text-center font-bold">
            Cancel
          </Link>
          <button
            disabled={loading || !balanced || !description}
            onClick={() => save(false)}
            className="flex-1 py-3 border rounded-xl font-bold disabled:opacity-50"
          >
            Save Draft
          </button>
          <button
            disabled={loading || !balanced || !description}
            onClick={() => save(true)}
            className="flex-1 py-3 rounded-xl text-white font-bold disabled:opacity-50"
            style={{ background: "linear-gradient(135deg,#0F6E56,#065E48)" }}
          >
            Post
          </button>
        </div>
      </div>
    </div>
  );
}
