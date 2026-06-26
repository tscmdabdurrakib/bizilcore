import Link from "next/link";
import AdminCard from "./AdminCard";
import AdminTable, { AdminTableRow, AdminTableCell } from "./AdminTable";
import { Payment, PLAN_COLOR } from "./constants";

interface Props {
  payments: Payment[];
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
}

export default function PendingPayments({ payments, onApprove, onReject }: Props) {
  return (
    <AdminCard
      title="Pending Payments"
      action={
        <Link href="/admin/payments" className="text-xs font-medium text-emerald-600 hover:text-emerald-700">
          View All →
        </Link>
      }
    >
      {payments.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">কোনো pending payment নেই</p>
      ) : (
        <div className="overflow-x-auto -mx-5 -mb-5">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {["Shop/User", "Amount", "Plan", "Date", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.slice(0, 5).map((p) => {
                const planS = PLAN_COLOR[p.plan] ?? PLAN_COLOR.free;
                return (
                  <tr key={p.id} className="hover:bg-gray-50/80">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{p.user.name}</p>
                      <p className="text-xs text-gray-500">{p.user.email}</p>
                    </td>
                    <td className="px-4 py-3 font-medium">৳{p.amount}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full px-2 py-0.5 text-xs font-medium uppercase" style={{ backgroundColor: planS.bg, color: planS.text }}>
                        {p.plan}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(p.createdAt).toLocaleDateString("bn-BD")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {onApprove && (
                          <button onClick={() => onApprove(p.id)} className="rounded-lg bg-emerald-600 px-2 py-1 text-xs font-semibold text-white active:scale-95">
                            Approve
                          </button>
                        )}
                        {onReject && (
                          <button onClick={() => onReject(p.id)} className="rounded-lg bg-red-600 px-2 py-1 text-xs font-semibold text-white active:scale-95">
                            Reject
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </AdminCard>
  );
}
