"use client";

import { useState } from "react";
import { Pencil, Eye, Power } from "lucide-react";
import { formatBDT } from "@/lib/utils";
import { ACC } from "@/lib/i18n/accounting";
import type { AccountWithBalance, AccountType } from "@/types/accounting";

interface Props {
  accounts: AccountWithBalance[];
  onEdit: (account: AccountWithBalance) => void;
  onToggleActive: (account: AccountWithBalance) => void;
  onViewLedger: (account: AccountWithBalance) => void;
}

export default function ChartOfAccountsTable({
  accounts,
  onEdit,
  onToggleActive,
  onViewLedger,
}: Props) {
  return (
    <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: "var(--c-surface)", borderColor: "var(--c-border)" }}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase" style={{ backgroundColor: "var(--c-bg)", color: "var(--c-text-muted)" }}>
              <th className="px-4 py-3">{ACC.code}</th>
              <th className="px-4 py-3">{ACC.accountName}</th>
              <th className="px-4 py-3">{ACC.type}</th>
              <th className="px-4 py-3">{ACC.normal}</th>
              <th className="px-4 py-3 text-right">{ACC.balance}</th>
              <th className="px-4 py-3">{ACC.status}</th>
              <th className="px-4 py-3">{ACC.actions}</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--c-border)" }}>
            {accounts.map((a) => (
              <tr key={a.id} className="hover:opacity-90" style={{ borderColor: "var(--c-border)" }}>
                <td className="px-4 py-3 font-mono font-semibold">{a.code}</td>
                <td className="px-4 py-3">
                  <div className="font-medium" style={{ color: "var(--c-text)" }}>{a.name}</div>
                  {a.isSystem && (
                    <span className="text-[10px] font-semibold" style={{ color: "var(--c-primary)" }}>{ACC.system}</span>
                  )}
                </td>
                <td className="px-4 py-3">{ACC.accountTypes[a.accountType] ?? a.accountType}</td>
                <td className="px-4 py-3">{ACC.normalBalance[a.normalBalance] ?? a.normalBalance}</td>
                <td className="px-4 py-3 text-right font-bold">{formatBDT(a.balance)}</td>
                <td className="px-4 py-3">
                  <span
                    className="text-xs font-bold px-2 py-1 rounded-full"
                    style={{
                      backgroundColor: a.isActive ? "var(--bg-success-soft)" : "var(--c-bg)",
                      color: a.isActive ? "var(--bg-success-text)" : "var(--c-text-muted)",
                    }}
                  >
                    {a.isActive ? ACC.active : ACC.inactive}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-1">
                    <button
                      onClick={() => onEdit(a)}
                      className="p-2 rounded-lg cursor-pointer hover:opacity-80"
                      style={{ backgroundColor: "transparent" }}
                      title={ACC.edit}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => onViewLedger(a)}
                      className="p-2 rounded-lg cursor-pointer hover:opacity-80"
                      title={ACC.ledger}
                    >
                      <Eye size={14} />
                    </button>
                    {!a.isSystem && (
                      <button
                        onClick={() => onToggleActive(a)}
                        className="p-2 rounded-lg cursor-pointer hover:opacity-80"
                        title={ACC.toggle}
                      >
                        <Power size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {accounts.length === 0 && (
        <p className="text-center py-12 text-sm" style={{ color: "var(--c-text-muted)" }}>{ACC.noAccounts}</p>
      )}
    </div>
  );
}

export function AccountFormModal({
  open,
  onClose,
  onSave,
  categories,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Record<string, string>) => void;
  categories: Array<{ id: string; name: string; type: string }>;
  initial?: AccountWithBalance | null;
}) {
  const [form, setForm] = useState<{
    code: string;
    name: string;
    accountType: AccountType;
    categoryId: string;
    description: string;
  }>({
    code: initial?.code ?? "",
    name: initial?.name ?? "",
    accountType: (initial?.accountType ?? "asset") as AccountType,
    categoryId: initial?.categoryId ?? "",
    description: initial?.description ?? "",
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="rounded-2xl p-6 max-w-md w-full shadow-xl space-y-4" style={{ backgroundColor: "var(--c-surface)" }}>
        <h3 className="font-bold text-lg">{initial ? ACC.editAccount : ACC.addAccount}</h3>
        {!initial?.isSystem && (
          <>
            <input
              placeholder={ACC.code}
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              className="w-full h-11 border rounded-xl px-3"
              style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)" }}
              disabled={!!initial?.isSystem}
            />
            <select
              value={form.accountType}
              onChange={(e) => setForm((f) => ({ ...f, accountType: e.target.value as AccountType }))}
              className="w-full h-11 border rounded-xl px-3"
              style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)" }}
              disabled={!!initial?.isSystem}
            >
              {Object.keys(ACC.accountTypes).map((t) => (
                <option key={t} value={t}>{ACC.accountTypes[t]}</option>
              ))}
            </select>
          </>
        )}
        <input
          placeholder={ACC.name}
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full h-11 border rounded-xl px-3"
          style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)" }}
        />
        <select
          value={form.categoryId}
          onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
          className="w-full h-11 border rounded-xl px-3"
          style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)" }}
        >
          <option value="">{ACC.category}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <textarea
          placeholder={ACC.description}
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          className="w-full border rounded-xl px-3 py-2 min-h-[80px]"
          style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)" }}
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-3 border rounded-xl font-bold cursor-pointer" style={{ borderColor: "var(--c-border)" }}>{ACC.cancel}</button>
          <button
            onClick={() => onSave(form)}
            className="flex-1 py-3 rounded-xl text-white font-bold cursor-pointer"
            style={{ background: "linear-gradient(135deg,#0F6E56,#065E48)" }}
          >
            {ACC.save}
          </button>
        </div>
      </div>
    </div>
  );
}
