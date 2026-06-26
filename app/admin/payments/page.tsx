"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import AdminPillTabs from "../components/AdminPillTabs";
import AdminCard from "../components/AdminCard";
import PaymentNoteModal from "../components/PaymentNoteModal";
import PlanSetModal from "../components/PlanSetModal";
import { Payment, PLAN_COLOR, STATUS_STYLE, METHOD_LABEL } from "../components/constants";

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentFilter, setPaymentFilter] = useState("pending");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [noteModal, setNoteModal] = useState<{ paymentId: string; action: "approve" | "reject" } | null>(null);
  const [planModal, setPlanModal] = useState<{ userId: string; name: string; currentPlan: string; plan: string; months: number } | null>(null);

  async function loadPayments(status: string) {
    setLoading(true);
    const r = await fetch(`/api/admin/payments?status=${status}`);
    if (r.ok) {
      const d = await r.json();
      setPayments(d.payments);
    }
    setLoading(false);
  }

  useEffect(() => { loadPayments(paymentFilter); }, [paymentFilter]);

  async function handlePaymentAction(paymentId: string, action: "approve" | "reject", note?: string) {
    setActionLoading(paymentId);
    await fetch(`/api/admin/payments/${paymentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, adminNote: note }),
    });
    setActionLoading(null);
    setNoteModal(null);
    loadPayments(paymentFilter);
  }

  const filterTabs = [
    { key: "pending", label: "Pending" },
    { key: "approved", label: "Approved" },
    { key: "rejected", label: "Rejected" },
    { key: "", label: "সব" },
  ];

  return (
    <div className="space-y-5">
      <AdminPillTabs tabs={filterTabs} active={paymentFilter} onChange={setPaymentFilter} />

      {loading ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 rounded-xl bg-gray-200" />)}
        </div>
      ) : payments.length === 0 ? (
        <AdminCard hover={false}>
          <div className="py-10 text-center">
            <AlertCircle size={28} className="mx-auto mb-2 text-gray-400" />
            <p className="text-sm text-gray-500">কোনো payment নেই</p>
          </div>
        </AdminCard>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => {
            const ss = STATUS_STYLE[p.status] ?? STATUS_STYLE.pending;
            const planS = PLAN_COLOR[p.plan] ?? PLAN_COLOR.free;
            const isLoading = actionLoading === p.id;
            return (
              <AdminCard key={p.id} hover={false} className="!p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <p className="text-sm font-bold text-gray-900">{p.user.name}</p>
                      <span className="text-xs text-gray-500">{p.user.email}</span>
                      <span className="rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: planS.bg, color: planS.text }}>
                        Current: {p.user.subscription?.plan ?? "free"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
                      <span>{p.plan.toUpperCase()} · {p.months}মাস · ৳{p.amount}</span>
                      <span>{METHOD_LABEL[p.method] ?? p.method}</span>
                      <span className="font-mono">TrxID: {p.transactionId || "—"}</span>
                      {p.senderPhone && <span>{p.senderPhone}</span>}
                      <span>{new Date(p.createdAt).toLocaleString("bn-BD")}</span>
                    </div>
                    {p.adminNote && <p className="mt-1 text-xs" style={{ color: ss.color }}>📝 {p.adminNote}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ backgroundColor: ss.bg, color: ss.color }}>
                      {p.status === "pending" ? <Clock size={11} /> : p.status === "approved" ? <CheckCircle size={11} /> : <XCircle size={11} />}
                      {ss.label}
                    </span>
                    {p.status === "pending" && (
                      <>
                        <button
                          onClick={() => setNoteModal({ paymentId: p.id, action: "approve" })}
                          disabled={isLoading}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 active:scale-95"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => setNoteModal({ paymentId: p.id, action: "reject" })}
                          disabled={isLoading}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50 active:scale-95"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setPlanModal({
                        userId: p.user.id,
                        name: p.user.name,
                        currentPlan: p.user.subscription?.plan ?? "free",
                        plan: p.plan,
                        months: p.months,
                      })}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 active:scale-95"
                    >
                      Plan Set
                    </button>
                  </div>
                </div>
              </AdminCard>
            );
          })}
        </div>
      )}

      {noteModal && (
        <PaymentNoteModal
          paymentId={noteModal.paymentId}
          action={noteModal.action}
          onClose={() => setNoteModal(null)}
          onConfirm={handlePaymentAction}
        />
      )}

      {planModal && (
        <PlanSetModal
          userId={planModal.userId}
          name={planModal.name}
          currentPlan={planModal.currentPlan}
          initialPlan={planModal.plan}
          initialMonths={planModal.months}
          onClose={() => setPlanModal(null)}
          onSuccess={() => loadPayments(paymentFilter)}
        />
      )}
    </div>
  );
}
