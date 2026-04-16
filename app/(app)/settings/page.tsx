"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Check, MessageSquare, Copy, Trash2, Crown, User, ChevronRight, ChevronLeft, Loader2, ArrowLeft, Facebook, Link2, Unlink, X, Store, FileText, Users, Bell, CreditCard, Settings, Target, Moon, Sun, ShieldCheck, ShieldX, Wifi, WifiOff, Eye, EyeOff, Send, BookOpen, MessageCircle, QrCode, Globe, ExternalLink, Sparkles, RefreshCw, Printer, Truck, RefreshCcw, Plus } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { PLAN_DISPLAY, PLAN_LIMITS } from "@/lib/features";
import { BUSINESS_TYPES, BUSINESS_TYPE_META, type BusinessType, SALES_CHANNELS, SALES_CHANNEL_META, type SalesChannel, isValidSalesChannel } from "@/lib/modules";

/* ─── small helpers ─────────────────────────────────── */
interface SMSPrefs {
  orderConfirmed: boolean;
  orderStatusChanged: boolean;
  deliveryConfirmed: boolean;
  paymentReceived: boolean;
  lowStockAlert: boolean;
}
const CATEGORIES = ["পোশাক", "জুয়েলারি", "খাবার", "সৌন্দর্য", "গৃহস্থালি", "অন্যান্য"];
const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", muted: "var(--c-text-muted)", secondary: "var(--c-text-sub)", primary: "var(--c-primary)", bg: "var(--c-bg)" };
const inp = (f: boolean) => ({ height: "40px", border: `1px solid ${f ? S.primary : S.border}`, borderRadius: "8px", color: S.text, backgroundColor: S.surface, padding: "0 12px", fontSize: "14px", outline: "none", width: "100%" });

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between py-3 cursor-pointer">
      <span className="text-sm" style={{ color: S.text }}>{label}</span>
      <div className="w-11 h-6 rounded-full flex items-center px-0.5 transition-colors" style={{ backgroundColor: checked ? S.primary : S.border }} onClick={() => onChange(!checked)}>
        <div className="w-5 h-5 rounded-full bg-white shadow transition-transform" style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }} />
      </div>
    </label>
  );
}


/* ─── Upgrade Modal ─────────────────────────────────── */
const DURATION_OPT = [
  { months: 1, label: "১ মাস", discount: 0 },
  { months: 3, label: "৩ মাস", discount: 5 },
  { months: 6, label: "৬ মাস", discount: 10 },
];
const METHOD_OPT = [
  { key: "bkash", label: "bKash", color: "#E2136E", icon: "📱" },
  { key: "nagad", label: "Nagad", color: "#F4892B", icon: "💳" },
];

interface PricingCfg { planKey: string; monthlyPrice: number; discountEnabled: boolean; discountPercent: number; discountLabel: string; }

function UpgradeModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [step, setStep] = useState<"plan" | "duration" | "method" | "processing">("plan");
  const [plan, setPlan] = useState<"pro" | "business">("pro");
  const [months, setMonths] = useState(1);
  const [method, setMethod] = useState<"bkash" | "nagad">("bkash");
  const [error, setError] = useState<string | null>(null);
  const [pricingCfgs, setPricingCfgs] = useState<PricingCfg[]>([]);

  useEffect(() => {
    fetch("/api/pricing").then(r => r.json()).then((d: PricingCfg[]) => setPricingCfgs(d)).catch(() => {});
  }, []);

  function getEffectiveMonthly(key: string): number {
    const cfg = pricingCfgs.find(c => c.planKey === key);
    if (!cfg) return key === "business" ? 699 : 199;
    return cfg.discountEnabled && cfg.discountPercent > 0
      ? Math.round(cfg.monthlyPrice * (1 - cfg.discountPercent / 100))
      : cfg.monthlyPrice;
  }

  const basePrice = getEffectiveMonthly(plan);
  const discountPct = DURATION_OPT.find(d => d.months === months)?.discount ?? 0;
  const totalPrice = Math.round(basePrice * months * (1 - discountPct / 100));

  async function handlePayment() {
    setStep("processing");
    setError(null);
    try {
      const res = await fetch(`/api/payment/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, months }),
      });
      const data = await res.json();
      if (data.bkashURL) {
        window.location.href = data.bkashURL;
      } else if (data.nagadURL) {
        window.location.href = data.nagadURL;
      } else {
        setError(data.error ?? "Payment gateway সংযোগ ব্যর্থ হয়েছে।");
        setStep("method");
      }
    } catch {
      setError("Network error। আবার চেষ্টা করুন।");
      setStep("method");
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="rounded-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "var(--c-surface-raised)" }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: S.border }}>
          {step !== "plan" && step !== "processing" && (
            <button onClick={() => setStep(step === "duration" ? "plan" : "duration")} className="p-1 -ml-1 rounded-lg hover:bg-gray-100">
              <ArrowLeft size={18} style={{ color: S.secondary }} />
            </button>
          )}
          <h3 className="font-bold text-lg" style={{ color: S.text }}>
            {step === "plan" ? "Plan বেছে নিন" : step === "duration" ? "মেয়াদ বেছে নিন" : step === "method" ? "Payment Method" : "পেমেন্ট হচ্ছে..."}
          </h3>
          {step !== "processing" && (
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-lg" style={{ color: S.muted }}>✕</button>
          )}
        </div>

        <div className="p-5">
          {step === "plan" && (
            <div className="space-y-3">
              {[
                { key: "pro" as const, name: "Pro", features: ["সীমাহীন পণ্য ও অর্ডার", "SMS Notifications", "Courier Integration", "Excel/PDF Export", "৩ জন Staff", "Advanced Reports"] },
                { key: "business" as const, name: "Business", features: ["Pro-এর সব ফিচার", "সীমাহীন Staff", "Priority Support", "Custom Invoice Branding", "API Access"] },
              ].map(p => (
                <button key={p.key} onClick={() => { setPlan(p.key); setStep("duration"); }}
                  className="w-full rounded-2xl border-2 p-4 text-left transition-all hover:border-[#0F6E56]"
                  style={{ borderColor: plan === p.key ? S.primary : S.border }}>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-lg" style={{ color: S.text }}>{p.name}</span>
                    <div className="flex items-center gap-1">
                      <span className="text-2xl font-bold" style={{ color: S.primary }}>৳{getEffectiveMonthly(p.key)}</span>
                      <span className="text-xs" style={{ color: S.muted }}>/মাস</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    {p.features.map(f => (
                      <div key={f} className="flex items-center gap-2">
                        <Check size={13} style={{ color: S.primary }} />
                        <span className="text-xs" style={{ color: S.secondary }}>{f}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-end mt-3" style={{ color: S.primary }}>
                    <span className="text-sm font-medium">বেছে নিন</span>
                    <ChevronRight size={16} />
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === "duration" && (
            <div className="space-y-3">
              <p className="text-sm mb-4" style={{ color: S.muted }}>{plan === "pro" ? "Pro" : "Business"} plan — যত বেশি মাস, তত বেশি ছাড়!</p>
              {DURATION_OPT.map(d => {
                const price = Math.round(basePrice * d.months * (1 - d.discount / 100));
                return (
                  <button key={d.months} onClick={() => { setMonths(d.months); setStep("method"); }}
                    className="w-full rounded-xl border-2 p-4 text-left transition-all hover:border-[#0F6E56]"
                    style={{ borderColor: months === d.months ? S.primary : S.border }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold" style={{ color: S.text }}>{d.label}</p>
                        {d.discount > 0 && (
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block" style={{ backgroundColor: "var(--c-primary-light)", color: S.primary }}>
                            {d.discount}% ছাড়!
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold" style={{ color: S.primary }}>৳{price}</p>
                        <p className="text-xs" style={{ color: S.muted }}>মোট</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {step === "method" && (
            <div className="space-y-4">
              <div className="rounded-xl p-4 mb-2" style={{ backgroundColor: S.bg }}>
                <div className="flex justify-between text-sm mb-1">
                  <span style={{ color: S.muted }}>Plan</span>
                  <span className="font-medium" style={{ color: S.text }}>{plan === "pro" ? "Pro" : "Business"} · {months} মাস</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: S.muted }}>মোট পরিমাণ</span>
                  <span className="font-bold text-lg" style={{ color: S.primary }}>৳{totalPrice}</span>
                </div>
              </div>

              <div className="space-y-2">
                {METHOD_OPT.map(m => (
                  <button key={m.key} onClick={() => setMethod(m.key as "bkash" | "nagad")}
                    className="w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all"
                    style={{ borderColor: method === m.key ? m.color : S.border, backgroundColor: method === m.key ? `${m.color}08` : S.surface }}>
                    <span className="text-2xl">{m.icon}</span>
                    <span className="font-semibold" style={{ color: m.color }}>{m.label}</span>
                    {method === m.key && <Check size={16} className="ml-auto" style={{ color: m.color }} />}
                  </button>
                ))}
              </div>

              {error && <p className="text-xs text-red-600 text-center">{error}</p>}

              <button onClick={handlePayment}
                className="w-full py-3 rounded-xl text-white font-bold text-sm mt-2"
                style={{ backgroundColor: method === "bkash" ? "#E2136E" : "#F4892B" }}>
                {method === "bkash" ? "bKash" : "Nagad"} দিয়ে ৳{totalPrice} পেমেন্ট করুন
              </button>
            </div>
          )}

          {step === "processing" && (
            <div className="py-12 text-center">
              <Loader2 size={40} className="animate-spin mx-auto mb-4" style={{ color: S.primary }} />
              <p className="font-medium" style={{ color: S.text }}>Payment gateway-এ নিয়ে যাওয়া হচ্ছে...</p>
              <p className="text-xs mt-2" style={{ color: S.muted }}>দয়া করে অপেক্ষা করুন</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main Settings Page ────────────────────────────── */
function SettingsContent() {
  const params = useSearchParams();
  const [tab, setTab] = useState(params?.get("tab") ?? "shop");
  const [mobileView, setMobileView] = useState<"menu" | "content">(params?.get("tab") ? "content" : "menu");
  const [focused, setFocused] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [shop, setShop] = useState({ name: "", phone: "", email: "", category: "", address: "", logoUrl: "" });
  const [logoUploading, setLogoUploading] = useState(false);
  const [invoiceSettings, setInvoiceSettings] = useState({ invoiceNote: "", bankAccount: "", bankName: "" });
  const [darkMode, setDarkMode] = useState(false);
  const [salesTarget, setSalesTarget] = useState(0);
  const [savingTarget, setSavingTarget] = useState(false);
  const [notifs, setNotifs] = useState({ lowStock: true, newOrder: true, dueReminder: false });
  const [smsConnected, setSmsConnected] = useState(false);
  const [smsMaskedKey, setSmsMaskedKey] = useState<string | null>(null);
  const [smsBalance, setSmsBalance] = useState<number | null>(null);
  const [smsApiKeyInput, setSmsApiKeyInput] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [connectingSMS, setConnectingSMS] = useState(false);
  const [disconnectingSMS, setDisconnectingSMS] = useState(false);
  const [smsPrefs, setSmsPrefs] = useState<SMSPrefs>({ orderConfirmed: true, orderStatusChanged: false, deliveryConfirmed: false, paymentReceived: false, lowStockAlert: false });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testingSSMS, setTestingSSMS] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [waMaskedToken, setWaMaskedToken] = useState<string | null>(null);
  const [waPhoneNumberId, setWaPhoneNumberId] = useState("");
  const [waBusinessId, setWaBusinessId] = useState("");
  const [waTokenInput, setWaTokenInput] = useState("");
  const [waPhoneInput, setWaPhoneInput] = useState("");
  const [waBusinessInput, setWaBusinessInput] = useState("");
  const [showWaToken, setShowWaToken] = useState(false);
  const [connectingWA, setConnectingWA] = useState(false);
  const [disconnectingWA, setDisconnectingWA] = useState(false);
  const [waGuideOpen, setWaGuideOpen] = useState(false);
  const [waTestPhone, setWaTestPhone] = useState("");
  const [testingWA, setTestingWA] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [businessType, setBusinessType] = useState<BusinessType>("fcommerce");
  const [btModalOpen, setBtModalOpen] = useState(false);
  const [selectedBt, setSelectedBt] = useState<BusinessType>("fcommerce");
  const [switchingBt, setSwitchingBt] = useState(false);
  const [salesChannel, setSalesChannel] = useState<SalesChannel>("both");
  const [scModalOpen, setScModalOpen] = useState(false);
  const [selectedSc, setSelectedSc] = useState<SalesChannel>("both");
  const [switchingSc, setSwitchingSc] = useState(false);
  const { subscription, payments, daysLeft, plan, isExpiringSoon, refresh: refreshSub } = useSubscription();
  const [blacklist, setBlacklist] = useState<{ id: string; phone: string; reason: string | null; createdAt: string }[]>([]);
  const [blacklistLoading, setBlacklistLoading] = useState(false);
  const [blPhone, setBlPhone] = useState("");
  const [blReason, setBlReason] = useState("");
  const [addingBl, setAddingBl] = useState(false);
  const [deletingBlId, setDeletingBlId] = useState<string | null>(null);
  const [fbConn, setFbConn] = useState<{ connected: boolean; pageName?: string; connectedAt?: string } | null>(null);
  const [fbLoading, setFbLoading] = useState(false);
  const [fbError, setFbError] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);
  const [fbPages, setFbPages] = useState<{ id: string; pageId: string; pageName: string; category?: string | null; followers?: number | null; isActive: boolean; connectedAt: string }[]>([]);
  const [addPageModal, setAddPageModal] = useState(false);
  const [newPage, setNewPage] = useState({ pageId: "", pageName: "", accessToken: "", category: "" });
  const [addingPage, setAddingPage] = useState(false);
  const [account, setAccount] = useState({ name: "", email: "" });
  const [accountLoaded, setAccountLoaded] = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [savingAccount, setSavingAccount] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [catalogSlug, setCatalogSlug] = useState("");
  const [catalogEnabled, setCatalogEnabled] = useState(false);
  const [catalogTagline, setCatalogTagline] = useState("");
  const [catalogShowInStockOnly, setCatalogShowInStockOnly] = useState(false);
  const [savingCatalog, setSavingCatalog] = useState(false);
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);
  const [catalogLinkCopied, setCatalogLinkCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg }); setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    const savedDark = typeof window !== "undefined" && localStorage.getItem("bizilcore-dark") === "1";
    setDarkMode(savedDark);
    if (savedDark) document.documentElement.classList.add("dark");
    fetch("/api/settings").then(r => r.json()).then(data => {
      if (data.shop) {
        setShop({ name: data.shop.name ?? "", phone: data.shop.phone ?? "", email: data.shop.email ?? "", category: data.shop.category ?? "", address: data.shop.address ?? "", logoUrl: data.shop.logoUrl ?? "" });
        const rawBt = data.shop.businessType;
        const safeBt: BusinessType = BUSINESS_TYPES.includes(rawBt as BusinessType) ? (rawBt as BusinessType) : "fcommerce";
        setBusinessType(safeBt); setSelectedBt(safeBt);
        const rawSc = data.shop.salesChannel;
        const safeSc: SalesChannel = isValidSalesChannel(rawSc ?? "") ? (rawSc as SalesChannel) : "both";
        setSalesChannel(safeSc); setSelectedSc(safeSc);
        setInvoiceSettings({ invoiceNote: data.shop.invoiceNote ?? "", bankAccount: data.shop.bankAccount ?? "", bankName: data.shop.bankName ?? "" });
        if (data.shop.notifSettings) {
          setNotifs(p => ({ ...p, ...(data.shop.notifSettings as object) }));
          if ((data.shop.notifSettings as Record<string,unknown>).salesTarget) {
            setSalesTarget(Number((data.shop.notifSettings as Record<string,unknown>).salesTarget));
          }
        }
        const loadedSlug = data.shop.slug ?? "";
        setCatalogSlug(loadedSlug);
        setCatalogEnabled(data.shop.catalogEnabled ?? false);
        setCatalogTagline(data.shop.catalogTagline ?? "");
        setCatalogShowInStockOnly(data.shop.catalogShowInStockOnly ?? false);
        if (loadedSlug.length >= 3) setSlugAvailable(true);
      }
      if (data.user && !accountLoaded) {
        setAccount({ name: data.user.name ?? "", email: data.user.email ?? "" });
        setAccountLoaded(true);
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetch("/api/settings/sms").then(r => r.json()).then(d => {
      setSmsConnected(d.isConnected ?? false);
      setSmsMaskedKey(d.maskedApiKey ?? null);
      setSmsBalance(d.balance ?? null);
      if (d.preferences) setSmsPrefs(d.preferences);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/settings/whatsapp").then(r => r.json()).then(d => {
      setWaConnected(d.isConnected ?? false);
      setWaMaskedToken(d.maskedToken ?? null);
      setWaPhoneNumberId(d.phoneNumberId ?? "");
      setWaBusinessId(d.businessAccountId ?? "");
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === "blacklist") {
      setBlacklistLoading(true);
      fetch("/api/fake-order/blacklist")
        .then(r => r.json())
        .then(d => { if (Array.isArray(d)) setBlacklist(d); })
        .catch(() => {})
        .finally(() => setBlacklistLoading(false));
    }
  }, [tab]);

  async function addToBlacklist(e: React.FormEvent) {
    e.preventDefault();
    if (!blPhone.trim()) { showToast("error", "ফোন নম্বর দিন"); return; }
    setAddingBl(true);
    const r = await fetch("/api/fake-order/blacklist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: blPhone.trim(), reason: blReason.trim() || null }),
    });
    const d = await r.json();
    setAddingBl(false);
    if (r.ok) {
      setBlacklist(prev => [d, ...prev.filter(x => x.phone !== d.phone)]);
      setBlPhone(""); setBlReason("");
      showToast("success", "ব্ল্যাকলিস্টে যুক্ত হয়েছে ✓");
    } else {
      showToast("error", d.error ?? "কিছু একটা সমস্যা হয়েছে।");
    }
  }

  async function removeFromBlacklist(id: string) {
    setDeletingBlId(id);
    await fetch(`/api/fake-order/blacklist?id=${id}`, { method: "DELETE" });
    setBlacklist(prev => prev.filter(x => x.id !== id));
    setDeletingBlId(null);
    showToast("success", "ব্ল্যাকলিস্ট থেকে সরানো হয়েছে ✓");
  }

  useEffect(() => {
    if (tab === "facebook") {
      setFbLoading(true); setFbError(null);
      fetch("/api/facebook/disconnect")
        .then(r => r.json())
        .then(d => setFbConn(d))
        .catch(() => setFbError("Facebook সংযোগ যাচাই করতে পারছে না।"))
        .finally(() => setFbLoading(false));
      fetch("/api/facebook/pages").then(r => r.json()).then(d => setFbPages(d.pages ?? [])).catch(() => {});
      const p = params?.get("error");
      if (p === "cancelled") setFbError("Facebook সংযোগ বাতিল করা হয়েছে।");
      else if (p === "auth-failed") setFbError("Facebook লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।");
      else if (p === "no-pages") setFbError("কোনো Facebook Page খুঁজে পাওয়া যায়নি।");
      else if (params?.get("success") === "1") showToast("success", "Facebook Page সফলভাবে সংযুক্ত হয়েছে ✓");
    }
  }, [tab]);

  async function saveShop(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const r = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "shop", ...shop }) });
    setSaving(false);
    showToast(r.ok ? "success" : "error", r.ok ? "সফলভাবে সেভ হয়েছে ✓" : "কিছু একটা সমস্যা হয়েছে।");
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 300 * 1024) { showToast("error", "লোগোর সাইজ সর্বোচ্চ ৩০০KB হতে পারবে।"); return; }
    setLogoUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch("/api/upload/logo", { method: "POST", body: fd });
    const d = await r.json();
    setLogoUploading(false);
    if (r.ok && d.url) {
      setShop(p => ({ ...p, logoUrl: d.url }));
      showToast("success", "লোগো আপলোড হয়েছে ✓");
    } else {
      showToast("error", d.error ?? "লোগো আপলোড ব্যর্থ হয়েছে।");
    }
    e.target.value = "";
  }

  async function removeLogo() {
    setLogoUploading(true);
    await fetch("/api/upload/logo", { method: "DELETE" });
    setShop(p => ({ ...p, logoUrl: "" }));
    setLogoUploading(false);
    showToast("success", "লোগো মুছে ফেলা হয়েছে।");
  }

  async function connectSMS() {
    if (!smsApiKeyInput.trim()) { showToast("error", "API Key দিন"); return; }
    setConnectingSMS(true);
    const r = await fetch("/api/settings/sms/connect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ api_key: smsApiKeyInput.trim() }) });
    const d = await r.json();
    setConnectingSMS(false);
    if (r.ok) {
      setSmsConnected(true); setSmsBalance(d.balance ?? null); setSmsApiKeyInput("");
      setSmsMaskedKey("••••••••" + smsApiKeyInput.trim().slice(-4));
      if (d.warning) {
        showToast("success", `SMS সংযুক্ত হয়েছে ✓ (${d.warning})`);
      } else {
        showToast("success", `SMS সংযুক্ত হয়েছে ✓ ব্যালেন্স: ৳${d.balance ?? "N/A"}`);
      }
    } else {
      showToast("error", d.error ?? "সংযোগ ব্যর্থ হয়েছে");
    }
  }

  async function disconnectSMS() {
    setDisconnectingSMS(true);
    const r = await fetch("/api/settings/sms/disconnect", { method: "POST" });
    setDisconnectingSMS(false);
    if (r.ok) { setSmsConnected(false); setSmsMaskedKey(null); setSmsBalance(null); showToast("success", "SMS সংযোগ বিচ্ছিন্ন হয়েছে"); }
  }

  async function saveSmsPrefs() {
    setSavingPrefs(true);
    const r = await fetch("/api/settings/sms/preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(smsPrefs) });
    setSavingPrefs(false);
    showToast(r.ok ? "success" : "error", r.ok ? "পছন্দ সংরক্ষিত হয়েছে ✓" : "কিছু একটা সমস্যা হয়েছে।");
  }

  async function sendTestSMS() {
    if (!testPhone.trim()) { showToast("error", "ফোন নম্বর দিন"); return; }
    setTestingSSMS(true);
    const r = await fetch("/api/settings/sms/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: testPhone }) });
    const d = await r.json();
    setTestingSSMS(false);
    showToast(r.ok ? "success" : "error", r.ok ? "টেস্ট SMS পাঠানো হয়েছে ✓" : (d.error ?? "পাঠানো যায়নি"));
  }

  async function connectWA() {
    if (!waTokenInput.trim() || !waPhoneInput.trim()) { showToast("error", "API Token ও Phone Number ID দিন"); return; }
    setConnectingWA(true);
    const r = await fetch("/api/settings/whatsapp/connect", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ api_token: waTokenInput.trim(), phone_number_id: waPhoneInput.trim(), business_account_id: waBusinessInput.trim() }) });
    const d = await r.json();
    setConnectingWA(false);
    if (r.ok) {
      setWaConnected(true);
      setWaMaskedToken("••••••••" + waTokenInput.trim().slice(-6));
      setWaPhoneNumberId(waPhoneInput.trim());
      setWaTokenInput(""); setWaPhoneInput(""); setWaBusinessInput("");
      showToast("success", "WhatsApp সংযুক্ত হয়েছে ✓");
    } else {
      showToast("error", d.error ?? "সংযোগ ব্যর্থ হয়েছে");
    }
  }

  async function disconnectWA() {
    setDisconnectingWA(true);
    const r = await fetch("/api/settings/whatsapp/disconnect", { method: "POST" });
    setDisconnectingWA(false);
    if (r.ok) { setWaConnected(false); setWaMaskedToken(null); setWaPhoneNumberId(""); setWaBusinessId(""); showToast("success", "WhatsApp সংযোগ বিচ্ছিন্ন হয়েছে"); }
  }

  async function testWA() {
    if (!waTestPhone.trim()) { showToast("error", "ফোন নম্বর দিন"); return; }
    setTestingWA(true);
    const r = await fetch("/api/settings/whatsapp/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone: waTestPhone.trim() }) });
    const d = await r.json();
    setTestingWA(false);
    showToast(r.ok ? "success" : "error", r.ok ? "টেস্ট Message পাঠানো হয়েছে ✓" : (d.error ?? "পাঠানো যায়নি"));
  }

  async function saveInvoiceSettings(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const r = await fetch("/api/settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "invoice", ...invoiceSettings }) });
    setSaving(false);
    showToast(r.ok ? "success" : "error", r.ok ? "Invoice সেটিংস সেভ হয়েছে ✓" : "কিছু একটা সমস্যা হয়েছে।");
  }

  function toggleDarkMode(on: boolean) {
    setDarkMode(on);
    if (on) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("bizilcore-dark", "1");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("bizilcore-dark", "0");
    }
  }

  const planDisplay = PLAN_DISPLAY[plan] ?? PLAN_DISPLAY.free;
  const planLimits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;

  async function disconnectFacebook() {
    setDisconnecting(true);
    const r = await fetch("/api/facebook/disconnect", { method: "DELETE" });
    if (r.ok) { setFbConn({ connected: false }); showToast("success", "Facebook Page সংযোগ বিচ্ছিন্ন হয়েছে ✓"); }
    else showToast("error", "কিছু একটা সমস্যা হয়েছে।");
    setDisconnecting(false);
  }

  async function addFbPage(e: React.FormEvent) {
    e.preventDefault();
    if (!newPage.pageId || !newPage.pageName || !newPage.accessToken) return;
    setAddingPage(true);
    const r = await fetch("/api/facebook/pages", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPage),
    });
    if (r.ok) {
      const d = await r.json();
      setFbPages(p => [d, ...p.filter(x => x.pageId !== d.pageId)]);
      setNewPage({ pageId: "", pageName: "", accessToken: "", category: "" });
      setAddPageModal(false);
      showToast("success", "Facebook Page যোগ হয়েছে ✓");
    } else showToast("error", "Page যোগ করতে সমস্যা হয়েছে।");
    setAddingPage(false);
  }

  async function toggleFbPage(id: string, isActive: boolean) {
    const r = await fetch("/api/facebook/pages", {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive }),
    });
    if (r.ok) {
      setFbPages(p => p.map(x => x.id === id ? { ...x, isActive } : x));
      showToast("success", `Page ${isActive ? "সক্রিয়" : "নিষ্ক্রিয়"} করা হয়েছে ✓`);
    }
  }

  async function removeFbPage(id: string) {
    if (!confirm("এই Facebook Page সরিয়ে দেবেন?")) return;
    const r = await fetch(`/api/facebook/pages?id=${id}`, { method: "DELETE" });
    if (r.ok) {
      setFbPages(p => p.filter(x => x.id !== id));
      showToast("success", "Page সরানো হয়েছে ✓");
    }
  }

  async function saveSalesTarget(e: React.FormEvent) {
    e.preventDefault();
    setSavingTarget(true);
    await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "notif", settings: { ...notifs, salesTarget } }),
    });
    setSavingTarget(false);
    showToast("success", "লক্ষ্যমাত্রা সেভ হয়েছে ✓");
  }

  async function saveAccount(e: React.FormEvent) {
    e.preventDefault();
    setSavingAccount(true);
    const r = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "profile", name: account.name, email: account.email }),
    });
    const d = await r.json();
    setSavingAccount(false);
    if (r.ok) showToast("success", "Account আপডেট হয়েছে ✓");
    else showToast("error", d.error ?? "কিছু একটা সমস্যা হয়েছে।");
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) { showToast("error", "নতুন পাসওয়ার্ড মিলছে না।"); return; }
    setSavingPw(true);
    const r = await fetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "password", currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }),
    });
    const d = await r.json();
    setSavingPw(false);
    if (r.ok) { showToast("success", "পাসওয়ার্ড পরিবর্তন হয়েছে ✓"); setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" }); }
    else showToast("error", d.error ?? "কিছু একটা সমস্যা হয়েছে।");
  }

  useEffect(() => {
    if (tab !== "catalog" || !catalogSlug || !catalogEnabled) { setQrDataUrl(null); return; }
    const catalogUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/s/${catalogSlug}`;
    import("qrcode").then(QRCode => {
      QRCode.toDataURL(catalogUrl, { width: 200, margin: 2, color: { dark: "#0F6E56", light: "#FFFFFF" } })
        .then(url => setQrDataUrl(url))
        .catch(() => setQrDataUrl(null));
    });
  }, [tab, catalogSlug, catalogEnabled]);

  async function checkSlugAvailability(slug: string) {
    if (slug.length < 3) { setSlugAvailable(null); return; }
    setCheckingSlug(true);
    try {
      const r = await fetch(`/api/catalog/check-slug?slug=${encodeURIComponent(slug)}`);
      if (!r.ok) { setSlugAvailable(null); return; }
      const d = await r.json();
      setSlugAvailable(d.available ?? null);
    } catch {
      setSlugAvailable(null);
      showToast("error", "Slug যাচাই করা সম্ভব হয়নি। আবার চেষ্টা করুন।");
    } finally {
      setCheckingSlug(false);
    }
  }

  async function saveCatalog(e: React.FormEvent) {
    e.preventDefault();
    if (!catalogSlug || catalogSlug.length < 3) { showToast("error", "Slug কমপক্ষে ৩ অক্ষর হতে হবে"); return; }
    if (slugAvailable === false) { showToast("error", "এই slug ইতিমধ্যে ব্যবহৃত হচ্ছে"); return; }
    setSavingCatalog(true);
    const r = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "catalog", slug: catalogSlug, catalogEnabled, catalogTagline, catalogShowInStockOnly }),
    });
    const d = await r.json();
    setSavingCatalog(false);
    if (r.ok) {
      showToast("success", "ক্যাটালগ সেটিংস সেভ হয়েছে ✓");
      setCatalogSlug(d.slug ?? catalogSlug);
    } else {
      showToast("error", d.error ?? "কিছু একটা সমস্যা হয়েছে।");
    }
  }

  const TABS = [
    { key: "account", label: "অ্যাকাউন্ট", desc: "প্রোফাইল ও পাসওয়ার্ড", icon: User },
    { key: "shop", label: "Shop তথ্য", desc: "শপের নাম ও ঠিকানা", icon: Store },
    { key: "invoice", label: "Invoice", desc: "কাস্টম invoice সেটিংস", icon: FileText },
    { key: "catalog", label: "ক্যাটালগ", desc: "পাবলিক শপ পেজ", icon: Globe },
    { key: "subscription", label: "Subscription", desc: "Plan ও billing", icon: CreditCard },
    { key: "notifications", label: "Notifications", desc: "SMS ও alert সেটিংস", icon: Bell },
    { key: "facebook", label: "Facebook", desc: "Page সংযোগ", icon: Facebook },
    { key: "whatsapp", label: "WhatsApp", desc: "Meta API সংযোগ", icon: MessageCircle },
    { key: "ai", label: "AI সেটিংস", desc: "AI ব্যবহার ও সীমা", icon: Sparkles },
    { key: "slip", label: "অর্ডার স্লিপ", desc: "পেকিং স্লিপ কাস্টমাইজ করুন", icon: Printer },
    { key: "courier", label: "কুরিয়ার", desc: "Pathao, Steadfast, RedX API", icon: Truck },
    { key: "blacklist", label: "ব্ল্যাকলিস্ট", desc: "ফেক অর্ডার সুরক্ষা", icon: ShieldX },
    { key: "referral", label: "Referral", desc: "বন্ধুকে invite করুন", icon: Target },
  ];

  const activeTab = TABS.find(t => t.key === tab);
  const ActiveTabIcon = activeTab?.icon ?? null;

  return (
    <div className="max-w-5xl">
      {toast && <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg" style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>{toast.msg}</div>}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} onSuccess={() => { setShowUpgrade(false); refreshSub(); }} />}

      {/* ─── Business Type Switch Modal ────────── */}
      {btModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto" style={{ backgroundColor: "var(--c-surface-raised)" }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: S.border }}>
              <h3 className="font-bold text-lg" style={{ color: S.text }}>Business Type পরিবর্তন করুন</h3>
              <button onClick={() => { setBtModalOpen(false); setSelectedBt(businessType); }} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100" style={{ color: S.muted }}>
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Warning */}
              <div className="flex items-start gap-3 p-4 rounded-xl border" style={{ backgroundColor: "#FFFBEB", borderColor: "#FDE68A" }}>
                <span className="text-lg flex-shrink-0">⚠️</span>
                <p className="text-sm" style={{ color: "#92600A" }}>পরিবর্তন করলে কিছু menu hide হতে পারে। আপনার সব data সুরক্ষিত থাকবে।</p>
              </div>

              {/* 6 Business Type Cards (2×3 grid) */}
              <div className="grid grid-cols-2 gap-3">
                {BUSINESS_TYPES.map((bt) => {
                  const meta = BUSINESS_TYPE_META[bt];
                  const Icon = meta.icon;
                  const isSelected = selectedBt === bt;
                  const isCurrent = businessType === bt;
                  return (
                    <button
                      key={bt}
                      onClick={() => setSelectedBt(bt)}
                      className="relative flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all text-left"
                      style={{
                        borderColor:     isSelected ? meta.color : S.border,
                        backgroundColor: isSelected ? meta.bgColor : S.surface,
                      }}
                    >
                      {isSelected && (
                        <span className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center" style={{ backgroundColor: meta.color }}>
                          <Check size={11} color="white" strokeWidth={3} />
                        </span>
                      )}
                      {isCurrent && !isSelected && (
                        <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#E5E7EB", color: S.muted }}>
                          বর্তমান
                        </span>
                      )}
                      <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: meta.bgColor }}>
                        <Icon size={20} style={{ color: meta.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-center" style={{ color: isSelected ? meta.color : S.text }}>{meta.label}</p>
                        <p className="text-[11px] text-center leading-tight mt-0.5" style={{ color: S.muted }}>{meta.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setBtModalOpen(false); setSelectedBt(businessType); }}
                  className="flex-1 py-3 rounded-xl font-medium text-sm border"
                  style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}
                >
                  বাতিল
                </button>
                <button
                  disabled={switchingBt || selectedBt === businessType}
                  onClick={async () => {
                    setSwitchingBt(true);
                    try {
                      const r = await fetch("/api/settings/business-type", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ businessType: selectedBt }),
                      });
                      if (r.ok) {
                        window.location.reload();
                      } else {
                        const d = await r.json();
                        showToast("error", d.error ?? "পরিবর্তন ব্যর্থ হয়েছে।");
                        setSwitchingBt(false);
                      }
                    } catch {
                      showToast("error", "Network error। আবার চেষ্টা করুন।");
                      setSwitchingBt(false);
                    }
                  }}
                  className="flex-1 py-3 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-50"
                  style={{ backgroundColor: selectedBt !== businessType ? BUSINESS_TYPE_META[selectedBt].color : S.primary }}
                >
                  {switchingBt ? "পরিবর্তন হচ্ছে..." : "নিশ্চিত করুন"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Sales Channel Switch Modal ────────── */}
      {scModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="rounded-2xl w-full max-w-sm" style={{ backgroundColor: "var(--c-surface-raised)" }}>
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: S.border }}>
              <h3 className="font-bold text-lg" style={{ color: S.text }}>Sales Channel পরিবর্তন করুন</h3>
              <button onClick={() => { setScModalOpen(false); setSelectedSc(salesChannel); }} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100" style={{ color: S.muted }}>
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-xl border" style={{ backgroundColor: "#FFFBEB", borderColor: "#FDE68A" }}>
                <span className="text-base flex-shrink-0">⚠️</span>
                <p className="text-xs" style={{ color: "#92600A" }}>পরিবর্তন করলে কিছু feature hide হতে পারে। আপনার সব data সুরক্ষিত থাকবে।</p>
              </div>
              <div className="flex flex-col gap-2">
                {SALES_CHANNELS.map((ch) => {
                  const meta = SALES_CHANNEL_META[ch];
                  const Icon = meta.icon;
                  const isSelected = selectedSc === ch;
                  const isCurrent = salesChannel === ch;
                  return (
                    <button key={ch} onClick={() => setSelectedSc(ch)}
                      className="relative flex items-center gap-3 p-3.5 rounded-2xl border-2 transition-all text-left"
                      style={{ borderColor: isSelected ? meta.color : S.border, backgroundColor: isSelected ? meta.bgColor : S.surface }}>
                      {isSelected && (
                        <span className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: meta.color }}>
                          <Check size={9} color="white" strokeWidth={3} />
                        </span>
                      )}
                      {isCurrent && !isSelected && (
                        <span className="absolute top-2 right-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: "#E5E7EB", color: S.muted }}>বর্তমান</span>
                      )}
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: isSelected ? `${meta.color}20` : "#F7F6F2" }}>
                        <Icon size={18} style={{ color: meta.color }} />
                      </div>
                      <div>
                        <p className="text-sm font-bold" style={{ color: isSelected ? meta.color : S.text }}>{meta.label}</p>
                        <p className="text-[11px] leading-tight mt-0.5" style={{ color: S.muted }}>{meta.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-3 pt-1">
                <button onClick={() => { setScModalOpen(false); setSelectedSc(salesChannel); }}
                  className="flex-1 py-3 rounded-xl font-medium text-sm border"
                  style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
                  বাতিল
                </button>
                <button
                  disabled={switchingSc || selectedSc === salesChannel}
                  onClick={async () => {
                    setSwitchingSc(true);
                    try {
                      const r = await fetch("/api/settings/sales-channel", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ salesChannel: selectedSc }),
                      });
                      if (r.ok) { window.location.reload(); }
                      else { const d = await r.json(); showToast("error", d.error ?? "পরিবর্তন ব্যর্থ হয়েছে।"); setSwitchingSc(false); }
                    } catch { showToast("error", "Network error। আবার চেষ্টা করুন।"); setSwitchingSc(false); }
                  }}
                  className="flex-1 py-3 rounded-xl text-white font-bold text-sm transition-all disabled:opacity-50"
                  style={{ backgroundColor: selectedSc !== salesChannel ? SALES_CHANNEL_META[selectedSc].color : S.primary }}>
                  {switchingSc ? "পরিবর্তন হচ্ছে..." : "নিশ্চিত করুন"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Mobile menu grid */}
      {mobileView === "menu" && (
        <div className="lg:hidden mb-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--c-primary-light)" }}>
              <Settings size={15} style={{ color: S.primary }} />
            </div>
            <span className="font-bold text-base" style={{ color: S.text }}>সেটিংস</span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            {TABS.map(t => {
              const MIcon = t.icon;
              return (
                <button key={t.key} onClick={() => { setTab(t.key); setMobileView("content"); }}
                  className="flex items-center gap-3 p-3.5 rounded-2xl border text-left transition-all active:scale-95"
                  style={{ backgroundColor: S.surface, borderColor: S.border }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--c-primary-light)" }}>
                    <MIcon size={16} style={{ color: S.primary }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: S.text }}>{t.label}</p>
                    <p className="text-xs truncate mt-0.5" style={{ color: S.muted }}>{t.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Mobile back button when content shown */}
      {mobileView === "content" && (
        <div className="lg:hidden flex items-center gap-3 mb-4">
          <button onClick={() => setMobileView("menu")} className="flex items-center gap-1.5 text-sm font-medium" style={{ color: S.primary }}>
            <ChevronLeft size={18} />
            সেটিংস মেনু
          </button>
          {activeTab && (
            <span className="text-sm font-semibold" style={{ color: S.text }}>/ {activeTab.label}</span>
          )}
        </div>
      )}

      <div className={`flex gap-6 items-start ${mobileView === "menu" ? "hidden lg:flex" : ""}`}>
        {/* Desktop Sidebar */}
        <div className="hidden lg:flex flex-col w-56 flex-shrink-0 sticky top-6">
          <div className="flex items-center gap-2 px-3 mb-5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--c-primary-light)" }}>
              <Settings size={15} style={{ color: S.primary }} />
            </div>
            <span className="font-bold text-base" style={{ color: S.text }}>সেটিংস</span>
          </div>
          <nav className="space-y-1">
            {TABS.map(t => {
              const Icon = t.icon;
              const isActive = tab === t.key;
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left"
                  style={{
                    backgroundColor: isActive ? "var(--c-primary-light)" : "transparent",
                    color: isActive ? S.primary : S.secondary,
                  }}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: isActive ? S.primary : S.border }}>
                    <Icon size={14} color={isActive ? "white" : S.secondary} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{t.label}</p>
                    <p className="text-xs truncate mt-0.5" style={{ color: isActive ? S.primary : S.muted, opacity: 0.8 }}>{t.desc}</p>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content Area */}
        <div className={`flex-1 min-w-0 ${mobileView === "menu" ? "hidden lg:block" : ""}`}>
          {/* Section Header */}
          {activeTab && (
            <div className="flex items-center gap-3 mb-5 pb-4 border-b" style={{ borderColor: S.border }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "var(--c-primary-light)" }}>
                {ActiveTabIcon && <ActiveTabIcon size={18} style={{ color: S.primary }} />}
              </div>
              <div>
                <h2 className="font-bold text-base" style={{ color: S.text }}>{activeTab.label}</h2>
                <p className="text-xs" style={{ color: S.muted }}>{activeTab.desc}</p>
              </div>
            </div>
          )}

      {/* ─── ACCOUNT ────────────────────────────── */}
      {tab === "account" && (
        <div className="space-y-5">
          {/* Profile */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center gap-2 mb-4">
              <User size={15} style={{ color: S.primary }} />
              <h4 className="font-semibold text-sm" style={{ color: S.text }}>প্রোফাইল তথ্য</h4>
            </div>
            <form onSubmit={saveAccount} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: S.text }}>নাম *</label>
                <input value={account.name} onChange={e => setAccount(p => ({ ...p, name: e.target.value }))}
                  style={inp(focused === "accname")} onFocus={() => setFocused("accname")} onBlur={() => setFocused(null)}
                  placeholder="আপনার নাম" required />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: S.text }}>Email</label>
                <input type="email" value={account.email} onChange={e => setAccount(p => ({ ...p, email: e.target.value }))}
                  style={inp(focused === "accemail")} onFocus={() => setFocused("accemail")} onBlur={() => setFocused(null)}
                  placeholder="email@example.com" />
              </div>
              <button type="submit" disabled={savingAccount}
                className="w-full py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60" style={{ backgroundColor: S.primary }}>
                {savingAccount ? "সেভ হচ্ছে..." : "প্রোফাইল সেভ করুন"}
              </button>
            </form>
          </div>

          {/* Sales Target */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center gap-2 mb-4">
              <span style={{ fontSize: "18px" }}>🎯</span>
              <div>
                <h4 className="font-semibold text-sm" style={{ color: S.text }}>মাসিক লক্ষ্যমাত্রা</h4>
                <p className="text-xs mt-0.5" style={{ color: S.muted }}>Dashboard-এ progress bar দেখাবে</p>
              </div>
            </div>
            <form onSubmit={saveSalesTarget} className="flex gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: S.muted }}>৳</span>
                <input
                  type="number"
                  min="0"
                  value={salesTarget || ""}
                  onChange={e => setSalesTarget(Number(e.target.value))}
                  placeholder="যেমন: 50000"
                  style={{ ...inp(focused === "target"), paddingLeft: "28px" }}
                  onFocus={() => setFocused("target")}
                  onBlur={() => setFocused(null)}
                />
              </div>
              <button type="submit" disabled={savingTarget}
                className="px-4 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-60 flex-shrink-0"
                style={{ backgroundColor: S.primary }}>
                {savingTarget ? "..." : "সেভ"}
              </button>
            </form>
            {salesTarget > 0 && (
              <p className="text-xs mt-2" style={{ color: S.muted }}>
                লক্ষ্য: {salesTarget.toLocaleString("bn-BD")} টাকা/মাস
              </p>
            )}
          </div>

          {/* Dark Mode */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span style={{ fontSize: "18px" }}>{darkMode ? "🌙" : "☀️"}</span>
                <div>
                  <h4 className="font-semibold text-sm" style={{ color: S.text }}>Dark Mode</h4>
                  <p className="text-xs mt-0.5" style={{ color: S.muted }}>রাতে কাজ করার জন্য</p>
                </div>
              </div>
              <div className="w-11 h-6 rounded-full flex items-center px-0.5 transition-colors cursor-pointer"
                style={{ backgroundColor: darkMode ? S.primary : S.border }}
                onClick={() => toggleDarkMode(!darkMode)}>
                <div className="w-5 h-5 rounded-full bg-white shadow transition-transform"
                  style={{ transform: darkMode ? "translateX(20px)" : "translateX(0)" }} />
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center gap-2 mb-4">
              <User size={15} style={{ color: S.primary }} />
              <h4 className="font-semibold text-sm" style={{ color: S.text }}>পাসওয়ার্ড পরিবর্তন</h4>
            </div>
            <form onSubmit={changePassword} className="space-y-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: S.text }}>বর্তমান পাসওয়ার্ড *</label>
                <input type="password" value={pwForm.currentPassword} onChange={e => setPwForm(p => ({ ...p, currentPassword: e.target.value }))}
                  style={inp(focused === "curpw")} onFocus={() => setFocused("curpw")} onBlur={() => setFocused(null)}
                  placeholder="••••••••" required />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: S.text }}>নতুন পাসওয়ার্ড *</label>
                <input type="password" value={pwForm.newPassword} onChange={e => setPwForm(p => ({ ...p, newPassword: e.target.value }))}
                  style={inp(focused === "newpw")} onFocus={() => setFocused("newpw")} onBlur={() => setFocused(null)}
                  placeholder="কমপক্ষে ৬ অক্ষর" required minLength={6} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: S.text }}>নতুন পাসওয়ার্ড নিশ্চিত করুন *</label>
                <input type="password" value={pwForm.confirmPassword} onChange={e => setPwForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  style={inp(focused === "conpw")} onFocus={() => setFocused("conpw")} onBlur={() => setFocused(null)}
                  placeholder="••••••••" required />
              </div>
              <button type="submit" disabled={savingPw}
                className="w-full py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60" style={{ backgroundColor: "#E24B4A" }}>
                {savingPw ? "পরিবর্তন হচ্ছে..." : "পাসওয়ার্ড পরিবর্তন করুন"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ─── SHOP PROFILE ─────────────────────── */}
      {tab === "shop" && (
        loading ? <div className="animate-pulse space-y-4">{[1,2,3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl" />)}</div> : (
          <div className="space-y-5">
          <form onSubmit={saveShop} className="space-y-4">
            {/* Logo Upload */}
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: S.text }}>শপের লোগো</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl border-2 border-dashed flex items-center justify-center overflow-hidden flex-shrink-0"
                  style={{ borderColor: shop.logoUrl ? "transparent" : S.border, backgroundColor: shop.logoUrl ? "transparent" : S.bg }}>
                  {shop.logoUrl
                    ? <img src={shop.logoUrl} alt="লোগো" className="w-full h-full object-cover rounded-2xl" />
                    : <span className="text-2xl">🏪</span>}
                </div>
                <div className="flex flex-col gap-2">
                  <label className="cursor-pointer px-4 py-2 rounded-xl text-sm font-medium border transition-colors hover:opacity-80 flex items-center gap-2"
                    style={{ borderColor: S.primary, color: S.primary, backgroundColor: "var(--c-primary-light)" }}>
                    {logoUploading ? "আপলোড হচ্ছে..." : "ছবি বেছে নিন"}
                    <input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" className="hidden" disabled={logoUploading} onChange={handleLogoUpload} />
                  </label>
                  {shop.logoUrl && (
                    <button type="button" onClick={removeLogo} disabled={logoUploading}
                      className="px-4 py-2 rounded-xl text-sm font-medium border transition-colors hover:opacity-80"
                      style={{ borderColor: "#E24B4A", color: "#E24B4A" }}>
                      লোগো মুছুন
                    </button>
                  )}
                  <p className="text-xs" style={{ color: S.muted }}>JPG, PNG বা WEBP • সর্বোচ্চ ৩০০KB</p>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: S.text }}>শপের নাম *</label>
              <input type="text" value={shop.name} onChange={e => setShop(p => ({ ...p, name: e.target.value }))} required style={inp(focused === "name")} onFocus={() => setFocused("name")} onBlur={() => setFocused(null)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: S.text }}>ফোন নম্বর</label>
              <input type="tel" value={shop.phone} onChange={e => setShop(p => ({ ...p, phone: e.target.value }))} placeholder="01XXXXXXXXX" style={inp(focused === "phone")} onFocus={() => setFocused("phone")} onBlur={() => setFocused(null)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: S.text }}>ইমেইল</label>
              <input type="email" value={shop.email} onChange={e => setShop(p => ({ ...p, email: e.target.value }))} placeholder="shop@example.com" style={inp(focused === "email")} onFocus={() => setFocused("email")} onBlur={() => setFocused(null)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: S.text }}>ঠিকানা</label>
              <input type="text" value={shop.address} onChange={e => setShop(p => ({ ...p, address: e.target.value }))} placeholder="শপের পূর্ণ ঠিকানা" style={inp(focused === "address")} onFocus={() => setFocused("address")} onBlur={() => setFocused(null)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: S.text }}>ব্যবসার ধরন</label>
              <select value={shop.category} onChange={e => setShop(p => ({ ...p, category: e.target.value }))} style={{ ...inp(false), appearance: "auto" }}>
                <option value="">বেছে নিন</option>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button type="submit" disabled={saving} className="w-full py-3 rounded-xl text-white font-medium disabled:opacity-60" style={{ backgroundColor: S.primary }}>
              {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
            </button>
          </form>

          {/* ─── Business Type Section ─── */}
          {(() => {
            const meta = BUSINESS_TYPE_META[businessType];
            const Icon = meta.icon;
            return (
              <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                <div className="flex items-center gap-2 mb-1">
                  <RefreshCcw size={16} style={{ color: S.muted }} />
                  <h4 className="font-semibold text-sm" style={{ color: S.text }}>Business Type</h4>
                </div>
                <p className="text-xs mb-4" style={{ color: S.muted }}>আপনার ব্যবসার ধরন পরিবর্তন করুন। সব data সুরক্ষিত থাকবে।</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: meta.bgColor }}>
                      <Icon size={20} style={{ color: meta.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: S.text }}>{meta.label}</p>
                      <p className="text-[11px]" style={{ color: S.muted }}>{meta.description}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0" style={{ backgroundColor: meta.bgColor, color: meta.color }}>
                    বর্তমান
                  </span>
                </div>

                <button
                  onClick={() => { setSelectedBt(businessType); setBtModalOpen(true); }}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border font-medium text-sm transition-all hover:opacity-80"
                  style={{ borderColor: meta.color, color: meta.color, backgroundColor: meta.bgColor }}
                >
                  <RefreshCcw size={15} />
                  Business Type পরিবর্তন করুন
                </button>
              </div>
            );
          })()}

          {/* ─── Sales Channel Section ─── */}
          {(() => {
            const meta = SALES_CHANNEL_META[salesChannel];
            const Icon = meta.icon;
            return (
              <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                <div className="flex items-center gap-2 mb-1">
                  <Globe size={16} style={{ color: S.muted }} />
                  <h4 className="font-semibold text-sm" style={{ color: S.text }}>Sales Channel</h4>
                </div>
                <p className="text-xs mb-4" style={{ color: S.muted }}>আপনি কীভাবে বিক্রি করেন — Online, Offline, বা উভয়ই।</p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: meta.bgColor }}>
                      <Icon size={20} style={{ color: meta.color }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: S.text }}>{meta.label}</p>
                      <p className="text-[11px]" style={{ color: S.muted }}>{meta.description}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0" style={{ backgroundColor: meta.bgColor, color: meta.color }}>
                    বর্তমান
                  </span>
                </div>

                <button
                  onClick={() => { setSelectedSc(salesChannel); setScModalOpen(true); }}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border font-medium text-sm transition-all hover:opacity-80"
                  style={{ borderColor: meta.color, color: meta.color, backgroundColor: meta.bgColor }}
                >
                  <Globe size={15} />
                  Sales Channel পরিবর্তন করুন
                </button>
              </div>
            );
          })()}
          </div>
        )
      )}

      {/* ─── INVOICE ──────────────────────────── */}
      {tab === "invoice" && (
        <div className="space-y-5">
          <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <h4 className="font-semibold text-sm mb-1" style={{ color: S.text }}>Invoice কাস্টমাইজেশন</h4>
            <p className="text-xs mb-4" style={{ color: S.muted }}>প্রতিটি invoice-এ এই তথ্য দেখা যাবে।</p>
            <form onSubmit={saveInvoiceSettings} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: S.text }}>ব্যাংক / মোবাইল ব্যাংকিং নাম</label>
                <input type="text" value={invoiceSettings.bankName}
                  onChange={e => setInvoiceSettings(p => ({ ...p, bankName: e.target.value }))}
                  placeholder="যেমন: bKash / Dutch-Bangla Bank"
                  style={inp(focused === "bankName")} onFocus={() => setFocused("bankName")} onBlur={() => setFocused(null)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: S.text }}>Account / মোবাইল নম্বর</label>
                <input type="text" value={invoiceSettings.bankAccount}
                  onChange={e => setInvoiceSettings(p => ({ ...p, bankAccount: e.target.value }))}
                  placeholder="01XXXXXXXXX বা Account নম্বর"
                  style={inp(focused === "bankAccount")} onFocus={() => setFocused("bankAccount")} onBlur={() => setFocused(null)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5" style={{ color: S.text }}>Invoice-এ কাস্টম বার্তা</label>
                <textarea value={invoiceSettings.invoiceNote}
                  onChange={e => setInvoiceSettings(p => ({ ...p, invoiceNote: e.target.value }))}
                  placeholder="যেমন: পণ্য ফেরত নেওয়া হবে না। ধন্যবাদ!"
                  rows={3} className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
                  style={{ borderColor: S.border, color: S.text }} />
              </div>
              <div className="p-4 rounded-xl" style={{ backgroundColor: "#F0FBF6" }}>
                <p className="text-xs font-semibold mb-2" style={{ color: S.primary }}>প্রিভিউ</p>
                {invoiceSettings.bankName && invoiceSettings.bankAccount ? (
                  <div className="text-xs" style={{ color: S.text }}>
                    <p className="font-semibold">{invoiceSettings.bankName}</p>
                    <p className="font-mono mt-0.5">{invoiceSettings.bankAccount}</p>
                  </div>
                ) : (
                  <p className="text-xs" style={{ color: S.muted }}>ব্যাংক তথ্য দিন</p>
                )}
                {invoiceSettings.invoiceNote && (
                  <p className="text-xs mt-2 p-2 rounded-lg" style={{ backgroundColor: "#FFF3DC", color: "#92600A" }}>
                    {invoiceSettings.invoiceNote}
                  </p>
                )}
              </div>
              <button type="submit" disabled={saving} className="w-full py-3 rounded-xl text-white font-medium disabled:opacity-60" style={{ backgroundColor: S.primary }}>
                {saving ? "সেভ হচ্ছে..." : "Invoice Settings সেভ করুন"}
              </button>
            </form>
          </div>

          <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <h4 className="font-semibold text-sm mb-1" style={{ color: S.text }}>Invoice থেকে Packing Slip</h4>
            <p className="text-xs" style={{ color: S.muted }}>
              যেকোনো অর্ডার detail থেকে &quot;Invoice&quot; বাটনের পাশে &quot;Packing Slip&quot; লিঙ্ক পাবেন।
              এটিতে কাস্টমারের নাম, ঠিকানা, ফোন, courier tracking ID, এবং পণ্যের তালিকা থাকে।
            </p>
          </div>
        </div>
      )}


      {/* ─── SUBSCRIPTION ─────────────────────── */}
      {tab === "subscription" && (
        <div className="space-y-4">
          {/* Current plan card */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold" style={{ color: S.text }}>বর্তমান Plan</h3>
              <span className="font-bold text-sm px-3 py-1 rounded-full" style={{ backgroundColor: planDisplay.bg, color: planDisplay.color }}>
                {planDisplay.label}
              </span>
            </div>

            {subscription?.endDate && (
              <div className={`rounded-xl px-4 py-3 mb-4 ${isExpiringSoon ? "bg-orange-50 border border-orange-200" : ""}`}
                style={!isExpiringSoon ? { backgroundColor: S.bg } : {}}>
                <div className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: S.muted }}>মেয়াদ শেষ</span>
                  <span className="font-semibold text-sm" style={{ color: isExpiringSoon ? "#EF9F27" : S.text }}>
                    {new Date(subscription.endDate).toLocaleDateString("bn-BD", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
                {daysLeft !== null && (
                  <p className="text-xs mt-1" style={{ color: isExpiringSoon ? "#EF9F27" : S.muted }}>
                    {isExpiringSoon ? `⚠️ মাত্র ${daysLeft} দিন বাকি!` : `${daysLeft} দিন বাকি`}
                  </p>
                )}
              </div>
            )}

            {/* Plan features */}
            <div className="space-y-2 mb-5">
              {[
                { label: "পণ্য", value: planLimits.products === -1 ? "সীমাহীন" : `${planLimits.products}টি` },
                { label: "অর্ডার/মাস", value: planLimits.ordersPerMonth === -1 ? "সীমাহীন" : `${planLimits.ordersPerMonth}টি` },
                { label: "Staff", value: planLimits.staff === -1 ? "সীমাহীন" : planLimits.staff === 0 ? "নেই" : `${planLimits.staff} জন` },
                { label: "SMS Notifications", value: planLimits.sms ? "✓ আছে" : "✗ নেই" },
                { label: "Excel Export", value: planLimits.export ? "✓ আছে" : "✗ নেই" },
              ].map(f => (
                <div key={f.label} className="flex items-center justify-between">
                  <span className="text-sm" style={{ color: S.secondary }}>{f.label}</span>
                  <span className="text-sm font-medium" style={{ color: f.value.startsWith("✓") ? S.primary : f.value.startsWith("✗") ? "var(--c-text-muted)" : S.text }}>{f.value}</span>
                </div>
              ))}
            </div>

            {plan === "free" ? (
              <Link href="/checkout?plan=pro" className="block w-full py-3 rounded-xl text-white font-semibold text-center" style={{ backgroundColor: S.primary, textDecoration: "none" }}>
                আপগ্রেড করুন 🚀
              </Link>
            ) : (
              <Link href="/checkout?plan=pro" className="block w-full py-3 rounded-xl text-white font-semibold text-center" style={{ backgroundColor: isExpiringSoon ? "#EF9F27" : S.primary, textDecoration: "none" }}>
                {isExpiringSoon ? "এখনই Renew করুন!" : "Plan Renew করুন"}
              </Link>
            )}
          </div>

          {/* Plan comparison */}
          {plan === "free" && (
            <div className="rounded-2xl p-5 text-white" style={{ background: "linear-gradient(135deg, #0F6E56, #0D5C47)" }}>
              <p className="text-sm font-bold opacity-70 mb-1">Pro Plan — সবচেয়ে জনপ্রিয়</p>
              <p className="text-3xl font-bold mb-1">৳২৯৯<span className="text-sm font-normal opacity-70">/মাস</span></p>
              <p className="text-sm opacity-80 mb-4">সীমাহীন পণ্য, অর্ডার, SMS, Courier, Export সব!</p>
              <Link href="/checkout?plan=pro" className="block w-full py-2.5 rounded-xl bg-white font-bold text-sm text-center" style={{ color: S.primary, textDecoration: "none" }}>
                Pro তে Upgrade করুন
              </Link>
            </div>
          )}

          {/* Payment history */}
          {payments.length > 0 && (
            <div className="rounded-2xl border overflow-hidden" style={{ borderColor: S.border }}>
              <div className="px-5 py-3 border-b" style={{ backgroundColor: "var(--c-surface)", borderColor: S.border }}>
                <h3 className="font-semibold text-sm" style={{ color: S.text }}>Payment ইতিহাস</h3>
              </div>
              <div className="divide-y" style={{ borderColor: S.border }}>
                {payments.map(p => (
                  <div key={p.id} className="px-5 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg" style={{ backgroundColor: p.method === "bkash" ? "#FCE4F0" : "#FEF0E0" }}>
                      {p.method === "bkash" ? "📱" : "💳"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold capitalize" style={{ color: S.text }}>
                        {p.plan === "pro" ? "Pro" : "Business"} · {p.months} মাস
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: S.muted }}>
                        {new Date(p.createdAt).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" })} · {p.method}
                      </p>
                      {p.transactionId && <p className="text-xs font-mono" style={{ color: S.muted }}>{p.transactionId.slice(0, 20)}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="font-bold text-sm" style={{ color: S.text }}>৳{p.amount.toLocaleString()}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{
                        backgroundColor: p.status === "completed" ? "var(--c-primary-light)" : p.status === "pending" ? "#FFF3DC" : "#FFE8E8",
                        color: p.status === "completed" ? S.primary : p.status === "pending" ? "#EF9F27" : "#E24B4A",
                      }}>
                        {p.status === "completed" ? "সম্পন্ন" : p.status === "pending" ? "অপেক্ষামান" : "ব্যর্থ"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── FACEBOOK ────────────────────────── */}
      {tab === "facebook" && (
        <div className="space-y-5">
          <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "#1877F2" }}>
                <Facebook size={20} color="#fff" />
              </div>
              <div>
                <h4 className="font-semibold text-sm" style={{ color: S.text }}>Facebook Page সংযোগ</h4>
                <p className="text-xs mt-0.5" style={{ color: S.muted }}>আপনার Facebook Page সংযুক্ত করুন — comment থেকে অর্ডার সাজেশন পান</p>
              </div>
            </div>

            {fbError && (
              <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ backgroundColor: "#FFF3F3", color: "#E24B4A" }}>
                {fbError}
              </div>
            )}

            {fbLoading ? (
              <div className="flex items-center gap-2 py-4" style={{ color: S.muted }}>
                <Loader2 size={18} className="animate-spin" /> যাচাই করা হচ্ছে...
              </div>
            ) : fbConn?.connected ? (
              <div>
                <div className="flex items-center gap-3 p-4 rounded-xl mb-4" style={{ backgroundColor: "#EEF3FD" }}>
                  <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "#1877F2" }}>
                    <Facebook size={16} color="#fff" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold" style={{ color: "#1877F2" }}>{fbConn.pageName}</p>
                    {fbConn.connectedAt && (
                      <p className="text-xs" style={{ color: S.muted }}>
                        {new Date(fbConn.connectedAt).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" })}-এ সংযুক্ত
                      </p>
                    )}
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: "var(--c-primary-light)", color: "var(--c-primary)" }}>সক্রিয়</span>
                </div>
                <div className="space-y-3 text-sm p-4 rounded-xl mb-4" style={{ backgroundColor: S.bg }}>
                  <div className="flex items-center gap-2" style={{ color: S.secondary }}>
                    <Check size={14} style={{ color: S.primary }} /> Post comments স্বয়ংক্রিয়ভাবে স্ক্যান হচ্ছে
                  </div>
                  <div className="flex items-center gap-2" style={{ color: S.secondary }}>
                    <Check size={14} style={{ color: S.primary }} /> "নেব", "চাই", "অর্ডার" keywords থেকে অর্ডার সাজেশন তৈরি হবে
                  </div>
                  <div className="flex items-center gap-2" style={{ color: S.secondary }}>
                    <Check size={14} style={{ color: S.primary }} /> Orders পৃষ্ঠায় সাজেশন দেখাবে
                  </div>
                </div>
                <button onClick={disconnectFacebook} disabled={disconnecting}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-colors hover:bg-red-50 disabled:opacity-50"
                  style={{ borderColor: "#E24B4A", color: "#E24B4A" }}>
                  <Unlink size={15} />
                  {disconnecting ? "বিচ্ছিন্ন করা হচ্ছে..." : "Page সংযোগ বিচ্ছিন্ন করুন"}
                </button>
              </div>
            ) : (
              <div>
                <div className="space-y-3 mb-5">
                  <div className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: S.bg }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5" style={{ backgroundColor: S.primary }}>১</div>
                    <p className="text-sm" style={{ color: S.secondary }}>Facebook Page সংযুক্ত করুন — আপনার Facebook অ্যাকাউন্টে লগইন করতে হবে</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: S.bg }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5" style={{ backgroundColor: S.primary }}>২</div>
                    <p className="text-sm" style={{ color: S.secondary }}>আপনার Page নির্বাচন করুন — BizilCore comment scan করবে</p>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: S.bg }}>
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 mt-0.5" style={{ backgroundColor: S.primary }}>৩</div>
                    <p className="text-sm" style={{ color: S.secondary }}>Orders পৃষ্ঠায় সম্ভাব্য অর্ডার দেখাবে — এক ক্লিকে অর্ডার বানান</p>
                  </div>
                </div>

                <a href="/api/facebook/connect"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-medium transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#1877F2" }}>
                  <Link2 size={16} />
                  Facebook Page সংযুক্ত করুন
                </a>
              </div>
            )}
          </div>

          {/* Multiple Facebook Pages */}
          <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold text-sm" style={{ color: S.text }}>একাধিক Facebook Page (Feature 42)</h4>
                <p className="text-xs mt-0.5" style={{ color: S.muted }}>একটি shop থেকে কয়েকটি Facebook Page পরিচালনা করুন</p>
              </div>
              <button
                onClick={() => setAddPageModal(true)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-white text-xs font-medium"
                style={{ backgroundColor: "#1877F2" }}
              >
                <Facebook size={13} color="#fff" /> Page যোগ করুন
              </button>
            </div>

            {fbPages.length === 0 ? (
              <div className="py-8 text-center rounded-xl" style={{ backgroundColor: S.bg }}>
                <Facebook size={28} className="mx-auto mb-2" style={{ color: "#BCC0C4" }} />
                <p className="text-sm font-medium" style={{ color: S.secondary }}>কোনো Page যোগ করা হয়নি</p>
                <p className="text-xs mt-1" style={{ color: S.muted }}>Page ID এবং Access Token দিয়ে যোগ করুন</p>
              </div>
            ) : (
              <div className="space-y-3">
                {fbPages.map(page => (
                  <div key={page.id} className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: S.border, backgroundColor: S.bg }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "#1877F2" }}>
                      <Facebook size={16} color="#fff" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: S.text }}>{page.pageName}</p>
                      <p className="text-xs" style={{ color: S.muted }}>
                        ID: {page.pageId}
                        {page.category && ` · ${page.category}`}
                        {page.followers != null && ` · ${page.followers.toLocaleString()} followers`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={() => toggleFbPage(page.id, !page.isActive)}
                        className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{
                          backgroundColor: page.isActive ? "var(--c-primary-light)" : "#F0F0F0",
                          color: page.isActive ? S.primary : S.muted
                        }}
                      >
                        {page.isActive ? "সক্রিয়" : "নিষ্ক্রিয়"}
                      </button>
                      <button onClick={() => removeFbPage(page.id)} className="p-1.5 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 size={13} style={{ color: "#E24B4A" }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Page Modal */}
          {addPageModal && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="w-full max-w-md rounded-2xl border p-6" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base" style={{ color: S.text }}>Facebook Page যোগ করুন</h3>
                  <button onClick={() => setAddPageModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                    <X size={16} style={{ color: S.muted }} />
                  </button>
                </div>
                <form onSubmit={addFbPage} className="space-y-3">
                  {[
                    { label: "Page ID *", key: "pageId", placeholder: "123456789012345" },
                    { label: "Page নাম *", key: "pageName", placeholder: "আপনার Shop Page" },
                    { label: "Access Token *", key: "accessToken", placeholder: "EAAxxxxxx..." },
                    { label: "Category (optional)", key: "category", placeholder: "Clothing, Electronics..." },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-medium mb-1" style={{ color: S.text }}>{f.label}</label>
                      <input
                        value={newPage[f.key as keyof typeof newPage]}
                        onChange={e => setNewPage(p => ({ ...p, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
                        style={{ borderColor: S.border, color: S.text }}
                        required={f.key !== "category"}
                      />
                    </div>
                  ))}
                  <p className="text-xs p-3 rounded-xl" style={{ backgroundColor: "#EEF3FD", color: "#2D5FBF" }}>
                    Page ID এবং Access Token Facebook Developer Console থেকে পাবেন। Graph API Explorer ব্যবহার করে Page Token নিন।
                  </p>
                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setAddPageModal(false)} className="flex-1 py-2.5 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.secondary }}>বাতিল</button>
                    <button type="submit" disabled={addingPage} className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60" style={{ backgroundColor: "#1877F2" }}>
                      {addingPage ? "যোগ হচ্ছে..." : "Page যোগ করুন"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <h4 className="font-semibold text-sm mb-3" style={{ color: S.text }}>Webhook Setup (Advanced)</h4>
            <p className="text-xs mb-3" style={{ color: S.muted }}>
              Real-time comment notification-এর জন্য Facebook Developer Console-এ Webhook সেট করুন:
            </p>
            <div className="p-3 rounded-xl font-mono text-xs break-all" style={{ backgroundColor: S.bg, color: S.secondary }}>
              {typeof window !== "undefined" ? `${window.location.origin}/api/webhooks/facebook` : "/api/webhooks/facebook"}
            </div>
            <p className="text-xs mt-2" style={{ color: S.muted }}>
              Verify Token: <code className="font-mono" style={{ color: S.text }}>bizilcore-fb-verify</code>
            </p>
          </div>
        </div>
      )}

      {/* ─── NOTIFICATIONS ────────────────────── */}
      {tab === "notifications" && (
        <div className="space-y-5">
          <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <h4 className="font-semibold text-sm mb-3" style={{ color: S.text }}>App Notifications</h4>
            <div className="space-y-1 divide-y" style={{ borderColor: S.border }}>
              <Toggle checked={notifs.lowStock} onChange={v => setNotifs(p => ({ ...p, lowStock: v }))} label="কম স্টক alert" />
              <Toggle checked={notifs.newOrder} onChange={v => setNotifs(p => ({ ...p, newOrder: v }))} label="নতুন order notification" />
              <Toggle checked={notifs.dueReminder} onChange={v => setNotifs(p => ({ ...p, dueReminder: v }))} label="Customer due reminder" />
            </div>
          </div>

          {/* ── SMS.net.bd Self-Service ── */}
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: `1px solid ${S.border}` }}>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: smsConnected ? "#DCFCE7" : "#FEE2E2" }}>
                  {smsConnected ? <Wifi size={15} color="#16A34A" /> : <WifiOff size={15} color="#DC2626" />}
                </div>
                <div>
                  <h4 className="font-semibold text-sm" style={{ color: S.text }}>SMS Notifications</h4>
                  <p className="text-xs" style={{ color: smsConnected ? "#16A34A" : "#DC2626" }}>
                    {smsConnected ? `🟢 সংযুক্ত আছে${smsBalance !== null ? ` — ব্যালেন্স: ৳${smsBalance}` : ""}` : "🔴 সংযুক্ত নেই"}
                  </p>
                </div>
              </div>
              {smsConnected && smsMaskedKey && (
                <span className="text-xs font-mono px-2 py-1 rounded-lg" style={{ backgroundColor: S.bg, color: S.muted }}>{smsMaskedKey}</span>
              )}
            </div>

            <div className="p-5 space-y-5">
              {/* Section A: API Connection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: S.muted }}>API সংযোগ</p>
                  <button onClick={() => setShowGuide(true)} className="flex items-center gap-1 text-xs" style={{ color: S.primary }}>
                    <BookOpen size={12} /> কিভাবে পাবেন? →
                  </button>
                </div>
                {!smsConnected ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type={showApiKey ? "text" : "password"}
                        value={smsApiKeyInput}
                        onChange={e => setSmsApiKeyInput(e.target.value)}
                        placeholder="SMS.net.bd API Key"
                        className="w-full pr-10 text-sm rounded-xl border outline-none px-3"
                        style={{ height: "42px", borderColor: S.border, color: S.text, backgroundColor: S.bg }}
                      />
                      <button onClick={() => setShowApiKey(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }}>
                        {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    <p className="text-xs" style={{ color: S.muted }}>
                      API Key পেতে <a href="https://portal.sms.net.bd" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: S.primary }}>portal.sms.net.bd</a> তে অ্যাকাউন্ট খুলুন।
                    </p>
                    <button onClick={connectSMS} disabled={connectingSMS || !smsApiKeyInput.trim()}
                      className="w-full py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                      style={{ backgroundColor: S.primary }}>
                      {connectingSMS ? <><Loader2 size={14} className="animate-spin" /> যাচাই হচ্ছে...</> : <><Wifi size={14} /> সংযোগ করুন</>}
                    </button>
                  </div>
                ) : (
                  <button onClick={disconnectSMS} disabled={disconnectingSMS}
                    className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border disabled:opacity-50"
                    style={{ borderColor: "#FCA5A5", color: "#DC2626", backgroundColor: "#FEF2F2" }}>
                    {disconnectingSMS ? <Loader2 size={13} className="animate-spin" /> : <Unlink size={13} />}
                    সংযোগ বিচ্ছিন্ন করুন
                  </button>
                )}
              </div>

              {/* Section B: Notification Preferences (always visible, disabled if not connected) */}
              <div className={!smsConnected ? "opacity-50 pointer-events-none select-none" : ""}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: S.muted }}>নোটিফিকেশন পছন্দ</p>
                  {!smsConnected && <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FEF3C7", color: "#92600A" }}>আগে সংযুক্ত করুন</span>}
                </div>
                <div className="space-y-1 rounded-xl border divide-y" style={{ borderColor: S.border }}>
                  {([
                    { key: "orderConfirmed" as const, label: "অর্ডার তৈরি হলে SMS পাঠাবো", hint: "নতুন অর্ডার তৈরি হলে কাস্টমারকে SMS যাবে" },
                    { key: "orderStatusChanged" as const, label: "অর্ডার স্ট্যাটাস পরিবর্তন হলে", hint: "অর্ডার shipped/processing হলে কাস্টমারকে জানানো হবে" },
                    { key: "deliveryConfirmed" as const, label: "ডেলিভারি নিশ্চিত হলে", hint: "পণ্য delivered হলে কাস্টমারকে জানানো হবে" },
                    { key: "paymentReceived" as const, label: "পেমেন্ট পাওয়া গেলে", hint: "পেমেন্ট কনফার্ম হলে কাস্টমারকে জানানো হবে" },
                    { key: "lowStockAlert" as const, label: "স্টক কম হলে (নিজেকে জানাবে)", hint: "পণ্যের স্টক কমে গেলে shop owner কে সতর্ক করা হবে" },
                  ] as const).map(({ key, label, hint }) => (
                    <div key={key} className="px-3">
                      <div className="flex items-start justify-between py-3 gap-3">
                        <div>
                          <p className="text-sm font-medium" style={{ color: S.text }}>{label}</p>
                          <p className="text-xs mt-0.5" style={{ color: S.muted }}>{hint}</p>
                        </div>
                        <div className="mt-0.5 w-11 h-6 rounded-full flex-shrink-0 flex items-center px-0.5 transition-colors cursor-pointer"
                          style={{ backgroundColor: smsPrefs[key] ? S.primary : S.border }}
                          onClick={() => smsConnected && setSmsPrefs(p => ({ ...p, [key]: !p[key] }))}>
                          <div className="w-5 h-5 rounded-full bg-white shadow transition-transform"
                            style={{ transform: smsPrefs[key] ? "translateX(20px)" : "translateX(0)" }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={saveSmsPrefs} disabled={savingPrefs || !smsConnected}
                  className="w-full mt-3 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: S.primary }}>
                  {savingPrefs ? <><Loader2 size={14} className="animate-spin" /> সেভ হচ্ছে...</> : <><Check size={14} /> পছন্দ সংরক্ষণ করুন</>}
                </button>
              </div>

              {/* Section C: Test SMS (always visible, disabled if not connected) */}
              <div className={!smsConnected ? "opacity-50 pointer-events-none select-none" : ""}>
                <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: S.muted }}>টেস্ট SMS</p>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={testPhone}
                    onChange={e => setTestPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="flex-1 text-sm rounded-xl border outline-none px-3"
                    style={{ height: "40px", borderColor: S.border, color: S.text, backgroundColor: S.bg }}
                  />
                  <button onClick={sendTestSMS} disabled={testingSSMS || !testPhone.trim() || !smsConnected}
                    className="px-4 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-50 flex items-center gap-1.5 flex-shrink-0"
                    style={{ backgroundColor: S.primary }}>
                    {testingSSMS ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                    {testingSSMS ? "পাঠাচ্ছে..." : "পাঠান"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Guide Modal */}
          {showGuide && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
              <div className="w-full max-w-md rounded-2xl p-6 shadow-2xl" style={{ backgroundColor: S.surface }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base" style={{ color: S.text }}>🔑 কিভাবে API Key পাবেন</h3>
                  <button onClick={() => setShowGuide(false)} style={{ color: S.muted }}><X size={18} /></button>
                </div>
                <div className="space-y-3">
                  {[
                    { step: "১", text: "portal.sms.net.bd তে যান এবং Sign Up করুন" },
                    { step: "২", text: "Email verify করে লগইন করুন" },
                    { step: "৩", text: 'Dashboard থেকে "API" মেনুতে যান' },
                    { step: "৪", text: "আপনার API Key কপি করুন" },
                    { step: "৫", text: 'BizilCore Settings এ paste করে "সংযোগ করুন" চাপুন' },
                  ].map(({ step, text }) => (
                    <div key={step} className="flex items-start gap-3">
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: S.primary }}>{step}</span>
                      <p className="text-sm pt-1" style={{ color: S.text }}>{text}</p>
                    </div>
                  ))}
                </div>
                <a href="https://portal.sms.net.bd" target="_blank" rel="noopener noreferrer"
                  className="mt-5 block w-full text-center py-2.5 rounded-xl text-white text-sm font-medium"
                  style={{ backgroundColor: S.primary }}>
                  portal.sms.net.bd এ যান →
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── CATALOG ─────────────────────────── */}
      {tab === "catalog" && (() => {
        const catalogUrl = catalogSlug ? `${typeof window !== "undefined" ? window.location.origin : ""}/s/${catalogSlug}` : "";

        if (plan !== "business") {
          return (
            <div className="rounded-2xl border p-10 flex flex-col items-center text-center" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: "linear-gradient(135deg, #FFF3DC 0%, #FDE68A 100%)" }}>
                <Crown size={28} color="#EF9F27" />
              </div>
              <h3 className="font-bold text-base mb-2" style={{ color: S.text }}>Business Plan প্রয়োজন</h3>
              <p className="text-sm mb-1" style={{ color: S.secondary }}>পাবলিক ক্যাটালগ — আপনার সব পণ্য একটি সুন্দর ecommerce পেজে দেখান।</p>
              <p className="text-xs mb-6" style={{ color: S.muted }}>এই ফিচারটি শুধুমাত্র Business plan এ পাওয়া যায়।</p>
              <Link
                href="/checkout?plan=business"
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold"
                style={{ backgroundColor: "#EF9F27", textDecoration: "none" }}
              >
                <Crown size={15} /> Business-এ Upgrade করুন
              </Link>
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-sm text-left">
                {["নিজস্ব URL (bizilcore.com/s/amar-shop)", "QR কোড শেয়ার করুন", "Facebook/WhatsApp এ লিঙ্ক দিন"].map((f) => (
                  <div key={f} className="flex items-start gap-2 p-3 rounded-xl" style={{ backgroundColor: S.bg }}>
                    <Check size={13} color="#EF9F27" className="mt-0.5 flex-shrink-0" />
                    <span className="text-xs" style={{ color: S.secondary }}>{f}</span>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return (
          <div className="space-y-5">
            {/* Link box */}
            {catalogSlug && (
              <div className="rounded-2xl p-5 space-y-3" style={{ backgroundColor: "var(--c-primary-light)", border: `1px solid var(--c-primary)` }}>
                <div className="flex items-center gap-2">
                  <Globe size={14} style={{ color: S.primary }} />
                  <p className="text-xs font-semibold" style={{ color: S.primary }}>আপনার ক্যাটালগ লিঙ্ক</p>
                </div>
                <div className="rounded-xl px-3 py-2.5 break-all font-mono text-sm font-bold" style={{ backgroundColor: "rgba(255,255,255,0.7)", color: S.primary }}>
                  {catalogUrl}
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => { navigator.clipboard.writeText(catalogUrl); setCatalogLinkCopied(true); setTimeout(() => setCatalogLinkCopied(false), 2000); }}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-medium border"
                    style={{ borderColor: S.primary, color: S.primary, backgroundColor: "white" }}>
                    {catalogLinkCopied ? <Check size={14} /> : <Copy size={14} />}
                    {catalogLinkCopied ? "Copied!" : "Copy করুন"}
                  </button>
                  <a href={catalogUrl} target="_blank" rel="noopener noreferrer"
                    className="w-full sm:w-auto flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-sm font-medium text-white"
                    style={{ backgroundColor: S.primary }}>
                    <ExternalLink size={14} />
                    দেখুন
                  </a>
                </div>
              </div>
            )}

            {/* QR Code */}
            {catalogSlug && catalogEnabled && (
              <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
                <div className="flex items-center gap-2 mb-4">
                  <QrCode size={15} style={{ color: S.primary }} />
                  <h4 className="font-semibold text-sm" style={{ color: S.text }}>QR কোড</h4>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt="QR Code" width={160} height={160} className="rounded-xl border" style={{ borderColor: S.border }} />
                  ) : (
                    <div className="w-[160px] h-[160px] rounded-xl border flex items-center justify-center" style={{ borderColor: S.border, backgroundColor: S.bg }}>
                      <span className="text-xs" style={{ color: S.secondary }}>তৈরি হচ্ছে...</span>
                    </div>
                  )}
                  <div className="space-y-2 text-center sm:text-left">
                    <p className="text-sm" style={{ color: S.secondary }}>এই QR কোডটি প্রিন্ট করে আপনার প্যাকেজিং বা পোস্টে ব্যবহার করুন।</p>
                    {qrDataUrl && (
                      <a href={qrDataUrl} download={`${catalogSlug}-qr.png`}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border"
                        style={{ borderColor: S.border, color: S.secondary }}>
                        QR Download করুন
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Settings form */}
            <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <div className="flex items-center gap-2 mb-4">
                <Globe size={15} style={{ color: S.primary }} />
                <h4 className="font-semibold text-sm" style={{ color: S.text }}>ক্যাটালগ সেটিংস</h4>
              </div>
              <form onSubmit={saveCatalog} className="space-y-4">
                <div>
                  <Toggle checked={catalogEnabled} onChange={setCatalogEnabled} label="ক্যাটালগ সক্রিয় (পাবলিক ভিজিবল)" />
                  <p className="text-xs mt-1.5 ml-1" style={{ color: S.muted }}>
                    {catalogEnabled
                      ? "✓ ক্যাটালগ চালু আছে — যে কেউ লিংক দিয়ে আপনার শপ দেখতে পারবে।"
                      : "ক্যাটালগ বন্ধ আছে — চালু করতে এখানে টগল করুন এবং সেভ করুন।"}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: S.text }}>Shop Slug (URL) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: S.muted }}>/s/</span>
                    <input
                      value={catalogSlug}
                      onChange={e => {
                        const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                        setCatalogSlug(v);
                        setSlugAvailable(null);
                        if (v.length >= 3) {
                          clearTimeout((window as typeof window & { _slugTimer?: ReturnType<typeof setTimeout> })._slugTimer);
                          (window as typeof window & { _slugTimer?: ReturnType<typeof setTimeout> })._slugTimer = setTimeout(() => checkSlugAvailability(v), 600);
                        }
                      }}
                      onBlur={() => { if (catalogSlug.length >= 3) checkSlugAvailability(catalogSlug); }}
                      placeholder="amar-shop"
                      style={{ ...inp(focused === "catslug"), paddingLeft: "32px" }}
                      onFocus={() => setFocused("catslug")}
                    />
                    {catalogSlug.length >= 3 && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2">
                        {checkingSlug ? <Loader2 size={13} className="animate-spin" style={{ color: S.muted }} /> :
                          slugAvailable === true ? <Check size={13} style={{ color: "#16A34A" }} /> :
                          slugAvailable === false ? <X size={13} style={{ color: "#DC2626" }} /> : null}
                      </span>
                    )}
                  </div>
                  {slugAvailable === false && <p className="text-xs mt-1" style={{ color: "#DC2626" }}>এই slug ইতিমধ্যে ব্যবহৃত হচ্ছে। অন্য একটি বেছে নিন।</p>}
                  {slugAvailable === true && <p className="text-xs mt-1" style={{ color: "#16A34A" }}>✓ এই slug পাওয়া যাচ্ছে</p>}
                  <p className="text-xs mt-1" style={{ color: S.muted }}>শুধুমাত্র ছোট হাতের a-z, 0-9 এবং dash (-) ব্যবহার করুন</p>
                </div>

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: S.text }}>Tagline / Bio</label>
                  <textarea
                    value={catalogTagline}
                    onChange={e => setCatalogTagline(e.target.value.slice(0, 200))}
                    placeholder="যেমন: সেরা মানের পোশাক, দ্রুত ডেলিভারি!"
                    rows={2}
                    maxLength={200}
                    className="w-full rounded-xl border text-sm p-3 outline-none resize-none"
                    style={{ borderColor: focused === "cattagline" ? S.primary : S.border, color: S.text, backgroundColor: S.surface }}
                    onFocus={() => setFocused("cattagline")}
                    onBlur={() => setFocused(null)}
                  />
                  <p className="text-xs text-right mt-0.5" style={{ color: S.muted }}>{catalogTagline.length}/200</p>
                </div>

                <Toggle checked={catalogShowInStockOnly} onChange={setCatalogShowInStockOnly} label="শুধুমাত্র স্টকে আছে এমন পণ্য দেখাও" />

                <button type="submit" disabled={savingCatalog || slugAvailable === false || (catalogSlug.length >= 3 && slugAvailable === null)}
                  className="w-full py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60"
                  style={{ backgroundColor: S.primary }}>
                  {savingCatalog ? "সেভ হচ্ছে..." : checkingSlug ? "Slug যাচাই হচ্ছে..." : "ক্যাটালগ সেটিংস সেভ করুন"}
                </button>
              </form>
            </div>
          </div>
        );
      })()}

      {/* ─── WHATSAPP ─────────────────────────── */}
      {tab === "whatsapp" && (
        <div className="space-y-5">
          {/* Status Banner */}
          <div className="rounded-2xl px-5 py-4 flex items-center gap-3" style={{ backgroundColor: waConnected ? "#DCFCE7" : "#FEF9C3", border: `1px solid ${waConnected ? "#BBF7D0" : "#FDE047"}` }}>
            <div className="text-xl">{waConnected ? "✅" : "⚠️"}</div>
            <div>
              <p className="font-semibold text-sm" style={{ color: waConnected ? "#15803D" : "#854D0E" }}>
                {waConnected ? "WhatsApp সংযুক্ত আছে — আপনি এখন message পাঠাতে পারবেন" : "WhatsApp সংযুক্ত নেই — নিচের গাইড দেখে সংযোগ করুন"}
              </p>
              {waConnected && waMaskedToken && <p className="text-xs mt-0.5 font-mono" style={{ color: "#16A34A" }}>Token: {waMaskedToken}</p>}
            </div>
          </div>

          {/* Section B: API Credentials */}
          <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <h4 className="font-semibold text-sm" style={{ color: S.text }}>API Credentials</h4>

            {!waConnected ? (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: S.secondary }}>API Token</label>
                  <div className="relative">
                    <input
                      type={showWaToken ? "text" : "password"}
                      value={waTokenInput}
                      onChange={e => setWaTokenInput(e.target.value)}
                      placeholder="EAAxxxxx..."
                      className="w-full pr-10 text-sm rounded-xl border outline-none px-3"
                      style={{ height: "42px", borderColor: S.border, color: S.text, backgroundColor: S.bg }}
                    />
                    <button onClick={() => setShowWaToken(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: S.muted }}>
                      {showWaToken ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: S.secondary }}>Phone Number ID</label>
                  <input
                    type="text"
                    value={waPhoneInput}
                    onChange={e => setWaPhoneInput(e.target.value)}
                    placeholder="123456789012345"
                    className="w-full text-sm rounded-xl border outline-none px-3"
                    style={{ height: "42px", borderColor: S.border, color: S.text, backgroundColor: S.bg }}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: S.secondary }}>Business Account ID (optional)</label>
                  <input
                    type="text"
                    value={waBusinessInput}
                    onChange={e => setWaBusinessInput(e.target.value)}
                    placeholder="Business Account ID"
                    className="w-full text-sm rounded-xl border outline-none px-3"
                    style={{ height: "42px", borderColor: S.border, color: S.text, backgroundColor: S.bg }}
                  />
                </div>
                <button
                  onClick={connectWA}
                  disabled={connectingWA || !waTokenInput.trim() || !waPhoneInput.trim()}
                  className="w-full py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ backgroundColor: "#25D366" }}>
                  {connectingWA ? <><Loader2 size={14} className="animate-spin" /> যাচাই হচ্ছে...</> : <><Wifi size={14} /> সংযোগ যাচাই করুন ও সংরক্ষণ করুন</>}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: S.bg }}>
                  <div>
                    <p className="text-xs" style={{ color: S.muted }}>Phone Number ID</p>
                    <p className="text-sm font-medium font-mono" style={{ color: S.text }}>{waPhoneNumberId || "—"}</p>
                  </div>
                </div>
                <button
                  onClick={disconnectWA}
                  disabled={disconnectingWA}
                  className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border disabled:opacity-50"
                  style={{ borderColor: "#FCA5A5", color: "#DC2626", backgroundColor: "#FEF2F2" }}>
                  {disconnectingWA ? <Loader2 size={13} className="animate-spin" /> : <Unlink size={13} />}
                  সংযোগ বিচ্ছিন্ন করুন
                </button>
              </div>
            )}
          </div>

          {/* Section C: Step-by-step guide */}
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <button
              onClick={() => setWaGuideOpen(p => !p)}
              className="w-full flex items-center justify-between px-5 py-4"
              style={{ borderBottom: waGuideOpen ? `1px solid ${S.border}` : "none" }}>
              <div className="flex items-center gap-2">
                <BookOpen size={15} style={{ color: S.primary }} />
                <span className="font-semibold text-sm" style={{ color: S.text }}>কিভাবে WhatsApp API সেটআপ করবেন</span>
              </div>
              <ChevronRight size={14} className={`transition-transform ${waGuideOpen ? "rotate-90" : ""}`} style={{ color: S.muted }} />
            </button>
            {waGuideOpen && (
              <div className="p-5 space-y-4">
                {[
                  { step: "ধাপ ১", title: "Meta Developer Account খুলুন", desc: "developers.facebook.com এ যান এবং Get Started বা Login করুন", link: "https://developers.facebook.com", linkText: "Meta Developer Console খুলুন →" },
                  { step: "ধাপ ২", title: "নতুন App তৈরি করুন", desc: 'My Apps → Create App click করুন। App Type: "Business" সিলেক্ট করুন। App Name যেকোনো নাম দিন (যেমন: MyShop) এবং Create App চাপুন।' },
                  { step: "ধাপ ৩", title: "WhatsApp যোগ করুন", desc: 'App Dashboard এ "Add Product" এ যান → WhatsApp খুঁজে "Set up" click করুন → আপনার Facebook Business Page সিলেক্ট করুন।' },
                  { step: "ধাপ ৪", title: "API Credentials সংগ্রহ করুন", desc: 'WhatsApp → API Setup এ যান → "Temporary access token" কপি করুন (এটাই API Token) → "Phone number ID" কপি করুন → উপরে দেওয়া form এ paste করুন।' },
                  { step: "ধাপ ৫", title: "Permanent Token বানান (Important!)", desc: 'Temporary token মাত্র ২৪ ঘণ্টা কাজ করে। business.facebook.com → System Users → Add → Admin System User তৈরি করুন → Generate Token → WhatsApp permission দিন। এই token টা permanent থাকবে।' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: S.primary }}>
                      {i + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold mb-0.5" style={{ color: S.muted }}>{item.step}</p>
                      <p className="text-sm font-semibold mb-1" style={{ color: S.text }}>{item.title}</p>
                      <p className="text-xs leading-relaxed" style={{ color: S.secondary }}>{item.desc}</p>
                      {item.link && (
                        <a href={item.link} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-xs font-medium px-3 py-1.5 rounded-lg text-white"
                          style={{ backgroundColor: "#1877F2" }}>
                          {item.linkText}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
                <div className="rounded-xl p-4 mt-2" style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}>
                  <p className="text-xs" style={{ color: "#1E40AF" }}>
                    💡 Free Plan এ প্রতি মাসে ১০০০টি conversation বিনামূল্যে। এর বেশি হলে Meta এর pricing অনুযায়ী charge হবে।
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Section D: Test message (connected only) */}
          {waConnected && (
            <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <h4 className="font-semibold text-sm" style={{ color: S.text }}>টেস্ট Message পাঠান</h4>
              <input
                type="tel"
                value={waTestPhone}
                onChange={e => setWaTestPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full text-sm rounded-xl border outline-none px-3"
                style={{ height: "42px", borderColor: S.border, color: S.text, backgroundColor: S.bg }}
              />
              <button
                onClick={testWA}
                disabled={testingWA || !waTestPhone.trim()}
                className="flex items-center gap-2 text-sm px-4 py-2.5 rounded-xl text-white font-medium disabled:opacity-50"
                style={{ backgroundColor: "#25D366" }}>
                {testingWA ? <><Loader2 size={13} className="animate-spin" /> পাঠানো হচ্ছে...</> : <><Send size={13} /> টেস্ট Message পাঠান</>}
              </button>
            </div>
          )}
        </div>
      )}

      {/* AI সেটিংস Tab */}
      {tab === "ai" && (
        <div className="flex-1 space-y-4">
          <AiUsagePanel plan={plan} />
        </div>
      )}

      {/* অর্ডার স্লিপ Tab */}
      {tab === "slip" && <SlipSettingsPanel />}

      {/* কুরিয়ার Tab */}
      {tab === "courier" && (
        <div className="space-y-6">
          <PathaoSettingsPanel />
          <SteadfastSettingsPanel />
          <RedxSettingsPanel />
          <EcourierSettingsPanel />
        </div>
      )}

      {/* Blacklist Tab */}
      {tab === "blacklist" && (
        <div className="space-y-5">
          <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ backgroundColor: "#FEE2E2" }}>
                <ShieldX size={18} style={{ color: "#DC2626" }} />
              </div>
              <div>
                <h3 className="font-bold text-sm" style={{ color: S.text }}>ফোন নম্বর ব্ল্যাকলিস্ট</h3>
                <p className="text-xs" style={{ color: S.muted }}>ব্লক করা নম্বর থেকে অর্ডার নেওয়া হবে না</p>
              </div>
            </div>

            <form onSubmit={addToBlacklist} className="flex gap-2 flex-wrap mb-5">
              <input
                type="text"
                value={blPhone}
                onChange={e => setBlPhone(e.target.value)}
                placeholder="ফোন নম্বর (যেমন: 01712345678)"
                style={{ ...inp(focused === "blPhone"), flex: "1 1 180px", minWidth: 0 }}
                onFocus={() => setFocused("blPhone")}
                onBlur={() => setFocused(null)}
              />
              <input
                type="text"
                value={blReason}
                onChange={e => setBlReason(e.target.value)}
                placeholder="কারণ (ঐচ্ছিক)"
                style={{ ...inp(focused === "blReason"), flex: "1 1 180px", minWidth: 0 }}
                onFocus={() => setFocused("blReason")}
                onBlur={() => setFocused(null)}
              />
              <button
                type="submit"
                disabled={addingBl}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold disabled:opacity-60 flex-shrink-0"
                style={{ backgroundColor: "#DC2626", height: "40px" }}>
                {addingBl ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                যোগ করুন
              </button>
            </form>

            {blacklistLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 size={24} className="animate-spin" style={{ color: S.muted }} />
              </div>
            ) : blacklist.length === 0 ? (
              <div className="text-center py-10 rounded-xl" style={{ backgroundColor: S.bg }}>
                <ShieldCheck size={32} className="mx-auto mb-2" style={{ color: S.muted }} />
                <p className="text-sm font-medium" style={{ color: S.muted }}>ব্ল্যাকলিস্ট ফাঁকা</p>
                <p className="text-xs mt-1" style={{ color: S.muted }}>উপরে ফোন নম্বর দিয়ে ব্লক করুন</p>
              </div>
            ) : (
              <div className="space-y-2">
                {blacklist.map(entry => (
                  <div key={entry.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border" style={{ borderColor: S.border, backgroundColor: S.bg }}>
                    <ShieldX size={16} style={{ color: "#DC2626", flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold font-mono" style={{ color: S.text }}>{entry.phone}</p>
                      {entry.reason && <p className="text-xs truncate" style={{ color: S.muted }}>{entry.reason}</p>}
                    </div>
                    <p className="text-[10px] flex-shrink-0" style={{ color: S.muted }}>
                      {new Date(entry.createdAt).toLocaleDateString("bn-BD")}
                    </p>
                    <button
                      onClick={() => removeFromBlacklist(entry.id)}
                      disabled={deletingBlId === entry.id}
                      className="p-1.5 rounded-lg hover:bg-red-50 disabled:opacity-60 transition-colors flex-shrink-0"
                      title="ব্ল্যাকলিস্ট থেকে সরান">
                      {deletingBlId === entry.id ? <Loader2 size={14} className="animate-spin" style={{ color: "#DC2626" }} /> : <Trash2 size={14} style={{ color: "#DC2626" }} />}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl p-5 border" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <h3 className="font-bold text-sm mb-3" style={{ color: S.text }}>ফেক অর্ডার ডিটেকশন কীভাবে কাজ করে?</h3>
            <div className="space-y-2.5">
              {[
                { icon: "🔴", text: "ব্ল্যাকলিস্টের নম্বর থেকে অর্ডার আসলে সরাসরি ব্লক" },
                { icon: "🌐", text: "৩টি বা বেশি শপে ফেক রিপোর্ট থাকলে স্বয়ংক্রিয় ব্লক" },
                { icon: "⚡", text: "২৪ ঘণ্টায় ৩+ অর্ডার হলে 'উচ্চ-ঝুঁকি' চিহ্নিত" },
                { icon: "📵", text: "অবৈধ বাংলাদেশি ফোন ফরম্যাট ধরা পড়ে" },
                { icon: "🕵️", text: "সন্দেহজনক নাম ও ঠিকানা বিশ্লেষণ" },
              ].map(item => (
                <div key={item.text} className="flex items-start gap-3">
                  <span className="text-lg flex-shrink-0">{item.icon}</span>
                  <p className="text-sm" style={{ color: S.secondary }}>{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Referral Tab */}
      {tab === "referral" && <ReferralPanel />}

        </div>
      </div>
    </div>
  );
}

/* ─── AI Usage Panel Component ──────────────────────── */
function AiUsagePanel({ plan }: { plan: string }) {
  const [stats, setStats] = useState<{ used: number; limit: number; remaining: number; plan: string } | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadStats() {
    setLoading(true);
    try {
      const r = await fetch("/api/ai/usage");
      if (r.ok) setStats(await r.json());
    } catch {}
    setLoading(false);
  }

  useEffect(() => { loadStats(); }, []);

  const pct = stats ? Math.min(100, Math.round((stats.used / stats.limit) * 100)) : 0;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border p-6 space-y-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(15,110,86,0.1)" }}>
              <Sparkles size={18} style={{ color: S.primary }} />
            </div>
            <div>
              <h3 className="font-semibold" style={{ color: S.text }}>AI ব্যবহার</h3>
              <p className="text-xs" style={{ color: S.muted }}>আজকের AI ব্যবহারের অবস্থা</p>
            </div>
          </div>
          <button onClick={loadStats} disabled={loading}
            className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
            style={{ color: S.secondary }}>
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        {loading && !stats && (
          <div className="text-center py-4">
            <Loader2 size={24} className="animate-spin mx-auto" style={{ color: S.primary }} />
          </div>
        )}

        {stats && (
          <>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm" style={{ color: S.secondary }}>ব্যবহার ({stats.used}/{stats.limit})</span>
                <span className="text-sm font-semibold" style={{ color: pct >= 90 ? "#E24B4A" : pct >= 70 ? "#EF9F27" : S.primary }}>{pct}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--c-border)" }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, backgroundColor: pct >= 90 ? "#E24B4A" : pct >= 70 ? "#EF9F27" : S.primary }} />
              </div>
              <p className="text-xs mt-1.5" style={{ color: S.muted }}>
                {stats.remaining > 0 ? `আজ আর ${stats.remaining}টি AI request ব্যবহার করতে পারবেন।` : "আজকের সীমা শেষ হয়েছে। আগামীকাল রিসেট হবে।"}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "ব্যবহার হয়েছে", value: stats.used },
                { label: "বাকি আছে", value: stats.remaining },
                { label: "দৈনিক সীমা", value: stats.limit === 999999 ? "∞" : stats.limit },
              ].map(item => (
                <div key={item.label} className="text-center p-3 rounded-xl" style={{ backgroundColor: "var(--c-bg)", border: `1px solid ${S.border}` }}>
                  <p className="text-xl font-bold" style={{ color: S.text }}>{item.value}</p>
                  <p className="text-xs mt-0.5" style={{ color: S.muted }}>{item.label}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="rounded-2xl border p-6 space-y-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <h3 className="font-semibold text-sm" style={{ color: S.text }}>AI Features</h3>
        {[
          { icon: "✍️", label: "পণ্যের বিবরণ", desc: "পণ্যের নাম থেকে স্বয়ংক্রিয় বাংলা বিবরণ তৈরি" },
          { icon: "💰", label: "মূল্য সাজেশন", desc: "ক্রয় মূল্য ও ক্যাটাগরি দেখে সঠিক বিক্রয় মূল্য suggest" },
          { icon: "📦", label: "স্টক পূর্বাভাস", desc: "কোন পণ্য কতদিনে শেষ হবে তা predict করে" },
          { icon: "📊", label: "বিক্রয় বিশ্লেষণ", desc: "মাসিক বিক্রয় ডেটা থেকে insight ও পরামর্শ" },
        ].map(f => (
          <div key={f.label} className="flex items-start gap-3 py-2 border-b last:border-0" style={{ borderColor: S.border }}>
            <span className="text-xl flex-shrink-0">{f.icon}</span>
            <div>
              <p className="text-sm font-medium" style={{ color: S.text }}>{f.label}</p>
              <p className="text-xs mt-0.5" style={{ color: S.muted }}>{f.desc}</p>
            </div>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full flex-shrink-0"
              style={{ background: "rgba(15,110,86,0.1)", color: S.primary }}>সক্রিয়</span>
          </div>
        ))}
      </div>

      {plan === "free" && (
        <div className="rounded-2xl p-5 text-center" style={{ background: "rgba(15,110,86,0.06)", border: "1px solid rgba(15,110,86,0.2)" }}>
          <p className="font-semibold mb-1" style={{ color: S.primary }}>Pro তে আপগ্রেড করুন</p>
          <p className="text-sm mb-3" style={{ color: S.secondary }}>দৈনিক ১০টির বদলে ১০০টি AI request পাবেন।</p>
          <Link href="/settings?tab=subscription"
            className="inline-block px-4 py-2 rounded-xl text-white text-sm font-medium"
            style={{ backgroundColor: S.primary }}>
            Plan আপগ্রেড →
          </Link>
        </div>
      )}
    </div>
  );
}

/* ─── Slip Settings Panel Component ─────────────────── */
const SLIP_COLOR_PRESETS = [
  { label: "BizilCore", primary: "#0d2d1a", accent: "#00e676" },
  { label: "Navy", primary: "#1e3a5f", accent: "#38bdf8" },
  { label: "Purple", primary: "#3b1a6b", accent: "#c084fc" },
  { label: "Royal", primary: "#7c2d12", accent: "#fb923c" },
  { label: "Black Gold", primary: "#1a1a18", accent: "#d97706" },
  { label: "Teal", primary: "#0f4c51", accent: "#2dd4bf" },
];

const SLIP_TEMPLATES = [
  { key: "classic",  name: "Classic",  desc: "রঙিন হেডার, সম্পূর্ণ" },
  { key: "modern",   name: "Modern",   desc: "কার্ড ডিজাইন, দুই কলাম" },
  { key: "minimal",  name: "Minimal",  desc: "পরিষ্কার, কম রঙ" },
  { key: "thermal",  name: "Thermal",  desc: "রিসিট স্টাইল" },
  { key: "bold",     name: "Bold",     desc: "বড় COD বক্স, জোরালো" },
  { key: "elegant",  name: "Elegant",  desc: "প্রিমিয়াম লুক, পাশের বার" },
];

function SlipSettingsPanel() {
  const { plan: userPlan } = useSubscription();
  const canHideBrand = userPlan === "business";
  const [form, setForm] = useState({
    slipTemplate: "classic",
    slipPrimaryColor: "#0d2d1a",
    slipAccentColor: "#00e676",
    slipShowBarcode: true,
    slipShowQR: true,
    slipShowSocialMedia: true,
    slipShowProductPhotos: true,
    slipHideBrandBadge: false,
    slipCustomMessage: "ধন্যবাদ আপনার কেনাকাটার জন্য! পণ্য পেয়ে সমস্যা হলে আমাদের সাথে যোগাযোগ করুন। 🙏",
    slipFacebookPage: "",
    slipWhatsapp: "",
  });
  const [customPresets, setCustomPresets] = useState<{ name: string; primary: string; accent: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [showPresetInput, setShowPresetInput] = useState(false);
  const [savingPreset, setSavingPreset] = useState(false);

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(d => {
      const shop = d?.shop;
      if (shop) {
        setForm(f => ({
          ...f,
          slipTemplate:        shop.slipTemplate        ?? f.slipTemplate,
          slipPrimaryColor:    shop.slipPrimaryColor    ?? f.slipPrimaryColor,
          slipAccentColor:     shop.slipAccentColor     ?? f.slipAccentColor,
          slipShowBarcode:      shop.slipShowBarcode      ?? f.slipShowBarcode,
          slipShowQR:           shop.slipShowQR           ?? f.slipShowQR,
          slipShowSocialMedia:  shop.slipShowSocialMedia  ?? f.slipShowSocialMedia,
          slipShowProductPhotos: shop.slipShowProductPhotos ?? f.slipShowProductPhotos,
          slipHideBrandBadge:    shop.slipHideBrandBadge   ?? f.slipHideBrandBadge,
          slipCustomMessage:    shop.slipCustomMessage    ?? f.slipCustomMessage,
          slipFacebookPage:    shop.slipFacebookPage    ?? f.slipFacebookPage,
          slipWhatsapp:        shop.slipWhatsapp        ?? f.slipWhatsapp,
        }));
        if (Array.isArray(shop.slipColorPresets)) setCustomPresets(shop.slipColorPresets);
      }
    }).finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true);
    await fetch("/api/settings/slip", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, slipColorPresets: customPresets }),
    });
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2500);
  }

  async function persistPresets(presets: typeof customPresets) {
    await fetch("/api/settings/slip", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slipColorPresets: presets }),
    });
  }

  async function addPreset() {
    if (!presetName.trim()) return;
    setSavingPreset(true);
    const np = { name: presetName.trim(), primary: form.slipPrimaryColor, accent: form.slipAccentColor };
    const updated = [...customPresets, np];
    setCustomPresets(updated);
    setPresetName(""); setShowPresetInput(false);
    try { await persistPresets(updated); } catch {}
    setSavingPreset(false);
  }

  async function deletePreset(i: number) {
    const updated = customPresets.filter((_, idx) => idx !== i);
    setCustomPresets(updated);
    try { await persistPresets(updated); } catch {}
  }

  if (loading) return <div className="flex-1 flex items-center justify-center"><Loader2 size={22} className="animate-spin" style={{ color: S.primary }} /></div>;

  const primary = form.slipPrimaryColor;

  return (
    <div className="flex-1 space-y-5">

      {/* Template picker */}
      <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="mb-4">
          <h3 className="font-semibold text-sm" style={{ color: S.text }}>ডিফল্ট টেমপ্লেট</h3>
          <p className="text-xs mt-0.5" style={{ color: S.muted }}>প্রতিটি স্লিপে এই ডিজাইন ডিফল্ট হিসেবে থাকবে</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {SLIP_TEMPLATES.map(t => {
            const active = form.slipTemplate === t.key;
            return (
              <button key={t.key}
                onClick={() => setForm(f => ({ ...f, slipTemplate: t.key }))}
                className="text-left rounded-xl border-2 p-3 transition-all"
                style={{ borderColor: active ? primary : S.border, backgroundColor: active ? `${primary}08` : S.surface }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold" style={{ color: active ? primary : S.text }}>{t.name}</span>
                  {active && <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ backgroundColor: primary }}>
                    <Check size={9} className="text-white" />
                  </div>}
                </div>
                <p className="text-xs" style={{ color: S.muted }}>{t.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color presets */}
      <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div>
          <h3 className="font-semibold text-sm" style={{ color: S.text }}>রং</h3>
          <p className="text-xs mt-0.5" style={{ color: S.muted }}>প্রতিটি অর্ডার স্লিপে এই রং ব্যবহার হবে</p>
        </div>

        {/* Built-in presets */}
        <div>
          <p className="text-xs font-medium mb-2" style={{ color: S.muted }}>Built-in প্রিসেট</p>
          <div className="flex gap-2 flex-wrap">
            {SLIP_COLOR_PRESETS.map(p => (
              <button key={p.label}
                onClick={() => setForm(f => ({ ...f, slipPrimaryColor: p.primary, slipAccentColor: p.accent }))}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium"
                style={{ borderColor: form.slipPrimaryColor === p.primary && form.slipAccentColor === p.accent ? p.primary : S.border, backgroundColor: form.slipPrimaryColor === p.primary && form.slipAccentColor === p.accent ? `${p.primary}10` : S.surface, color: S.text }}>
                <span style={{ display: "flex", gap: 2 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: p.primary, display: "inline-block" }} />
                  <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: p.accent, display: "inline-block" }} />
                </span>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom presets */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium" style={{ color: S.muted }}>আমার প্রিসেট</p>
            {!showPresetInput && (
              <button onClick={() => setShowPresetInput(true)}
                className="text-xs px-2.5 py-1 rounded-lg border font-medium"
                style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}>
                + যোগ করুন
              </button>
            )}
          </div>
          {showPresetInput && (
            <div className="flex gap-2 mb-2 p-3 rounded-xl border" style={{ borderColor: primary, backgroundColor: `${primary}06` }}>
              <div className="flex items-center gap-1 flex-shrink-0">
                <span style={{ width: 13, height: 13, borderRadius: "50%", backgroundColor: form.slipPrimaryColor, display: "inline-block", border: "1px solid #eee" }} />
                <span style={{ width: 13, height: 13, borderRadius: "50%", backgroundColor: form.slipAccentColor, display: "inline-block", border: "1px solid #eee" }} />
              </div>
              <input type="text" value={presetName} onChange={e => setPresetName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addPreset(); if (e.key === "Escape") { setShowPresetInput(false); setPresetName(""); } }}
                placeholder="প্রিসেটের নাম..." autoFocus
                className="flex-1 text-xs outline-none bg-transparent" style={{ color: S.text }} />
              <button onClick={addPreset} disabled={!presetName.trim() || savingPreset}
                className="text-xs px-2.5 py-1 rounded-lg text-white font-medium disabled:opacity-50"
                style={{ backgroundColor: primary }}>
                {savingPreset ? "..." : "সেভ"}
              </button>
              <button onClick={() => { setShowPresetInput(false); setPresetName(""); }}
                className="text-xs px-2 py-1 rounded-lg" style={{ color: S.muted }}>✕</button>
            </div>
          )}
          {customPresets.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {customPresets.map((p, i) => (
                <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium"
                  style={{ borderColor: form.slipPrimaryColor === p.primary && form.slipAccentColor === p.accent ? p.primary : S.border, backgroundColor: form.slipPrimaryColor === p.primary && form.slipAccentColor === p.accent ? `${p.primary}10` : S.surface }}>
                  <button onClick={() => setForm(f => ({ ...f, slipPrimaryColor: p.primary, slipAccentColor: p.accent }))} className="flex items-center gap-1.5">
                    <span style={{ display: "flex", gap: 2 }}>
                      <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: p.primary, display: "inline-block" }} />
                      <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: p.accent, display: "inline-block" }} />
                    </span>
                    <span style={{ color: S.text }}>{p.name}</span>
                  </button>
                  <button onClick={() => deletePreset(i)} className="ml-1 opacity-40 hover:opacity-80" style={{ color: S.muted }}>✕</button>
                </div>
              ))}
            </div>
          ) : !showPresetInput && (
            <p className="text-xs" style={{ color: S.muted }}>এখনো কোনো কাস্টম প্রিসেট নেই।</p>
          )}
        </div>

        {/* Custom color pickers */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: S.muted }}>Primary Color</label>
            <div className="flex gap-2">
              <input type="color" value={form.slipPrimaryColor} onChange={e => setForm(f => ({ ...f, slipPrimaryColor: e.target.value }))}
                className="h-10 w-12 rounded-lg border cursor-pointer" style={{ borderColor: S.border }} />
              <input type="text" value={form.slipPrimaryColor} onChange={e => setForm(f => ({ ...f, slipPrimaryColor: e.target.value }))}
                className="flex-1 h-10 px-2 rounded-xl border text-xs font-mono outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: S.muted }}>Accent Color</label>
            <div className="flex gap-2">
              <input type="color" value={form.slipAccentColor} onChange={e => setForm(f => ({ ...f, slipAccentColor: e.target.value }))}
                className="h-10 w-12 rounded-lg border cursor-pointer" style={{ borderColor: S.border }} />
              <input type="text" value={form.slipAccentColor} onChange={e => setForm(f => ({ ...f, slipAccentColor: e.target.value }))}
                className="flex-1 h-10 px-2 rounded-xl border text-xs font-mono outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
            </div>
          </div>
        </div>
      </div>

      {/* Toggles */}
      <div className="rounded-2xl border p-5 space-y-1" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <h3 className="font-semibold text-sm mb-3" style={{ color: S.text }}>স্লিপে কী দেখাবে</h3>
        {[
          { key: "slipShowQR" as const, label: "QR Code" },
          { key: "slipShowBarcode" as const, label: "Barcode" },
          { key: "slipShowSocialMedia" as const, label: "Social media links" },
          { key: "slipShowProductPhotos" as const, label: "পণ্যের ছবি (Product photos)" },
        ].map(item => (
          <label key={item.key} className="flex items-center justify-between py-2.5 cursor-pointer border-b last:border-0" style={{ borderColor: S.border }}>
            <span className="text-sm" style={{ color: S.text }}>{item.label}</span>
            <div className="w-10 h-5 rounded-full flex items-center px-0.5 transition-colors flex-shrink-0"
              style={{ backgroundColor: form[item.key] ? S.primary : S.border }}
              onClick={() => setForm(f => ({ ...f, [item.key]: !f[item.key] }))}>
              <div className="w-4 h-4 rounded-full bg-white shadow transition-transform"
                style={{ transform: form[item.key] ? "translateX(20px)" : "translateX(0)" }} />
            </div>
          </label>
        ))}
        {/* Brand badge toggle */}
        <div className="flex items-center justify-between py-2.5 border-t" style={{ borderColor: S.border }}>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: canHideBrand ? S.text : S.muted }}>"Powered by BizilCore" লুকান</span>
              {!canHideBrand && (
                <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: "#FFF3DC", color: "#92600A" }}>
                  👑 Business
                </span>
              )}
            </div>
            {!canHideBrand && <p className="text-xs mt-0.5" style={{ color: S.muted }}>Business plan এ এটি বন্ধ করা যাবে।</p>}
          </div>
          <div className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors flex-shrink-0 ${!canHideBrand ? "opacity-40 cursor-not-allowed" : "cursor-pointer"}`}
            style={{ backgroundColor: canHideBrand && form.slipHideBrandBadge ? S.primary : S.border }}
            onClick={() => canHideBrand && setForm(f => ({ ...f, slipHideBrandBadge: !f.slipHideBrandBadge }))}>
            <div className="w-4 h-4 rounded-full bg-white shadow transition-transform"
              style={{ transform: canHideBrand && form.slipHideBrandBadge ? "translateX(20px)" : "translateX(0)" }} />
          </div>
        </div>
      </div>

      {/* Custom message */}
      <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <h3 className="font-semibold text-sm" style={{ color: S.text }}>ধন্যবাদ বার্তা</h3>
        <textarea rows={3} value={form.slipCustomMessage}
          onChange={e => setForm(f => ({ ...f, slipCustomMessage: e.target.value }))}
          placeholder="স্লিপের নিচে দেখাবে..."
          className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
          style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
      </div>

      {/* Social media */}
      <div className="rounded-2xl border p-5 space-y-3" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <h3 className="font-semibold text-sm" style={{ color: S.text }}>সোশ্যাল মিডিয়া</h3>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: S.muted }}>Facebook Page URL</label>
          <input type="text" value={form.slipFacebookPage} onChange={e => setForm(f => ({ ...f, slipFacebookPage: e.target.value }))}
            placeholder="facebook.com/yourpage"
            className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
            style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: S.muted }}>WhatsApp নম্বর</label>
          <input type="text" value={form.slipWhatsapp} onChange={e => setForm(f => ({ ...f, slipWhatsapp: e.target.value }))}
            placeholder="01XXXXXXXXX"
            className="w-full h-10 px-3 rounded-xl border text-sm outline-none"
            style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={save} disabled={saving}
          className="flex-1 py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
          style={{ backgroundColor: S.primary }}>
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : null}
          {saving ? "সেভ হচ্ছে..." : saved ? "সেভ হয়েছে ✓" : "সেভ করুন"}
        </button>
        <Link href="/orders" className="px-4 py-3 rounded-xl border text-sm font-medium"
          style={{ borderColor: S.border, color: S.secondary }}>
          অর্ডার দেখুন
        </Link>
      </div>
    </div>
  );
}

/* ─── Pathao Settings Panel ──────────────────────────── */
function PathaoSettingsPanel() {
  const [status, setStatus] = useState<{ isConnected: boolean; connectedAt: string | null; clientId: string | null; storeId: string | null; sandboxMode: boolean; hasCredentials: boolean } | null>(null);
  const [form, setForm] = useState({ clientId: "", clientSecret: "", username: "", password: "", storeId: "", sandboxMode: false });
  const [showForm, setShowForm] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  async function load() {
    const res = await fetch("/api/settings/pathao");
    if (res.ok) setStatus(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function handleTest() {
    if (!form.clientId || !form.clientSecret || !form.username || !form.password || !form.storeId) {
      showToast("error", "সব ঘর পূরণ করুন");
      return;
    }
    setTesting(true);
    const res = await fetch("/api/settings/pathao/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setTesting(false);
    if (res.ok) showToast("success", data.message ?? "সংযোগ সফল!");
    else showToast("error", data.error ?? "সংযোগ ব্যর্থ");
  }

  async function handleSave() {
    if (!form.clientId || !form.clientSecret || !form.username || !form.password || !form.storeId) {
      showToast("error", "সব ঘর পূরণ করুন");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/settings/pathao", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (res.ok) {
      showToast("success", "Pathao সফলভাবে সংযুক্ত হয়েছে!");
      setShowForm(false);
      setForm({ clientId: "", clientSecret: "", username: "", password: "", storeId: "", sandboxMode: false });
      load();
    } else {
      showToast("error", data.error ?? "সেভ ব্যর্থ");
    }
  }

  async function handleDisconnect() {
    if (!confirm("Pathao সংযোগ বিচ্ছিন্ন করবেন?")) return;
    const res = await fetch("/api/settings/pathao", { method: "DELETE" });
    if (res.ok) {
      showToast("success", "Pathao সংযোগ বিচ্ছিন্ন করা হয়েছে");
      load();
    }
  }

  const inp2 = (f: boolean) => ({ height: "42px", border: `1px solid ${f ? S.primary : S.border}`, borderRadius: "10px", color: S.text, backgroundColor: S.surface, padding: "0 12px", fontSize: "14px", outline: "none", width: "100%" });

  return (
    <div className="space-y-5">
      {toast && <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg" style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>{toast.msg}</div>}

      {/* Info Card */}
      <div className="rounded-2xl p-5" style={{ background: "rgba(15,110,86,0.06)", border: "1px solid rgba(15,110,86,0.18)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: "var(--c-primary-light)" }}>
            <Truck size={18} style={{ color: S.primary }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: S.text }}>Pathao Courier Integration</p>
            <p className="text-xs" style={{ color: S.muted }}>আপনার নিজস্ব Pathao merchant account দিয়ে অর্ডার book করুন</p>
          </div>
        </div>
        <div className="space-y-1.5">
          {[
            "অর্ডার থেকে সরাসরি Pathao-তে booking",
            "Automatic tracking ID সংরক্ষণ",
            "Real-time courier status update",
          ].map(f => (
            <div key={f} className="flex items-center gap-2">
              <Check size={13} style={{ color: S.primary }} />
              <span className="text-xs" style={{ color: S.secondary }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Connection Status */}
      <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: status?.isConnected ? "#1D9E75" : S.border }} />
            <div>
              <p className="font-semibold text-sm" style={{ color: S.text }}>
                {status === null ? "লোড হচ্ছে..." : status.isConnected ? "Pathao সংযুক্ত আছে" : "Pathao সংযুক্ত নেই"}
              </p>
              {status?.isConnected && status.connectedAt && (
                <p className="text-xs mt-0.5" style={{ color: S.muted }}>
                  সংযুক্ত হয়েছে {new Date(status.connectedAt).toLocaleDateString("bn-BD")}
                </p>
              )}
              {status?.isConnected && status.clientId && (
                <p className="text-xs font-mono mt-0.5" style={{ color: S.muted }}>Client ID: {status.clientId}</p>
              )}
              {status?.isConnected && status.storeId && (
                <p className="text-xs font-mono mt-0.5" style={{ color: S.muted }}>Store ID: {status.storeId}</p>
              )}
              {status?.isConnected && (
                <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: status.sandboxMode ? "#FFF3DC" : "#E8F5F0", color: status.sandboxMode ? "#EF9F27" : "#0F6E56" }}>
                  {status.sandboxMode ? "Sandbox Mode" : "Production"}
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {status?.isConnected ? (
              <>
                <button onClick={() => { setShowForm(true); }} className="px-3 py-1.5 rounded-xl border text-xs font-medium" style={{ borderColor: S.border, color: S.secondary }}>
                  পরিবর্তন করুন
                </button>
                <button onClick={handleDisconnect} className="px-3 py-1.5 rounded-xl text-xs font-medium" style={{ backgroundColor: "var(--bg-danger-soft)", color: "var(--bg-danger-text)" }}>
                  Disconnect
                </button>
              </>
            ) : (
              <button onClick={() => setShowForm(true)} className="px-4 py-2 rounded-xl text-white text-sm font-medium" style={{ backgroundColor: S.primary }}>
                + সংযুক্ত করুন
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Credentials Form */}
      {showForm && (
        <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm" style={{ color: S.text }}>Pathao API Credentials</h4>
            <button onClick={() => setShowForm(false)}><X size={16} style={{ color: S.muted }} /></button>
          </div>

          <div className="rounded-xl p-3 text-xs space-y-1" style={{ backgroundColor: "var(--c-bg)", border: `1px solid ${S.border}` }}>
            <p style={{ color: S.secondary }}>Pathao Merchant Dashboard থেকে এই তথ্য পাবেন:</p>
            <p style={{ color: S.muted }}>🔗 <strong>hermes.pathao.com</strong> → Developer Settings → API Credentials</p>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: S.text }}>Client ID *</label>
              <input value={form.clientId} onChange={e => setForm(p => ({ ...p, clientId: e.target.value }))}
                placeholder="your-client-id"
                style={inp2(focused === "clientId")} onFocus={() => setFocused("clientId")} onBlur={() => setFocused(null)} />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: S.text }}>Client Secret *</label>
              <div className="relative">
                <input type={showSecret ? "text" : "password"} value={form.clientSecret} onChange={e => setForm(p => ({ ...p, clientSecret: e.target.value }))}
                  placeholder="your-client-secret"
                  style={{ ...inp2(focused === "clientSecret"), paddingRight: "40px" }} onFocus={() => setFocused("clientSecret")} onBlur={() => setFocused(null)} />
                <button type="button" onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showSecret ? <EyeOff size={14} style={{ color: S.muted }} /> : <Eye size={14} style={{ color: S.muted }} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: S.text }}>Username (Email) *</label>
                <input type="email" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                  placeholder="merchant@email.com"
                  style={inp2(focused === "username")} onFocus={() => setFocused("username")} onBlur={() => setFocused(null)} />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: S.text }}>Password *</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"} value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="••••••••"
                    style={{ ...inp2(focused === "password"), paddingRight: "40px" }} onFocus={() => setFocused("password")} onBlur={() => setFocused(null)} />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2">
                    {showPass ? <EyeOff size={14} style={{ color: S.muted }} /> : <Eye size={14} style={{ color: S.muted }} />}
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: S.text }}>Store ID *</label>
              <input type="number" value={form.storeId} onChange={e => setForm(p => ({ ...p, storeId: e.target.value }))}
                placeholder="12345"
                style={inp2(focused === "storeId")} onFocus={() => setFocused("storeId")} onBlur={() => setFocused(null)} />
              <p className="text-xs mt-1" style={{ color: S.muted }}>Pathao Dashboard → Store Management থেকে Store ID পাবেন</p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer py-2 px-3 rounded-xl" style={{ backgroundColor: form.sandboxMode ? "#FFF9EC" : "var(--c-bg)", border: `1px solid ${form.sandboxMode ? "#F5C842" : S.border}` }}>
              <div className="w-10 h-5 rounded-full flex items-center px-0.5 transition-colors flex-shrink-0" style={{ backgroundColor: form.sandboxMode ? "#F5C842" : S.border }} onClick={() => setForm(p => ({ ...p, sandboxMode: !p.sandboxMode }))}>
                <div className="w-4 h-4 rounded-full bg-white shadow transition-transform" style={{ transform: form.sandboxMode ? "translateX(20px)" : "translateX(0)" }} />
              </div>
              <div>
                <p className="text-xs font-medium" style={{ color: S.text }}>Sandbox Mode (পরীক্ষার জন্য)</p>
                <p className="text-xs" style={{ color: S.muted }}>
                  {form.sandboxMode
                    ? "hermes-sandbox.pathao.com ব্যবহার হচ্ছে — real booking হবে না"
                    : "hermes.pathao.com (production) — real booking হবে"}
                </p>
              </div>
            </label>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={handleTest} disabled={testing}
              className="flex-1 py-2.5 rounded-xl border text-sm font-medium disabled:opacity-60"
              style={{ borderColor: S.primary, color: S.primary }}>
              {testing ? <span className="flex items-center justify-center gap-2"><Loader2 size={14} className="animate-spin" /> পরীক্ষা...</span> : "সংযোগ পরীক্ষা"}
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-medium disabled:opacity-60"
              style={{ backgroundColor: S.primary }}>
              {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
            </button>
          </div>
        </div>
      )}

      {/* How to use guide */}
      <div className="rounded-2xl border p-5" style={{ backgroundColor: S.surface, borderColor: S.border }}>
        <h4 className="font-semibold text-sm mb-3" style={{ color: S.text }}>কিভাবে ব্যবহার করবেন</h4>
        <div className="space-y-3">
          {[
            { step: "১", title: "Pathao Merchant Account খুলুন", desc: "pathao.com/business থেকে merchant account তৈরি করুন" },
            { step: "২", title: "API Credentials সংগ্রহ করুন", desc: "Pathao Dashboard → Developer Settings থেকে Client ID ও Secret নিন" },
            { step: "৩", title: "এখানে সংযুক্ত করুন", desc: "উপরের ফর্মে credentials দিয়ে 'সেভ করুন' চাপুন" },
            { step: "৪", title: "অর্ডার থেকে বুকিং করুন", desc: "যেকোনো অর্ডার খুলে 'Pathao' বেছে courier book করুন" },
          ].map(item => (
            <div key={item.step} className="flex gap-3">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: "var(--c-primary-light)", color: S.primary }}>{item.step}</span>
              <div>
                <p className="text-sm font-medium" style={{ color: S.text }}>{item.title}</p>
                <p className="text-xs mt-0.5" style={{ color: S.muted }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Steadfast Settings Panel ──────────────────────── */
function SteadfastSettingsPanel() {
  const [status, setStatus] = useState<{ isConnected: boolean; connectedAt: string | null; apiKey: string | null; hasCredentials: boolean } | null>(null);
  const [form, setForm] = useState({ apiKey: "", secretKey: "" });
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", secondary: "var(--c-text-sub)", muted: "var(--c-text-muted)", primary: "var(--c-primary)" };

  function showToast(type: "success" | "error", msg: string) { setToast({ type, msg }); setTimeout(() => setToast(null), 3500); }

  async function load() {
    const res = await fetch("/api/settings/steadfast");
    if (res.ok) setStatus(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function save() {
    setSaving(true);
    const r = await fetch("/api/settings/steadfast", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const d = await r.json();
    if (r.ok) { showToast("success", "Steadfast সফলভাবে সংযুক্ত হয়েছে!"); setShowForm(false); load(); }
    else showToast("error", d.error ?? "সেভ করা যায়নি");
    setSaving(false);
  }

  async function disconnect() {
    if (!confirm("Steadfast সংযোগ বিচ্ছিন্ন করবেন?")) return;
    await fetch("/api/settings/steadfast", { method: "DELETE" });
    showToast("success", "Steadfast সংযোগ বিচ্ছিন্ন করা হয়েছে");
    load();
  }

  return (
    <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
      {toast && <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg" style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>{toast.msg}</div>}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-sm" style={{ color: S.text }}>Steadfast Courier Integration</p>
          <p className="text-xs mt-0.5" style={{ color: S.muted }}>আপনার Steadfast merchant account দিয়ে অর্ডার book করুন</p>
        </div>
        <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: status?.isConnected ? "var(--status-delivered-bg)" : "var(--status-pending-bg)", color: status?.isConnected ? "var(--status-delivered-text)" : "var(--status-pending-text)" }}>
          {status === null ? "লোড হচ্ছে..." : status.isConnected ? "সংযুক্ত" : "সংযুক্ত নেই"}
        </span>
      </div>

      {status?.isConnected ? (
        <div className="space-y-3">
          <div className="rounded-xl p-3 text-sm" style={{ backgroundColor: "var(--c-bg)" }}>
            <p style={{ color: S.muted }}>API Key: <span style={{ color: S.text }}>{status.apiKey ?? "—"}</span></p>
            {status.connectedAt && <p className="mt-1" style={{ color: S.muted }}>Connected: <span style={{ color: S.text }}>{new Date(status.connectedAt).toLocaleDateString("bn-BD")}</span></p>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(!showForm)} className="flex-1 py-2 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.secondary }}>
              API Key পরিবর্তন
            </button>
            <button onClick={disconnect} className="px-4 py-2 rounded-xl border text-sm font-medium" style={{ borderColor: "#E24B4A", color: "#E24B4A" }}>
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} className="w-full py-2.5 rounded-xl text-white text-sm font-medium" style={{ backgroundColor: S.primary }}>
          Steadfast সংযুক্ত করুন
        </button>
      )}

      {showForm && (
        <div className="space-y-3 pt-2 border-t" style={{ borderColor: S.border }}>
          <p className="text-xs font-semibold" style={{ color: S.text }}>Steadfast API Credentials</p>
          <p className="text-xs" style={{ color: S.muted }}>portal.steadfast.com.bd → Settings → API থেকে পাবেন</p>
          <div className="space-y-2">
            <input type="text" placeholder="API Key" value={form.apiKey} onChange={e => setForm(f => ({ ...f, apiKey: e.target.value }))}
              className="w-full h-10 px-3 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
            <input type="text" placeholder="Secret Key" value={form.secretKey} onChange={e => setForm(f => ({ ...f, secretKey: e.target.value }))}
              className="w-full h-10 px-3 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.secondary }}>বাতিল</button>
            <button onClick={save} disabled={saving || !form.apiKey || !form.secretKey} className="flex-1 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-60" style={{ backgroundColor: S.primary }}>
              {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── RedX Settings Panel ──────────────────────────── */
function RedxSettingsPanel() {
  const [status, setStatus] = useState<{ isConnected: boolean; connectedAt: string | null; apiKey: string | null; hasCredentials: boolean } | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", secondary: "var(--c-text-sub)", muted: "var(--c-text-muted)", primary: "var(--c-primary)" };

  function showToast(type: "success" | "error", msg: string) { setToast({ type, msg }); setTimeout(() => setToast(null), 3500); }

  async function load() {
    const res = await fetch("/api/settings/redx");
    if (res.ok) setStatus(await res.json());
  }

  useEffect(() => { load(); }, []);

  async function save() {
    setSaving(true);
    const r = await fetch("/api/settings/redx", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
    });
    const d = await r.json();
    if (r.ok) { showToast("success", "RedX সফলভাবে সংযুক্ত হয়েছে!"); setShowForm(false); load(); }
    else showToast("error", d.error ?? "সেভ করা যায়নি");
    setSaving(false);
  }

  async function disconnect() {
    if (!confirm("RedX সংযোগ বিচ্ছিন্ন করবেন?")) return;
    await fetch("/api/settings/redx", { method: "DELETE" });
    showToast("success", "RedX সংযোগ বিচ্ছিন্ন করা হয়েছে");
    load();
  }

  return (
    <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
      {toast && <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg" style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>{toast.msg}</div>}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-sm" style={{ color: S.text }}>RedX Courier Integration</p>
          <p className="text-xs mt-0.5" style={{ color: S.muted }}>আপনার RedX merchant account দিয়ে অর্ডার book করুন</p>
        </div>
        <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: status?.isConnected ? "var(--status-delivered-bg)" : "var(--status-pending-bg)", color: status?.isConnected ? "var(--status-delivered-text)" : "var(--status-pending-text)" }}>
          {status === null ? "লোড হচ্ছে..." : status.isConnected ? "সংযুক্ত" : "সংযুক্ত নেই"}
        </span>
      </div>

      {status?.isConnected ? (
        <div className="space-y-3">
          <div className="rounded-xl p-3 text-sm" style={{ backgroundColor: "var(--c-bg)" }}>
            <p style={{ color: S.muted }}>API Key: <span style={{ color: S.text }}>{status.apiKey ?? "—"}</span></p>
            {status.connectedAt && <p className="mt-1" style={{ color: S.muted }}>Connected: <span style={{ color: S.text }}>{new Date(status.connectedAt).toLocaleDateString("bn-BD")}</span></p>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(!showForm)} className="flex-1 py-2 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.secondary }}>
              API Key পরিবর্তন
            </button>
            <button onClick={disconnect} className="px-4 py-2 rounded-xl border text-sm font-medium" style={{ borderColor: "#E24B4A", color: "#E24B4A" }}>
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} className="w-full py-2.5 rounded-xl text-white text-sm font-medium" style={{ backgroundColor: S.primary }}>
          RedX সংযুক্ত করুন
        </button>
      )}

      {showForm && (
        <div className="space-y-3 pt-2 border-t" style={{ borderColor: S.border }}>
          <p className="text-xs font-semibold" style={{ color: S.text }}>RedX API Key</p>
          <p className="text-xs" style={{ color: S.muted }}>redx.com.bd → Settings → API Integration থেকে পাবেন</p>
          <input type="text" placeholder="API Key (Bearer Token)" value={apiKey} onChange={e => setApiKey(e.target.value)}
            className="w-full h-10 px-3 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.secondary }}>বাতিল</button>
            <button onClick={save} disabled={saving || !apiKey.trim()} className="flex-1 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-60" style={{ backgroundColor: S.primary }}>
              {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EcourierSettingsPanel() {
  const [status, setStatus] = useState<{ isConnected: boolean; hasApi: boolean; connectedAt: string | null; apiKey: string | null; ecUserId: string | null; pickupAddress: string | null } | null>(null);
  const [hasApi, setHasApi] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [ecUserId, setEcUserId] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const S = { surface: "var(--c-surface)", border: "var(--c-border)", text: "var(--c-text)", secondary: "var(--c-text-sub)", muted: "var(--c-text-muted)", primary: "var(--c-primary)" };

  function showToast(type: "success" | "error", msg: string) { setToast({ type, msg }); setTimeout(() => setToast(null), 3500); }

  async function load() {
    const res = await fetch("/api/settings/ecourier");
    if (res.ok) {
      const d = await res.json();
      setStatus(d);
      setHasApi(d.hasApi ?? false);
      setPickupAddress(d.pickupAddress ?? "");
      setEcUserId(d.ecUserId ?? "");
    }
  }

  useEffect(() => { load(); }, []);

  async function save() {
    setSaving(true);
    const r = await fetch("/api/settings/ecourier", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hasApi, apiKey: apiKey.trim(), apiSecret: apiSecret.trim(), ecUserId: ecUserId.trim(), pickupAddress: pickupAddress.trim() }),
    });
    const d = await r.json();
    if (r.ok) { showToast("success", "eCourier সফলভাবে সেভ হয়েছে!"); setShowForm(false); setApiKey(""); setApiSecret(""); load(); }
    else showToast("error", d.error ?? "সেভ করা যায়নি");
    setSaving(false);
  }

  async function disconnect() {
    if (!confirm("eCourier সেটিংস মুছে ফেলবেন?")) return;
    await fetch("/api/settings/ecourier", { method: "DELETE" });
    showToast("success", "eCourier সেটিংস মুছে ফেলা হয়েছে");
    load();
  }

  return (
    <div className="rounded-2xl border p-5 space-y-4" style={{ backgroundColor: S.surface, borderColor: S.border }}>
      {toast && <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg" style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>{toast.msg}</div>}
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-sm" style={{ color: S.text }}>eCourier Integration</p>
          <p className="text-xs mt-0.5" style={{ color: S.muted }}>API দিয়ে অটো-বুকিং অথবা Tracking ID দিয়ে ম্যানুয়াল ট্র্যাক করুন</p>
        </div>
        <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: status?.isConnected ? "var(--status-delivered-bg)" : "var(--status-pending-bg)", color: status?.isConnected ? "var(--status-delivered-text)" : "var(--status-pending-text)" }}>
          {status === null ? "লোড হচ্ছে..." : status.isConnected ? (status.hasApi ? "API সংযুক্ত" : "ID Tracking") : "সংযুক্ত নেই"}
        </span>
      </div>

      {status?.isConnected ? (
        <div className="space-y-3">
          <div className="rounded-xl p-3 text-sm space-y-1" style={{ backgroundColor: "var(--c-bg)" }}>
            <p style={{ color: S.muted }}>মোড: <span style={{ color: S.text }}>{status.hasApi ? "API Auto-booking" : "Manual ID Tracking"}</span></p>
            {status.hasApi && status.apiKey && <p style={{ color: S.muted }}>API Key: <span style={{ color: S.text }}>{status.apiKey}</span></p>}
            {status.hasApi && status.ecUserId && <p style={{ color: S.muted }}>User ID: <span style={{ color: S.text }}>{status.ecUserId}</span></p>}
            {status.pickupAddress && <p style={{ color: S.muted }}>Pickup: <span style={{ color: S.text }}>{status.pickupAddress}</span></p>}
            {status.connectedAt && <p style={{ color: S.muted }}>Connected: <span style={{ color: S.text }}>{new Date(status.connectedAt).toLocaleDateString("bn-BD")}</span></p>}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowForm(!showForm)} className="flex-1 py-2 rounded-xl border text-sm font-medium" style={{ borderColor: S.border, color: S.secondary }}>
              সেটিংস পরিবর্তন
            </button>
            <button onClick={disconnect} className="px-4 py-2 rounded-xl border text-sm font-medium" style={{ borderColor: "#E24B4A", color: "#E24B4A" }}>
              Disconnect
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)} className="w-full py-2.5 rounded-xl text-white text-sm font-medium" style={{ backgroundColor: S.primary }}>
          eCourier সেটআপ করুন
        </button>
      )}

      {showForm && (
        <div className="space-y-3 pt-3 border-t" style={{ borderColor: S.border }}>
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: "var(--c-bg)" }}>
            <button onClick={() => setHasApi(false)} className="flex items-center gap-2 flex-1 text-sm" style={{ color: !hasApi ? S.primary : S.muted }}>
              <span className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center" style={{ borderColor: !hasApi ? S.primary : S.border }}>
                {!hasApi && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: S.primary }} />}
              </span>
              Manual Tracking ID
            </button>
            <button onClick={() => setHasApi(true)} className="flex items-center gap-2 flex-1 text-sm" style={{ color: hasApi ? S.primary : S.muted }}>
              <span className="w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center" style={{ borderColor: hasApi ? S.primary : S.border }}>
                {hasApi && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: S.primary }} />}
              </span>
              API Auto-booking
            </button>
          </div>

          {!hasApi && (
            <p className="text-xs px-1" style={{ color: S.muted }}>এই মোডে অর্ডার বুক করার সময় আপনি eCourier Tracking ID নিজে দেবেন। সিস্টেম ট্র্যাক করবে না।</p>
          )}

          {hasApi && (
            <div className="space-y-2">
              <p className="text-xs" style={{ color: S.muted }}>ecourier.com.bd → API Integration থেকে credentials পাবেন</p>
              <input type="text" placeholder="API Key" value={apiKey} onChange={e => setApiKey(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
              <input type="password" placeholder="API Secret" value={apiSecret} onChange={e => setApiSecret(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
              <input type="text" placeholder="User ID" value={ecUserId} onChange={e => setEcUserId(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
              <input type="text" placeholder="Pickup Address (যেমন: Uttara, Dhaka)" value={pickupAddress} onChange={e => setPickupAddress(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border text-sm outline-none" style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
            </div>
          )}

          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-xl border text-sm" style={{ borderColor: S.border, color: S.secondary }}>বাতিল</button>
            <button onClick={save} disabled={saving} className="flex-1 py-2 rounded-xl text-white text-sm font-medium disabled:opacity-60" style={{ backgroundColor: S.primary }}>
              {saving ? "সেভ হচ্ছে..." : "সেভ করুন"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Referral Panel ────────────────────────────────── */
function ReferralPanel() {
  const [data, setData] = useState<{ code: string; uses: number; earnings: number; referrals: { name: string; joinedAt: string; rewardGiven: boolean }[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referral").then(r => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  function copyCode() {
    if (!data?.code) return;
    navigator.clipboard.writeText(data.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareWhatsApp() {
    if (!data?.code) return;
    const msg = encodeURIComponent(`HisabBoi দিয়ে আমার business অনেক সহজ হয়েছে! তুমিও try করো। আমার code দিয়ে signup করলে ১ মাস Pro free পাবে: ${data.code}\n\nhttps://bizilcore.com/signup?ref=${data.code}`);
    window.open(`https://wa.me/?text=${msg}`, "_blank");
  }

  if (loading) return <div className="animate-pulse space-y-3"><div className="h-24 rounded-xl bg-gray-100" /><div className="h-16 rounded-xl bg-gray-100" /></div>;

  return (
    <div className="space-y-5">
      <div className="rounded-2xl p-6" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
        <h3 className="font-semibold text-base mb-1" style={{ color: S.text }}>আপনার Referral কোড</h3>
        <p className="text-sm mb-4" style={{ color: S.secondary }}>বন্ধুকে share করুন — তারা ১ মাস Pro free পাবে, আপনিও পাবেন!</p>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-12 rounded-xl flex items-center px-4 text-xl font-mono font-bold tracking-widest" style={{ backgroundColor: S.bg, color: S.primary }}>
            {data?.code ?? "—"}
          </div>
          <button onClick={copyCode} className="h-12 px-5 rounded-xl text-white font-medium text-sm flex items-center gap-2 flex-shrink-0" style={{ backgroundColor: S.primary }}>
            <Copy size={15} /> {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <button onClick={shareWhatsApp} className="w-full py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2" style={{ backgroundColor: "#25D366", color: "#fff" }}>
          <MessageCircle size={16} /> WhatsApp-এ Share করুন
        </button>

        <div className="mt-4 p-4 rounded-xl text-sm" style={{ backgroundColor: S.bg, color: S.muted }}>
          <span className="font-medium" style={{ color: S.text }}>Share করার বার্তা:</span>
          <p className="mt-1 leading-relaxed">{"HisabBoi দিয়ে আমার business অনেক সহজ হয়েছে! তুমিও try করো। আমার code দিয়ে signup করলে ১ মাস Pro free পাবে: "}<span style={{ color: S.primary, fontWeight: 600 }}>{data?.code}</span></p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "মোট Referral", value: data?.uses ?? 0, unit: "জন" },
          { label: "মোট Free মাস Earned", value: data?.earnings ?? 0, unit: "মাস" },
        ].map(stat => (
          <div key={stat.label} className="rounded-2xl p-5 text-center" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
            <p className="text-3xl font-bold" style={{ color: S.primary }}>{stat.value}</p>
            <p className="text-xs mt-1" style={{ color: S.muted }}>{stat.unit}</p>
            <p className="text-sm mt-0.5" style={{ color: S.secondary }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {data && data.referrals.length > 0 && (
        <div className="rounded-2xl" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
          <p className="px-5 pt-5 pb-3 text-sm font-semibold" style={{ color: S.text }}>Referred ব্যবহারকারীরা</p>
          <div className="divide-y" style={{ borderColor: S.border }}>
            {data.referrals.map((r, i) => (
              <div key={i} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-medium" style={{ color: S.text }}>{r.name}</p>
                  <p className="text-xs" style={{ color: S.muted }}>{new Date(r.joinedAt).toLocaleDateString("bn-BD")}</p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: r.rewardGiven ? "#E1F5EE" : "#F7F6F2", color: r.rewardGiven ? "#0F6E56" : "#A8A69E" }}>
                  {r.rewardGiven ? "✓ Reward দেওয়া হয়েছে" : "Pending"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {data && data.referrals.length === 0 && (
        <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: S.surface, border: `1px solid ${S.border}` }}>
          <p className="text-sm" style={{ color: S.muted }}>এখনো কাউকে refer করেননি। উপরের code share করুন!</p>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="animate-pulse space-y-4"><div className="h-12 bg-gray-100 rounded-xl" /><div className="h-12 bg-gray-100 rounded-xl" /></div>}>
      <SettingsContent />
    </Suspense>
  );
}
