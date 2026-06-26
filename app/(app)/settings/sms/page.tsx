"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MessageSquare, Loader2, Save, ShieldCheck } from "lucide-react";
import SmsAutoSettingsToggle from "@/components/sms/SmsAutoSettingsToggle";
import { useSmsCredits } from "@/hooks/useSmsCredits";
import { PageShell, Card, Badge, Button, Input, Tabs, SectionTitle } from "@/components/ui";

const STATUS_VARIANT: Record<string, "warning" | "success" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Rejected",
};

export default function SmsSettingsPage() {
  const { maskingBalance, nonMaskingBalance, maskingEnabled } = useSmsCredits();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submittingSenderId, setSubmittingSenderId] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [settings, setSettings] = useState({
    autoSmsOnOrderCreate: false,
    autoSmsOnOrderStatusChange: false,
    autoSmsTemplateOrderCreate: "",
    autoSmsTemplateStatusChange: "",
    defaultSmsType: "non_masking" as "masking" | "non_masking",
    lowCreditNotification: true,
  });
  const [senderIdInput, setSenderIdInput] = useState("");
  const [senderRequest, setSenderRequest] = useState<{
    status: string | null;
    senderId: string | null;
    adminNote: string | null;
  }>({ status: null, senderId: null, adminNote: null });

  useEffect(() => {
    Promise.all([
      fetch("/api/sms-settings").then((r) => r.json()),
      fetch("/api/sms-sender-id").then((r) => r.json()),
    ])
      .then(([smsSettings, senderData]) => {
        setSettings(smsSettings);
        setSenderRequest(senderData);
        if (senderData.senderId) setSenderIdInput(senderData.senderId);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!maskingEnabled && settings.defaultSmsType === "masking") {
      setSettings((s) => ({ ...s, defaultSmsType: "non_masking" }));
    }
  }, [maskingEnabled, settings.defaultSmsType]);

  async function handleSave() {
    setSaving(true);
    const r = await fetch("/api/sms-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    if (r.ok) {
      setToast({ type: "success", msg: "সেটিংস সংরক্ষিত হয়েছে" });
    } else {
      setToast({ type: "error", msg: "সংরক্ষণ ব্যর্থ" });
    }
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSenderIdSubmit() {
    setSubmittingSenderId(true);
    const r = await fetch("/api/sms-sender-id", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId: senderIdInput }),
    });
    const data = await r.json();
    setSubmittingSenderId(false);
    if (r.ok) {
      setSenderRequest({ status: data.status, senderId: data.senderId, adminNote: null });
      setToast({ type: "success", msg: "Sender ID request জমা হয়েছে" });
    } else {
      setToast({ type: "error", msg: data.error ?? "Request ব্যর্থ" });
    }
    setTimeout(() => setToast(null), 3000);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 size={28} className="animate-spin" style={{ color: "var(--c-primary)" }} />
      </div>
    );
  }

  const balanceSubtitle = maskingEnabled
    ? `Masking: ${maskingBalance} · Non-Masking: ${nonMaskingBalance}`
    : `ব্যালেন্স: ${nonMaskingBalance} SMS`;

  return (
    <PageShell
      title="SMS সেটিংস"
      subtitle={balanceSubtitle}
      className="max-w-2xl"
      breadcrumbs={[{ label: "সেটিংস", href: "/settings" }]}
      actions={
        <Link href="/billing#sms-credits">
          <Button variant="outline" size="sm">ক্রেডিট কিনুন</Button>
        </Link>
      }
    >
      <Link href="/settings" className="flex items-center gap-1 text-sm -mt-2 mb-2" style={{ color: "var(--c-text-muted)" }}>
        <ArrowLeft size={14} /> সেটিংস
      </Link>

      {maskingEnabled && (
        <Card className="space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck size={16} style={{ color: "var(--c-primary)" }} />
            <SectionTitle title="Sender ID (Masking SMS)" className="mb-0" />
          </div>
          <p className="text-xs" style={{ color: "var(--c-text-muted)" }}>
            Masking SMS-এ প্রাপক আপনার ব্র্যান্ড নাম দেখবে (যেমন MYSTORE)। BTRC approval-এর পর admin approve করবেন।
          </p>
          {senderRequest.status && (
            <Badge variant={STATUS_VARIANT[senderRequest.status] ?? "default"}>
              {STATUS_LABEL[senderRequest.status] ?? senderRequest.status}{senderRequest.senderId ? `: ${senderRequest.senderId}` : ""}
            </Badge>
          )}
          {senderRequest.adminNote && (
            <p className="text-xs text-red-600">Admin note: {senderRequest.adminNote}</p>
          )}
          {senderRequest.status !== "approved" && (
            <div className="flex gap-2">
              <Input
                value={senderIdInput}
                onChange={(e) => setSenderIdInput(e.target.value.toUpperCase())}
                placeholder="MYSTORE (৩–১১ অক্ষর)"
                maxLength={11}
                className="flex-1 font-mono uppercase"
              />
              <Button
                onClick={handleSenderIdSubmit}
                disabled={submittingSenderId || !senderIdInput.trim()}
                loading={submittingSenderId}
                size="sm"
              >
                Request
              </Button>
            </div>
          )}
        </Card>
      )}

      <Card className="space-y-2">
        {maskingEnabled && (
          <>
            <SectionTitle title="ডিফল্ট SMS Type" className="mb-2" />
            <Tabs
              tabs={[
                { key: "non_masking", label: "Non-Masking" },
                { key: "masking", label: "Masking" },
              ]}
              active={settings.defaultSmsType}
              onChange={(k) => {
                if (k === "masking" && senderRequest.status !== "approved") return;
                setSettings((s) => ({ ...s, defaultSmsType: k as "masking" | "non_masking" }));
              }}
            />
          </>
        )}

        <SectionTitle title="অটোমেটিক SMS" className="mb-2 mt-4" />

        <SmsAutoSettingsToggle
          checked={settings.autoSmsOnOrderCreate}
          onChange={(v) => setSettings((s) => ({ ...s, autoSmsOnOrderCreate: v }))}
          label="অর্ডার তৈরি হলে SMS পাঠান"
          hint="নতুন অর্ডার তৈরি হলে কাস্টমারকে SMS যাবে"
        />
        <SmsAutoSettingsToggle
          checked={settings.autoSmsOnOrderStatusChange}
          onChange={(v) => setSettings((s) => ({ ...s, autoSmsOnOrderStatusChange: v }))}
          label="অর্ডার স্ট্যাটাস পরিবর্তনে SMS"
          hint="স্ট্যাটাস আপডেট হলে কাস্টমারকে জানানো হবে"
        />

        <div className="pt-4">
          <SectionTitle title="SMS টেমপ্লেট (অর্ডার তৈরি)" className="mb-2" />
          <textarea
            value={settings.autoSmsTemplateOrderCreate}
            onChange={(e) => setSettings((s) => ({ ...s, autoSmsTemplateOrderCreate: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 rounded-xl border text-sm resize-none focus:ring-2 focus:ring-[var(--c-primary)]/20 focus:border-[var(--c-primary)] outline-none"
            style={{ borderColor: "var(--c-border)", background: "var(--c-bg)" }}
          />
          <p className="text-xs mt-1" style={{ color: "var(--c-text-muted)" }}>
            চলকসমূহ: {"{order_id}"} {"{customer_name}"} {"{amount}"} {"{status}"} {"{shopName}"}
          </p>
        </div>

        <div className="pt-2">
          <SectionTitle title="SMS টেমপ্লেট (স্ট্যাটাস পরিবর্তন)" className="mb-2" />
          <textarea
            value={settings.autoSmsTemplateStatusChange}
            onChange={(e) => setSettings((s) => ({ ...s, autoSmsTemplateStatusChange: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 rounded-xl border text-sm resize-none focus:ring-2 focus:ring-[var(--c-primary)]/20 focus:border-[var(--c-primary)] outline-none"
            style={{ borderColor: "var(--c-border)", background: "var(--c-bg)" }}
          />
        </div>

        <div className="pt-4 border-t" style={{ borderColor: "var(--c-border)" }}>
          <SmsAutoSettingsToggle
            checked={settings.lowCreditNotification}
            onChange={(v) => setSettings((s) => ({ ...s, lowCreditNotification: v }))}
            label="ক্রেডিট কমে গেলে সতর্ক করুন"
          />
        </div>

        {toast && (
          <p className={`text-sm font-medium ${toast.type === "success" ? "text-green-600" : "text-red-600"}`}>
            {toast.msg}
          </p>
        )}

        <Button onClick={handleSave} disabled={saving} loading={saving} icon={Save} className="w-full mt-4">
          সেভ করুন
        </Button>
      </Card>
    </PageShell>
  );
}
