"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Trash2, Plus, ArrowLeftRight, RefreshCw, GitBranch, Package, TrendingUp } from "lucide-react";
import { PageShell, Card, StatCard, Button, Badge } from "@/components/ui";
import { useShops } from "@/hooks/useShops";
import type { Branch, ShopsTab, ToastType } from "@/lib/shops/types";
import type { OrgOverview } from "@/lib/shops/advanced";
import LockedState from "@/components/shops/LockedState";
import ShopsTabBar from "@/components/shops/ShopsTabBar";
import ShopsDashboardGrid from "@/components/shops/ShopsDashboardGrid";
import ShopsSidebar from "@/components/shops/ShopsSidebar";
import BranchListPanel from "@/components/shops/BranchListPanel";
import ShopsPageSkeleton from "@/components/shops/ShopsPageSkeleton";
import CreateBranchModal from "@/components/shops/CreateBranchModal";
import CreateChildShopModal from "@/components/shops/CreateChildShopModal";
import EditBranchModal from "@/components/shops/EditBranchModal";
import TransferModal from "@/components/shops/TransferModal";
import TransferLog from "@/components/shops/TransferLog";
import AnalyticsSection from "@/components/shops/AnalyticsSection";
import BranchDetailDrawer from "@/components/shops/BranchDetailDrawer";
import OnboardingWelcome from "@/components/shops/OnboardingWelcome";
import BranchComparisonTable from "@/components/shops/BranchComparisonTable";
import LowStockAlerts from "@/components/shops/LowStockAlerts";
import ReorderSuggestions from "@/components/shops/ReorderSuggestions";
import BranchFeaturesNotice from "@/components/shops/BranchFeaturesNotice";
import AdvancedToolsPanel from "@/components/shops/AdvancedToolsPanel";
import TransferFab from "@/components/shops/TransferFab";
import PageHint from "@/components/PageHint";
import { Toast } from "@/components/shops/ui";

const ONBOARDING_KEY = "bizilcore_branch_onboarding_dismissed";

