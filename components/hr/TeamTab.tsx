"use client";

import { useState } from "react";
import {
  Users, UserPlus, Crown, User, Copy, Trash2, AlertCircle, Search, Mail, Pencil, RefreshCw,
} from "lucide-react";
import { formatBDT } from "@/lib/utils";
import type { StaffMember } from "@/lib/hr/types";
import { ROLE_LABEL, ROLE_COLOR } from "@/lib/hr/types";
import { Card, Tabs, Badge, EmptyState, Button, Input } from "@/components/ui";

interface Props {
  staff: StaffMember[];
  loading: boolean;
  onQuickAdd: () => void;
  onInvite: () => void;
  onEdit: (member: StaffMember) => void;
  onRemove: (id: string) => void;
  onResendInvite: (member: StaffMember) => void;
  showToast: (type: "success" | "error", msg: string) => void;
}

export default function TeamTab({
  staff, loading, onQuickAdd, onInvite, onEdit, onRemove, onResendInvite, showToast,
}: Props) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "pending" | "offline">("all");

  const filtered = staff.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = !q || m.user.name.toLowerCase().includes(q) || m.user.email.toLowerCase().includes(q) || (m.phone?.includes(q));
    const isOffline = !m.joinedAt && m.user.email.includes("@staff.bizilcore.local");
    const matchFilter =
      filter === "all" ||
      (filter === "active" && m.joinedAt && m.isActive) ||
      (filter === "pending" && !m.joinedAt && !isOffline) ||
      (filter === "offline" && isOffline);
    return matchSearch && matchFilter;
  });

  return (
    <div className="space-y-4">
      <Card>
        <p className="text-xs font-bold mb-3 uppercase tracking-wide" style={{ color: "var(--c-text-muted)" }}>Permission Matrix</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { role: "ম্যানেজার", icon: Crown, perms: "Orders, Products, Customers, Reports — Settings ও Billing ছাড়া।", color: "#16A34A", bg: "#DCFCE7" },
            { role: "স্টাফ", icon: User, perms: "শুধু Orders দেখা ও তৈরি করতে পারবে।", color: "#7C3CF6", bg: "#EDE9FE" },
          ].map(({ role, icon: Icon, perms, color, bg }) => (
            <div key={role} className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: bg + "60" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: bg }}>
                <Icon size={14} style={{ color }} />
              </div>
              <div>
                <p className="text-sm font-bold" style={{ color }}>{role}</p>
                <p className="text-xs text-gray-500 mt-0.5">{perms}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="নাম, email বা ফোন খুঁজুন..." className="flex-1" />
        <Tabs
          tabs={[
            { key: "all", label: "সব" },
            { key: "active", label: "সক্রিয়" },
            { key: "pending", label: "Pending" },
            { key: "offline", label: "লগইন ছাড়া" },
          ]}
          active={filter}
          onChange={(key) => setFilter(key as typeof filter)}
        />
      </div>

      <Card padding="none">
        {loading ? (
          <div className="p-5 space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title="কোনো কর্মী নেই"
            description="দ্রুত যোগ করুন অথবা email invite পাঠান"
            action={{ label: "দ্রুত যোগ", onClick: onQuickAdd }}
          />
        ) : (
          <div>
            {filtered.map((member, i) => {
              const rc = ROLE_COLOR[member.role] ?? { bg: "#F3F4F6", text: "#374151" };
              const joined = !!member.joinedAt;
              const isOffline = !joined && member.user.email.includes("@staff.bizilcore.local");
              return (
                <div key={member.id}
                  className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                  style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F3F4F6" : "none" }}
                  onClick={() => onEdit(member)}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 100%)" }}>
                    {member.user.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-bold text-gray-900 truncate">{member.user.name}</p>
                      <Badge variant={member.role === "manager" ? "success" : "purple"}>
                        {ROLE_LABEL[member.role] ?? member.role}
                      </Badge>
                      {isOffline && <Badge variant="info">লগইন ছাড়া</Badge>}
                      {!joined && !isOffline && (
                        <Badge variant="warning" dot>Invite pending</Badge>
                      )}
                      {joined && <Badge variant="success">✓ যোগ দিয়েছেন</Badge>}
                      {member.branch?.name && (
                        <Badge variant="purple">🏪 {member.branch.name}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {isOffline ? member.phone : member.user.email}
                      {member.jobTitle ? ` · ${member.jobTitle}` : ""}
                    </p>
                  </div>
                  <div className="hidden sm:block text-right flex-shrink-0">
                    {member.salary ? <p className="text-sm font-bold text-gray-900">{formatBDT(member.salary)}</p> : null}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    {!joined && member.inviteToken && (
                      <>
                        <button onClick={() => {
                          const url = `${window.location.origin}/invite/${member.inviteToken}`;
                          navigator.clipboard.writeText(url);
                          showToast("success", "Link copy ✓");
                        }} className="p-2 rounded-xl hover:bg-gray-100" title="Copy invite">
                          <Copy size={14} className="text-gray-400" />
                        </button>
                        <button onClick={() => onResendInvite(member)} className="p-2 rounded-xl hover:bg-gray-100" title="নতুন invite">
                          <RefreshCw size={14} className="text-gray-400" />
                        </button>
                      </>
                    )}
                    <button onClick={() => onEdit(member)} className="p-2 rounded-xl hover:bg-emerald-50">
                      <Pencil size={14} className="text-emerald-600" />
                    </button>
                    <button onClick={() => onRemove(member.id)} className="p-2 rounded-xl hover:bg-red-50">
                      <Trash2 size={15} className="text-red-400" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
