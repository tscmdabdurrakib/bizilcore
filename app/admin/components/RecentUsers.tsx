import Link from "next/link";
import AdminCard from "./AdminCard";
import { RecentUser, PLAN_COLOR } from "./constants";

interface Props {
  users: RecentUser[];
}

export default function RecentUsers({ users }: Props) {
  return (
    <AdminCard
      title="Recent Signups"
      action={
        <Link href="/admin/users" className="text-xs font-medium text-emerald-600 hover:text-emerald-700">
          View All →
        </Link>
      }
    >
      {users.length === 0 ? (
        <p className="py-4 text-center text-sm text-gray-500">কোনো user নেই</p>
      ) : (
        <ul className="space-y-3">
          {users.map((u) => {
            const plan = u.subscription?.plan ?? "free";
            const planStyle = PLAN_COLOR[plan] ?? PLAN_COLOR.free;
            return (
              <li key={u.id} className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                  {u.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{u.name}</p>
                  <p className="truncate text-xs text-gray-500">{u.email}</p>
                </div>
                <span className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase" style={{ backgroundColor: planStyle.bg, color: planStyle.text }}>
                  {plan}
                </span>
                <span className="shrink-0 text-xs text-gray-400">
                  {new Date(u.createdAt).toLocaleDateString("bn-BD", { month: "short", day: "numeric" })}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </AdminCard>
  );
}