export default function ShopsPage() {
  const { data, locked, loading, reload } = useShops();
  const [overview, setOverview] = useState<OrgOverview | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [showCreate, setCreate] = useState(false);
  const [showChildShop, setChildShop] = useState(false);
  const [guidedCreate, setGuidedCreate] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [togglingActive, setTogglingActive] = useState<string | null>(null);
  const [showTransfer, setTransfer] = useState(false);
  const [transferBranchId, setTransferBranchId] = useState<string | null>(null);
  const [editBranch, setEdit] = useState<Branch | null>(null);
  const [detailBranch, setDetail] = useState<Branch | null>(null);
  const [confirmDel, setConfDel] = useState<string | null>(null);
  const [activeTab, setTab] = useState<ShopsTab>("shops");
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [toast, setToast] = useState<{ type: ToastType; msg: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((type: ToastType, msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ type, msg });
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("action") === "create") setCreate(true);
    if (params.get("action") === "create-child") setChildShop(true);
  }, []);

  useEffect(() => {
    if (!data || data.branches.length > 0) return;
    if (localStorage.getItem(ONBOARDING_KEY)) return;
    setShowOnboarding(true);
  }, [data]);

  useEffect(() => {
    if (locked || !data) {
      setOverview(null);
      setOverviewLoading(false);
      return;
    }
    setOverviewLoading(true);
    fetch("/api/shops/overview")
      .then(r => (r.ok ? r.json() : null))
      .then(setOverview)
      .catch(() => setOverview(null))
      .finally(() => setOverviewLoading(false));
  }, [data, locked]);

  async function deleteBranch(branchId: string) {
    setDeleting(branchId);
    const res = await fetch(`/api/shops?branchId=${branchId}`, { method: "DELETE" });
    setDeleting(null);
    setConfDel(null);
    if (!res.ok) { showToast("error", "মুছতে সমস্যা হয়েছে"); return; }
    showToast("success", "Branch মুছে ফেলা হয়েছে ✓");
    reload();
  }

  async function toggleBranchActive(branch: Branch) {
    setTogglingActive(branch.id);
    const res = await fetch(`/api/shops?branchId=${branch.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: branch.isActive === false }),
    });
    setTogglingActive(null);
    if (!res.ok) { showToast("error", "স্ট্যাটাস পরিবর্তন ব্যর্থ"); return; }
    showToast("success", branch.isActive === false ? "Branch সক্রিয় ✓" : "Branch নিষ্ক্রিয় ✓");
    reload();
  }

  function openTransfer(branchId?: string) {
    setTransferBranchId(branchId ?? null);
    setTransfer(true);
  }

  function openBranchDetail(branchId: string) {
    const branch = data?.branches.find(b => b.id === branchId);
    if (branch) setDetail(branch);
  }

  if (loading) return <ShopsPageSkeleton />;
  if (locked) return <LockedState />;

  const canAdd = data ? data.totalShops < data.maxShops : false;
  const hasBranches = (data?.branches.length ?? 0) > 0;
  const activeBranchCount = data?.branches.filter(b => b.isActive !== false).length ?? 0;

  const sidebarProps = {
    overview,
    overviewLoading,
    canAdd,
    hasBranches,
    onCreate: () => setCreate(true),
    onTransfer: () => openTransfer(),
    onBranchClick: openBranchDetail,
    onReorderTransfer: (branchId: string) => openTransfer(branchId),
  };

  const renderTabContent = () => {
    if (!data) return null;

    switch (activeTab) {
      case "shops":
        return (
          <ShopsDashboardGrid
            mobileAlerts={
              <>
                <LowStockAlerts alerts={overview?.lowStockAlerts} loading={overviewLoading} onBranchClick={openBranchDetail} />
                <ReorderSuggestions onTransfer={(branchId) => openTransfer(branchId)} />
              </>
            }
            main={
              <BranchListPanel
                data={data}
                canAdd={canAdd}
                hasBranches={hasBranches}
                onCreate={() => setCreate(true)}
                onEdit={setEdit}
                onDelete={setConfDel}
                onTransfer={openTransfer}
                onViewStock={setDetail}
                onToggleActive={toggleBranchActive}
                togglingActive={togglingActive}
                deleting={deleting}
              />
            }
            sidebar={<ShopsSidebar {...sidebarProps} />}
          />
        );
      case "log":
        return <TransferLog />;
      case "analytics":
        return (
          <div className="space-y-5">
            <AnalyticsSection />
            <BranchComparisonTable branches={overview?.branches} loading={overviewLoading} />
          </div>
        );
      case "advanced":
        return (
          <AdvancedToolsPanel
            branches={data.branches}
            onRefresh={reload}
            onCreateChild={() => setChildShop(true)}
            showToast={showToast}
          />
        );
      default:
        return null;
    }
  };

  return (
    <PageShell
      title="শাখা ব্যবস্থাপনা"
      subtitle={data ? `${data.mainShop.name} · ${data.totalShops}/${data.maxShops} লোকেশন` : undefined}
      actions={data ? (
        <div className="flex items-center gap-2 flex-wrap">
          {hasBranches && (
            <Button variant="outline" size="sm" icon={ArrowLeftRight} onClick={() => openTransfer()}>
              Transfer
            </Button>
          )}
          {canAdd && (
            <Button size="sm" icon={Plus} onClick={() => setCreate(true)}>
              নতুন Branch
            </Button>
          )}
          <Button variant="ghost" size="sm" icon={RefreshCw} onClick={reload} aria-label="Refresh" />
        </div>
      ) : undefined}
      stats={data ? (
        <>
          <StatCard label="মোট স্টক মূল্য" value={overview ? `৳${overview.inventory.combinedValue.toLocaleString("bn-BD")}` : "—"} icon={TrendingUp} accent="green" />
          <StatCard label="সক্রিয় Branch" value={`${activeBranchCount}/${data.branches.length}`} icon={GitBranch} accent="blue" iconBg="var(--icon-blue-bg)" iconColor="var(--bg-info-text)" />
          <StatCard label="মোট পণ্য" value={String(data.productCount)} icon={Package} accent="blue" iconBg="var(--icon-purple-bg)" iconColor="var(--icon-purple-text)" />
          <StatCard label="Transfer" value={String(data.transferCount)} icon={ArrowLeftRight} accent="gold" iconBg="var(--icon-amber-bg)" iconColor="var(--accent-warm)" />
        </>
      ) : undefined}
      className="pb-24 md:pb-6"
    >
      {toast && <Toast {...toast} />}

      {confirmDel && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="rounded-2xl shadow-2xl p-6 max-w-xs w-full text-center" style={{ backgroundColor: "var(--c-surface)" }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "#FEF2F2" }}>
              <Trash2 size={20} style={{ color: "#EF4444" }} />
            </div>
            <h3 className="font-black mb-2" style={{ color: "var(--c-text)" }}>Branch মুছবেন?</h3>
            <p className="text-sm mb-5" style={{ color: "var(--c-text-muted)" }}>Branch স্টক ও transfer ইতিহাস মুছে যাবে।</p>
            <div className="flex gap-3">
              <button onClick={() => setConfDel(null)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium"
                style={{ borderColor: "var(--c-border)", color: "var(--c-text-sub)" }}>বাতিল</button>
              <button onClick={() => deleteBranch(confirmDel)} disabled={!!deleting}
                className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-60"
                style={{ backgroundColor: "#EF4444" }}>
                {deleting ? <Loader2 size={14} className="animate-spin mx-auto" /> : "হ্যাঁ, মুছুন"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <CreateBranchModal
          guided={guidedCreate}
          onClose={() => { setCreate(false); setGuidedCreate(false); }}
          onCreated={() => {
            setCreate(false);
            setGuidedCreate(false);
            reload();
            showToast("success", "নতুন Branch তৈরি হয়েছে! ✓");
            if (showOnboarding) {
              setShowOnboarding(false);
              localStorage.setItem(ONBOARDING_KEY, "1");
              setTimeout(() => openTransfer(), 400);
            }
          }}
        />
      )}

      {showChildShop && (
        <CreateChildShopModal
          onClose={() => setChildShop(false)}
          onCreated={() => { setChildShop(false); reload(); }}
          showToast={showToast}
        />
      )}

      {showTransfer && data && (
        <TransferModal
          branches={data.branches}
          mainShopName={data.mainShop.name}
          defaultBranchId={transferBranchId}
          onClose={() => { setTransfer(false); setTransferBranchId(null); }}
          onTransferred={() => { setTransfer(false); setTransferBranchId(null); reload(); }}
          showToast={showToast}
        />
      )}

      {editBranch && (
        <EditBranchModal branch={editBranch} onClose={() => setEdit(null)}
          onSaved={() => { setEdit(null); reload(); }} showToast={showToast} />
      )}

      {detailBranch && (
        <BranchDetailDrawer branch={detailBranch} onClose={() => setDetail(null)}
          onTransfer={() => { setDetail(null); openTransfer(detailBranch.id); }} />
      )}

      {data && !canAdd && (
        <Badge variant="warning" dot>প্ল্যান লিমিট — Upgrade প্রয়োজন</Badge>
      )}

      <PageHint
        page="shops"
        text="মূল শপ থেকে Branch-এ স্টক পাঠান, প্রতিটি শাখার স্টক আলাদা ট্র্যাক করুন। Branch তৈরি → Transfer → বিশ্লেষণ tab-এ performance দেখুন।"
      />

      <BranchFeaturesNotice />

      {showOnboarding && (
        <OnboardingWelcome
          onCreateBranch={() => { setGuidedCreate(true); setCreate(true); }}
          onDismiss={() => { setShowOnboarding(false); localStorage.setItem(ONBOARDING_KEY, "1"); }}
        />
      )}

      {data && (
        <Card padding="none">
          <div className="px-4 sm:px-5 pt-1">
            <ShopsTabBar
              activeTab={activeTab}
              onTabChange={setTab}
              branchCount={data.branches.length}
              transferCount={data.transferCount}
            />
          </div>
          <div className="p-4 sm:p-5">{renderTabContent()}</div>
        </Card>
      )}

      <TransferFab onClick={() => openTransfer()} visible={hasBranches} />
    </PageShell>
  );
}
