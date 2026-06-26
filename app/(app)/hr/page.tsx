"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { UserPlus, Mail } from "lucide-react";
import PlanGate from "@/components/PlanGate";
import { PageShell, Button } from "@/components/ui";
import HRHeader from "@/components/hr/HRHeader";
import HRTabBar from "@/components/hr/HRTabBar";
import TeamTab from "@/components/hr/TeamTab";
import AttendanceTab from "@/components/hr/AttendanceTab";
import ShiftsTab from "@/components/hr/ShiftsTab";
import LeaveTab from "@/components/hr/LeaveTab";
import PayrollTab from "@/components/hr/PayrollTab";
import ReportsTab from "@/components/hr/ReportsTab";
import CommissionTab from "@/components/hr/CommissionTab";
import InviteModal from "@/components/hr/modals/InviteModal";
import QuickAddModal from "@/components/hr/modals/QuickAddModal";
import StaffEditDrawer from "@/components/hr/modals/StaffEditDrawer";
import type { StaffMember, CommissionEntry, HRTab } from "@/lib/hr/types";
import { parseStaffList } from "@/lib/hr/utils";

function HRPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab") as HRTab | null;

  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<HRTab>(tabParam ?? "team");
  const [isSalon, setIsSalon] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);
  const [editMember, setEditMember] = useState<StaffMember | null>(null);

  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year] = useState(now.getFullYear());
  const [presentCount, setPresentCount] = useState(0);

  const [commissionData, setCommissionData] = useState<CommissionEntry[]>([]);
  const [commissionLoading, setCommissionLoading] = useState(false);
  const [payingStaffId, setPayingStaffId] = useState<string | null>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  async function loadStaff() {
    const res = await fetch("/api/staff");
    const data = await res.json();
    setStaff(parseStaffList(data) as StaffMember[]);
  }

  async function loadAttendanceStats() {
    const res = await fetch(`/api/hr/attendance?month=${month}&year=${year}`);
    const data = await res.json();
    const atts = data.attendances ?? [];
    setPresentCount(atts.filter((a: { status: string }) => a.status === "present").length);
  }

  const loadCommission = useCallback(async () => {
    setCommissionLoading(true);
    const res = await fetch(`/api/appointments/commission?month=${month}&year=${year}`);
    const data = await res.json();
    setCommissionData(data.staff ?? []);
    setCommissionLoading(false);
  }, [month, year]);

  async function load() {
    setLoading(true);
    await Promise.all([loadStaff(), loadAttendanceStats()]);
    setLoading(false);
  }

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(d => {
      setIsSalon(d.shop?.businessType === "salon");
    });
  }, []);

  useEffect(() => { load(); }, [month]);

  useEffect(() => {
    if (activeTab === "commission" && isSalon) loadCommission();
  }, [activeTab, isSalon, loadCommission]);

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) setActiveTab(tabParam);
  }, [tabParam]);

  function handleTabChange(tab: HRTab) {
    setActiveTab(tab);
    router.replace(tab === "team" ? "/hr" : `/hr?tab=${tab}`, { scroll: false });
  }

  async function removeStaff(id: string) {
    if (!confirm("এই কর্মীকে সরাতে চান?")) return;
    const r = await fetch(`/api/staff/${id}`, { method: "DELETE" });
    if (r.ok) {
      setStaff(prev => prev.filter(s => s.id !== id));
      showToast("success", "Staff সরিয়ে দেওয়া হয়েছে ✓");
    } else {
      showToast("error", "সরানো যায়নি।");
    }
  }

  async function resendInvite(member: StaffMember) {
    const r = await fetch(`/api/staff/${member.id}`, { method: "POST" });
    const d = await r.json();
    if (r.ok) {
      setStaff(prev => prev.map(s => s.id === member.id ? { ...s, inviteToken: d.inviteToken } : s));
      showToast("success", "নতুন invite link তৈরি ✓");
    } else {
      showToast("error", d.error ?? "যায়নি");
    }
  }

  async function markCommissionPaid(staffId: string) {
    setPayingStaffId(staffId);
    await fetch("/api/appointments/commission", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId, month, year }),
    });
    await loadCommission();
    setPayingStaffId(null);
  }

  const activeCount = staff.filter(s => s.isActive && s.joinedAt).length;
  const pendingCount = staff.filter(s => !s.joinedAt).length;
  const totalSalary = staff.reduce((s, m) => s + (m.salary ?? 0), 0);

  return (
    <PlanGate feature="staff">
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg ${toast.type === "success" ? "bg-emerald-600" : "bg-red-500"}`}>
          {toast.msg}
        </div>
      )}

      <PageShell
        title="HR Hub — কর্মী ব্যবস্থাপনা"
        subtitle="টিম, উপস্থিতি, শিফট, ছুটি, বেতন — এক জায়গায়"
        actions={activeTab === "team" ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" icon={UserPlus} onClick={() => setShowQuickAddModal(true)}>
              দ্রুত যোগ
            </Button>
            <Button size="sm" icon={Mail} onClick={() => setShowInviteModal(true)}>
              Email Invite
            </Button>
          </div>
        ) : undefined}
        stats={
          <HRHeader
            staffCount={staff.length}
            activeCount={activeCount}
            pendingCount={pendingCount}
            presentCount={presentCount}
            totalSalary={totalSalary}
            month={month}
          />
        }
      >
        <HRTabBar activeTab={activeTab} onTabChange={handleTabChange} isSalon={isSalon} />

        {activeTab === "team" && (
          <TeamTab
            staff={staff}
            loading={loading}
            onQuickAdd={() => setShowQuickAddModal(true)}
            onInvite={() => setShowInviteModal(true)}
            onEdit={setEditMember}
            onRemove={removeStaff}
            onResendInvite={resendInvite}
            showToast={showToast}
          />
        )}
        {activeTab === "attendance" && (
          <AttendanceTab staff={staff} month={month} year={year} onMonthChange={setMonth} showToast={showToast} />
        )}
        {activeTab === "shifts" && <ShiftsTab showToast={showToast} />}
        {activeTab === "leave" && <LeaveTab staff={staff} showToast={showToast} />}
        {activeTab === "payroll" && <PayrollTab staff={staff} showToast={showToast} />}
        {activeTab === "reports" && (
          <ReportsTab month={month} year={year} onMonthChange={setMonth} showToast={showToast} />
        )}
        {activeTab === "commission" && isSalon && (
          <CommissionTab
            month={month}
            year={year}
            onMonthChange={setMonth}
            commissionData={commissionData}
            commissionLoading={commissionLoading}
            payingStaffId={payingStaffId}
            onMarkPaid={markCommissionPaid}
          />
        )}
      </PageShell>

      {showInviteModal && (
        <InviteModal
          onClose={() => setShowInviteModal(false)}
          onInvited={member => { setStaff(prev => [member, ...prev]); }}
          showToast={showToast}
        />
      )}
      {showQuickAddModal && (
        <QuickAddModal
          onClose={() => setShowQuickAddModal(false)}
          onAdded={member => setStaff(prev => [member, ...prev])}
          showToast={showToast}
        />
      )}
      {editMember && (
        <StaffEditDrawer
          member={editMember}
          onClose={() => setEditMember(null)}
          onSaved={updated => setStaff(prev => prev.map(s => s.id === updated.id ? updated : s))}
          showToast={showToast}
        />
      )}
    </PlanGate>
  );
}

export default function HRPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-gray-400">লোড হচ্ছে...</div>}>
      <HRPageContent />
    </Suspense>
  );
}
