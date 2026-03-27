"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft, Printer, Download, Share2, Check, Loader2, Save } from "lucide-react";
import OrderSlip, { type SlipSettings, type SlipOrder, type SlipShop, type RelatedOrder } from "@/components/OrderSlip";
import { useSubscription } from "@/hooks/useSubscription";

const DEFAULT_SETTINGS: SlipSettings = {
  template: "classic",
  primaryColor: "#0d2d1a",
  accentColor: "#00e676",
  showBarcode: true,
  showQR: true,
  showSocialMedia: true,
  showProductPhotos: true,
  hideBrandBadge: false,
  customMessage: "ধন্যবাদ আপনার কেনাকাটার জন্য! পণ্য পেয়ে সমস্যা হলে আমাদের সাথে যোগাযোগ করুন। 🙏",
  facebookPage: "",
  whatsapp: "",
};

const TEMPLATES = [
  {
    key: "classic",
    name: "Classic",
    desc: "রঙিন হেডার, সম্পূর্ণ তথ্য",
    preview: (primary: string) => (
      <div style={{ width: "100%", height: "100%", backgroundColor: "#fff", overflow: "hidden", borderRadius: 4 }}>
        <div style={{ height: "28%", backgroundColor: primary, display: "flex", alignItems: "center", padding: "0 8px", gap: 5 }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.3)" }} />
          <div>
            <div style={{ height: 4, width: 40, backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 2, marginBottom: 3 }} />
            <div style={{ height: 2.5, width: 26, backgroundColor: "rgba(255,255,255,0.5)", borderRadius: 1 }} />
          </div>
        </div>
        <div style={{ height: "8%", backgroundColor: `${primary}15`, borderBottom: "1px solid #eee", display: "flex", alignItems: "center", padding: "0 8px", justifyContent: "space-between" }}>
          <div style={{ height: 3, width: 30, backgroundColor: "#aaa", borderRadius: 1 }} />
          <div style={{ height: 3, width: 20, backgroundColor: primary, borderRadius: 1 }} />
        </div>
        <div style={{ padding: "6px 8px" }}>
          {[40, 30, 50].map((w, i) => <div key={i} style={{ height: 2.5, width: `${w}%`, backgroundColor: "#e5e5e5", borderRadius: 1, marginBottom: 3 }} />)}
        </div>
        <div style={{ margin: "0 8px", border: "1px solid #eee", borderRadius: 2 }}>
          <div style={{ height: 10, backgroundColor: `${primary}15`, borderRadius: "2px 2px 0 0" }} />
          {[1,2].map(i => <div key={i} style={{ height: 8, borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", padding: "0 4px", gap: 4 }}>
            <div style={{ flex: 1, height: 2, backgroundColor: "#ddd", borderRadius: 1 }} />
            <div style={{ width: 14, height: 2, backgroundColor: "#ddd", borderRadius: 1 }} />
            <div style={{ width: 18, height: 2, backgroundColor: "#ccc", borderRadius: 1 }} />
          </div>)}
        </div>
      </div>
    ),
  },
  {
    key: "modern",
    name: "Modern",
    desc: "দুই কলাম, কার্ড ডিজাইন",
    preview: (primary: string) => (
      <div style={{ width: "100%", height: "100%", backgroundColor: "#fff", overflow: "hidden", borderRadius: 4 }}>
        <div style={{ height: 3, background: `linear-gradient(90deg, ${primary}, #38bdf8)` }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 8px", borderBottom: "1px solid #eee" }}>
          <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: `${primary}25` }} />
            <div>
              <div style={{ height: 4, width: 35, backgroundColor: primary, borderRadius: 1, marginBottom: 2, opacity: 0.8 }} />
              <div style={{ height: 2.5, width: 22, backgroundColor: "#bbb", borderRadius: 1 }} />
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ height: 4, width: 28, backgroundColor: primary, borderRadius: 1, marginBottom: 2 }} />
            <div style={{ height: 2.5, width: 20, backgroundColor: "#ccc", borderRadius: 1 }} />
          </div>
        </div>
        <div style={{ margin: "5px 8px", border: "1px solid #eee", borderRadius: 4, padding: "4px 5px", backgroundColor: `${primary}06` }}>
          {[45, 30].map((w, i) => <div key={i} style={{ height: 2.5, width: `${w}%`, backgroundColor: "#ccc", borderRadius: 1, marginBottom: 3 }} />)}
        </div>
        <div style={{ margin: "0 8px", border: "1px solid #eee", borderRadius: 2 }}>
          <div style={{ height: 9, backgroundColor: `${primary}15`, borderRadius: "2px 2px 0 0" }} />
          {[1,2].map(i => <div key={i} style={{ height: 7, borderBottom: "1px solid #f5f5f5", display: "flex", alignItems: "center", padding: "0 4px", gap: 4 }}>
            <div style={{ flex: 1, height: 2, backgroundColor: "#e0e0e0", borderRadius: 1 }} />
            <div style={{ width: 16, height: 2, backgroundColor: "#e0e0e0", borderRadius: 1 }} />
          </div>)}
        </div>
      </div>
    ),
  },
  {
    key: "minimal",
    name: "Minimal",
    desc: "পরিষ্কার, কম রঙ",
    preview: (primary: string) => (
      <div style={{ width: "100%", height: "100%", backgroundColor: "#fff", overflow: "hidden", borderRadius: 4, padding: "8px 8px 6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", paddingBottom: 5, borderBottom: `2px solid ${primary}` }}>
          <div>
            <div style={{ height: 5, width: 40, backgroundColor: "#1a1a18", borderRadius: 1, marginBottom: 2 }} />
            <div style={{ height: 2.5, width: 25, backgroundColor: "#bbb", borderRadius: 1 }} />
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ height: 3.5, width: 24, backgroundColor: primary, borderRadius: 1, marginBottom: 2, opacity: 0.8 }} />
            <div style={{ height: 2, width: 18, backgroundColor: "#ccc", borderRadius: 1 }} />
          </div>
        </div>
        <div style={{ margin: "6px 0", paddingBottom: 5, borderBottom: "1px solid #eee" }}>
          {[38, 28, 45].map((w, i) => <div key={i} style={{ height: 2.5, width: `${w}%`, backgroundColor: "#e0e0e0", borderRadius: 1, marginBottom: 2.5 }} />)}
        </div>
        {[1,2,3].map(i => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid #f2f2f2" }}>
          <div style={{ height: 2.5, width: "55%", backgroundColor: "#e5e5e5", borderRadius: 1 }} />
          <div style={{ height: 2.5, width: "20%", backgroundColor: "#ccc", borderRadius: 1 }} />
        </div>)}
        <div style={{ marginTop: 6, paddingTop: 4, borderTop: `2px solid ${primary}`, display: "flex", justifyContent: "space-between" }}>
          <div style={{ height: 4, width: "30%", backgroundColor: "#1a1a18", borderRadius: 1 }} />
          <div style={{ height: 4, width: "22%", backgroundColor: primary, borderRadius: 1 }} />
        </div>
      </div>
    ),
  },
  {
    key: "thermal",
    name: "Thermal",
    desc: "রিসিট স্টাইল, কেন্দ্রীভূত",
    preview: (primary: string) => (
      <div style={{ width: "100%", height: "100%", backgroundColor: "#fff", overflow: "hidden", borderRadius: 4, padding: "6px 10px", fontFamily: "monospace" }}>
        <div style={{ textAlign: "center", paddingBottom: 5 }}>
          <div style={{ height: 5, width: "60%", backgroundColor: primary, borderRadius: 1, margin: "0 auto 3px", opacity: 0.85 }} />
          <div style={{ height: 2.5, width: "40%", backgroundColor: "#bbb", borderRadius: 1, margin: "0 auto" }} />
        </div>
        <div style={{ borderTop: "1px dashed #bbb", margin: "4px 0" }} />
        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <div style={{ height: 4, width: "50%", backgroundColor: "#333", borderRadius: 1, margin: "0 auto 2px" }} />
          <div style={{ height: 2.5, width: "38%", backgroundColor: "#bbb", borderRadius: 1, margin: "0 auto" }} />
        </div>
        <div style={{ borderTop: "1px dashed #bbb", margin: "4px 0" }} />
        {[1,2,3].map(i => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", borderBottom: "1px dotted #ddd" }}>
          <div style={{ height: 2.5, width: "55%", backgroundColor: "#e0e0e0", borderRadius: 1 }} />
          <div style={{ height: 2.5, width: "20%", backgroundColor: "#ccc", borderRadius: 1 }} />
        </div>)}
        <div style={{ borderTop: "1px dashed #bbb", margin: "4px 0" }} />
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <div style={{ height: 4, width: "30%", backgroundColor: "#333", borderRadius: 1 }} />
          <div style={{ height: 4, width: "22%", backgroundColor: primary, borderRadius: 1 }} />
        </div>
      </div>
    ),
  },
  {
    key: "bold",
    name: "Bold",
    desc: "বড় COD বক্স, জোরালো ডিজাইন",
    preview: (primary: string) => (
      <div style={{ width: "100%", height: "100%", backgroundColor: "#fff", overflow: "hidden", borderRadius: 4 }}>
        <div style={{ height: "35%", backgroundColor: primary, padding: "6px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 5 }}>
            <div style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.25)" }} />
            <div style={{ height: 4, width: 38, backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 1 }} />
          </div>
          <div style={{ backgroundColor: "rgba(255,255,255,0.18)", borderRadius: 4, padding: "2px 6px", display: "inline-block" }}>
            <div style={{ height: 3.5, width: 30, backgroundColor: "#fff", borderRadius: 1 }} />
          </div>
        </div>
        <div style={{ padding: "5px 8px" }}>
          {[1,2,3].map(i => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "2.5px 0", borderBottom: "1px solid #f0f0f0" }}>
            <div style={{ height: 2.5, width: "55%", backgroundColor: "#ddd", borderRadius: 1 }} />
            <div style={{ height: 2.5, width: "18%", backgroundColor: "#ccc", borderRadius: 1 }} />
          </div>)}
        </div>
        <div style={{ margin: "4px 8px", backgroundColor: primary, borderRadius: 5, padding: "4px 7px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ height: 2.5, width: "35%", backgroundColor: "rgba(255,255,255,0.5)", borderRadius: 1 }} />
          <div style={{ height: 5, width: "28%", backgroundColor: "rgba(255,255,255,0.9)", borderRadius: 1 }} />
        </div>
      </div>
    ),
  },
  {
    key: "elegant",
    name: "Elegant",
    desc: "প্রিমিয়াম লুক, পাশের বার",
    preview: (primary: string) => (
      <div style={{ width: "100%", height: "100%", backgroundColor: "#fff", overflow: "hidden", borderRadius: 4, display: "flex" }}>
        <div style={{ width: 5, backgroundColor: primary, flexShrink: 0 }} />
        <div style={{ flex: 1, padding: "7px 8px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 6, borderBottom: "1px solid #eee", marginBottom: 5 }}>
            <div>
              <div style={{ height: 5, width: 36, backgroundColor: "#1a1a18", borderRadius: 1, marginBottom: 2.5 }} />
              <div style={{ height: 2.5, width: 24, backgroundColor: "#bbb", borderRadius: 1 }} />
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ height: 3.5, width: 24, backgroundColor: primary, borderRadius: 1, marginBottom: 2 }} />
              <div style={{ height: 2.5, width: 18, backgroundColor: "#ccc", borderRadius: 1 }} />
            </div>
          </div>
          <div style={{ marginBottom: 5, paddingBottom: 5, borderBottom: "1px solid #eee" }}>
            {[40, 28].map((w, i) => <div key={i} style={{ height: 2.5, width: `${w}%`, backgroundColor: "#e0e0e0", borderRadius: 1, marginBottom: 3 }} />)}
          </div>
          {[1,2,3].map(i => <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "2.5px 0", borderBottom: "1px solid #f5f5f5" }}>
            <div style={{ height: 2.5, width: "55%", backgroundColor: "#e5e5e5", borderRadius: 1 }} />
            <div style={{ height: 2.5, width: "18%", backgroundColor: "#ccc", borderRadius: 1 }} />
          </div>)}
          <div style={{ marginTop: 5, padding: "5px 7px", backgroundColor: `${primary}10`, border: `1px solid ${primary}20`, borderRadius: 4, display: "flex", justifyContent: "space-between" }}>
            <div style={{ height: 3, width: "30%", backgroundColor: "#999", borderRadius: 1 }} />
            <div style={{ height: 4, width: "25%", backgroundColor: primary, borderRadius: 1, opacity: 0.8 }} />
          </div>
        </div>
      </div>
    ),
  },
];

const COLOR_PRESETS = [
  { label: "BizilCore", primary: "#0d2d1a", accent: "#00e676" },
  { label: "Navy", primary: "#1e3a5f", accent: "#38bdf8" },
  { label: "Purple", primary: "#3b1a6b", accent: "#c084fc" },
  { label: "Royal", primary: "#7c2d12", accent: "#fb923c" },
  { label: "Black Gold", primary: "#1a1a18", accent: "#d97706" },
  { label: "Teal", primary: "#0f4c51", accent: "#2dd4bf" },
];

const S = {
  surface: "var(--c-surface)",
  border: "var(--c-border)",
  text: "var(--c-text)",
  muted: "var(--c-text-muted)",
  sub: "var(--c-text-sub)",
  primary: "var(--c-primary)",
  bg: "var(--c-bg)",
};

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between py-2.5 cursor-pointer border-b last:border-0" style={{ borderColor: S.border }}>
      <span className="text-sm" style={{ color: S.text }}>{label}</span>
      <div className="w-10 h-5 rounded-full flex items-center px-0.5 transition-colors flex-shrink-0"
        style={{ backgroundColor: checked ? S.primary : S.border }}
        onClick={() => onChange(!checked)}>
        <div className="w-4 h-4 rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? "translateX(20px)" : "translateX(0)" }} />
      </div>
    </label>
  );
}

export default function SlipPage() {
  const { id } = useParams<{ id: string }>();
  const slipRef = useRef<HTMLDivElement>(null);
  const { plan } = useSubscription();
  const canHideBrand = plan === "business";

  const [order, setOrder] = useState<SlipOrder | null>(null);
  const [shop, setShop] = useState<SlipShop | null>(null);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<SlipSettings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [shareMsg, setShareMsg] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [customPresets, setCustomPresets] = useState<{ name: string; primary: string; accent: string }[]>([]);
  const [presetName, setPresetName] = useState("");
  const [showPresetInput, setShowPresetInput] = useState(false);
  const [savingPreset, setSavingPreset] = useState(false);
  const [relatedOrders, setRelatedOrders] = useState<RelatedOrder[]>([]);
  const [combineOrders, setCombineOrders] = useState(true);
  const [displayScale, setDisplayScale] = useState(0.72);

  useEffect(() => {
    const update = () => {
      if (window.innerWidth >= 1024) {
        setDisplayScale(0.72);
      } else {
        setDisplayScale(Math.min(0.72, (window.innerWidth - 32) / 560));
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  useEffect(() => {
    fetch(`/api/orders/${id}/slip-data`)
      .then(r => r.ok ? r.json() : Promise.reject(r))
      .then(data => {
        if (data.order) setOrder(data.order);
        if (Array.isArray(data.relatedOrders)) setRelatedOrders(data.relatedOrders);
        if (data.shop) {
          setShop({ name: data.shop.name, phone: data.shop.phone, logoUrl: data.shop.logoUrl });
          setSettings({
            template:         data.shop.slipTemplate          ?? "classic",
            primaryColor:     data.shop.slipPrimaryColor      ?? DEFAULT_SETTINGS.primaryColor,
            accentColor:      data.shop.slipAccentColor       ?? DEFAULT_SETTINGS.accentColor,
            showBarcode:      data.shop.slipShowBarcode       ?? true,
            showQR:           data.shop.slipShowQR            ?? true,
            showSocialMedia:  data.shop.slipShowSocialMedia   ?? true,
            showProductPhotos: data.shop.slipShowProductPhotos ?? true,
            hideBrandBadge:   data.shop.slipHideBrandBadge   ?? false,
            customMessage:    data.shop.slipCustomMessage     ?? DEFAULT_SETTINGS.customMessage,
            facebookPage:     data.shop.slipFacebookPage      ?? "",
            whatsapp:         data.shop.slipWhatsapp          ?? "",
          });
          if (Array.isArray(data.shop.slipColorPresets)) {
            setCustomPresets(data.shop.slipColorPresets);
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function saveDefaults() {
    setSaving(true);
    try {
      await fetch("/api/settings/slip", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slipTemplate:          settings.template,
          slipPrimaryColor:      settings.primaryColor,
          slipAccentColor:       settings.accentColor,
          slipShowBarcode:       settings.showBarcode,
          slipShowQR:            settings.showQR,
          slipShowSocialMedia:   settings.showSocialMedia,
          slipShowProductPhotos: settings.showProductPhotos,
          slipHideBrandBadge:    canHideBrand ? settings.hideBrandBadge : false,
          slipCustomMessage:     settings.customMessage,
          slipFacebookPage:      settings.facebookPage,
          slipWhatsapp:          settings.whatsapp,
          slipColorPresets:      customPresets,
        }),
      });
      setSaved(true);
      showToast("success", "সেটিংস সেভ হয়েছে ✓ পরের বার login করলেও এই ডিজাইন থাকবে।");
      setTimeout(() => setSaved(false), 3000);
    } catch {
      showToast("error", "সেভ করা যায়নি।");
    }
    setSaving(false);
  }

  async function persistPresets(presets: { name: string; primary: string; accent: string }[]) {
    await fetch("/api/settings/slip", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slipColorPresets: presets }),
    });
  }

  async function addCustomPreset() {
    if (!presetName.trim()) return;
    setSavingPreset(true);
    const newPreset = { name: presetName.trim(), primary: settings.primaryColor, accent: settings.accentColor };
    const updated = [...customPresets, newPreset];
    setCustomPresets(updated);
    setPresetName("");
    setShowPresetInput(false);
    try {
      await persistPresets(updated);
      showToast("success", `"${newPreset.name}" প্রিসেট সেভ হয়েছে।`);
    } catch {
      showToast("error", "প্রিসেট সেভ হয়নি।");
    }
    setSavingPreset(false);
  }

  async function deleteCustomPreset(index: number) {
    const updated = customPresets.filter((_, i) => i !== index);
    setCustomPresets(updated);
    try { await persistPresets(updated); } catch {}
  }

  function handlePrint() {
    const el = slipRef.current;
    if (!el) return;
    const html = el.outerHTML;

    const iframe = document.createElement("iframe");
    iframe.style.cssText = "position:fixed;left:-620px;top:0;width:600px;height:850px;border:0;";
    document.body.appendChild(iframe);

    const iwin = iframe.contentWindow;
    const idoc = iframe.contentDocument || iwin?.document;
    if (!idoc || !iwin) { document.body.removeChild(iframe); return; }

    idoc.open();
    idoc.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8">
      <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700;800&display=swap" rel="stylesheet">
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{margin:0;background:#fff}
        @page{size:A5 portrait;margin:0mm}
        img{max-width:100%;display:block}
      </style>
    </head><body>${html}</body></html>`);
    idoc.close();

    let done = false;
    const doPrint = () => {
      if (done) return;
      done = true;
      iwin.focus();
      iwin.onafterprint = () => { try { document.body.removeChild(iframe); } catch {} };
      iwin.print();
      setTimeout(() => { try { document.body.removeChild(iframe); } catch {} }, 10000);
    };

    iframe.onload = () => setTimeout(doPrint, 800);
    setTimeout(doPrint, 3000);
  }

  async function handleDownloadPDF() {
    const el = slipRef.current;
    const wrapper = el?.parentElement as HTMLElement | null;
    if (!el || !wrapper) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const jsPDF = (await import("jspdf")).default;

      const savedStyle = wrapper.style.cssText;
      wrapper.style.cssText = "position:fixed;left:0;top:0;width:560px;z-index:99999;background:#fff;";
      el.style.visibility = "visible";

      await new Promise(r => setTimeout(r, 400));

      const imgs = Array.from(el.querySelectorAll<HTMLImageElement>("img"));
      await Promise.all(imgs.map(img => new Promise<void>(resolve => {
        if (img.complete && img.naturalWidth > 0) { resolve(); return; }
        img.onload = () => resolve();
        img.onerror = () => resolve();
        const src = img.src;
        img.src = "";
        img.crossOrigin = "anonymous";
        img.src = src;
      })));

      const canvas = await html2canvas(el, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#fff",
        logging: false,
        width: 560,
      });

      wrapper.style.cssText = savedStyle;
      el.style.visibility = "";

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a5" });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = (canvas.height * pdfW) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfW, pdfH);
      pdf.save(`BizilCore-ORD-${id.slice(-6).toUpperCase()}.pdf`);
    } catch {
      showToast("error", "PDF তৈরি করা যায়নি।");
    }
    setDownloading(false);
  }

  async function handleShare() {
    const url = `${window.location.origin}/slip/${id}`;
    if (navigator.share) {
      await navigator.share({ title: "অর্ডার স্লিপ", url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url).catch(() => {});
      setShareMsg("লিঙ্ক কপি ✓");
      setTimeout(() => setShareMsg(""), 2500);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64 gap-3">
        <Loader2 size={24} className="animate-spin" style={{ color: S.primary }} />
        <span className="text-sm" style={{ color: S.muted }}>স্লিপ লোড হচ্ছে...</span>
      </div>
    );
  }

  if (!order || !shop) {
    return (
      <div className="text-center py-20">
        <p style={{ color: S.muted }}>অর্ডার পাওয়া যায়নি।</p>
        <Link href="/orders" className="text-sm mt-3 inline-block" style={{ color: S.primary }}>← অর্ডার লিস্টে ফিরুন</Link>
      </div>
    );
  }

  const slipDisplayW = Math.round(560 * displayScale);
  const templateName = TEMPLATES.find(t => t.key === settings.template)?.name ?? "Classic";
  const slipOrderProp = combineOrders && relatedOrders.length > 0 ? { ...order, relatedOrders } : order;
  const isActive = (p: string, a: string) => settings.primaryColor === p && settings.accentColor === a;

  return (
    <>
      {/* Hidden full-size slip for print/PDF — outside any zoom context */}
      <div aria-hidden style={{ position: "fixed", left: "-9999px", top: 0, width: 560, zIndex: -1, pointerEvents: "none" }}>
        <div ref={slipRef}>
          <OrderSlip order={slipOrderProp} shop={shop} settings={settings} />
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-xl max-w-sm"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}>
          {toast.msg}
        </div>
      )}

      {/* ── Page header ── */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <Link href={`/orders/${id}`}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors hover:opacity-80"
            style={{ borderColor: S.border, color: S.muted, backgroundColor: S.surface }}>
            <ChevronLeft size={13} /> ফিরুন
          </Link>
          <div className="h-5 w-px" style={{ backgroundColor: S.border }} />
          <div>
            <h1 className="text-base font-bold leading-tight" style={{ color: S.text }}>অর্ডার স্লিপ</h1>
            <p className="text-xs mt-0.5 font-mono" style={{ color: S.muted }}>ORD-{id.slice(-6).toUpperCase()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all hover:opacity-80"
            style={{ borderColor: S.border, color: S.sub, backgroundColor: S.surface }}>
            <Share2 size={12} /> {shareMsg || "শেয়ার"}
          </button>
          <button onClick={handleDownloadPDF} disabled={downloading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold disabled:opacity-50 transition-all hover:opacity-80"
            style={{ borderColor: S.border, color: S.sub, backgroundColor: S.surface }}>
            {downloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
            {downloading ? "তৈরি হচ্ছে..." : "PDF"}
          </button>
          <button onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-bold shadow-md transition-all hover:opacity-90 active:scale-95"
            style={{ backgroundColor: settings.primaryColor, boxShadow: `0 4px 14px ${settings.primaryColor}55` }}>
            <Printer size={14} /> প্রিন্ট করুন
          </button>
        </div>
      </div>

      {/* ── Two-column layout (responsive) ── */}
      <div className="flex flex-col lg:flex-row gap-6 lg:items-start">

        {/* ═══ LEFT: Preview (sticky on desktop, centered on mobile) ═══ */}
        <div className="mx-auto lg:mx-0 lg:sticky lg:top-6 lg:flex-shrink-0 lg:self-start w-fit">

          {/* Preview label bar */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: settings.primaryColor }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: S.muted }}>লাইভ প্রিভিউ</span>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ backgroundColor: `${settings.primaryColor}15`, color: settings.primaryColor }}>
              {templateName}
            </span>
          </div>

          {/* Slip backdrop */}
          <div style={{
            background: "linear-gradient(135deg, #1a1f2e 0%, #0f1117 100%)",
            borderRadius: 16,
            padding: "20px 18px 24px",
            boxShadow: "0 24px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06)",
            width: slipDisplayW + 36,
          }}>
            {/* Three-dot top bar */}
            <div className="flex items-center gap-1.5 mb-4">
              {["#ff5f57","#febc2e","#28c840"].map(c => (
                <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", backgroundColor: c, opacity: 0.8 }} />
              ))}
              <div className="flex-1 mx-2 h-4 rounded" style={{ backgroundColor: "rgba(255,255,255,0.05)" }} />
            </div>

            {/* Scaled display-only slip (ref is on the hidden full-size div above) */}
            <div style={{ zoom: displayScale, borderRadius: 6, overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.5)" }}>
              <OrderSlip order={slipOrderProp} shop={shop} settings={settings} />
            </div>
          </div>

          {/* Quick info under preview */}
          <div className="mt-3 flex items-center justify-center gap-4 text-xs" style={{ color: S.muted }}>
            {order.customer?.name && <span>👤 {order.customer.name}</span>}
            <span className="font-semibold" style={{ color: order.dueAmount > 0 ? "#DC2626" : "#059669" }}>
              {order.dueAmount > 0 ? `COD ৳${order.dueAmount.toLocaleString("bn-BD")}` : "✓ পরিশোধিত"}
            </span>
          </div>
        </div>

        {/* ═══ RIGHT: Scrollable settings panel ═══ */}
        <div className="flex-1 min-w-0 space-y-3" style={{ paddingBottom: 40 }}>

          {/* ── Template picker ── */}
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="px-5 pt-4 pb-3 border-b flex items-center justify-between" style={{ borderColor: S.border }}>
              <div>
                <h3 className="font-bold text-sm" style={{ color: S.text }}>টেমপ্লেট</h3>
                <p className="text-xs mt-0.5" style={{ color: S.muted }}>ডিজাইন বেছে নিন</p>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ backgroundColor: `${settings.primaryColor}12`, color: settings.primaryColor }}>
                {templateName} সক্রিয়
              </span>
            </div>
            <div className="p-4 grid grid-cols-3 gap-2.5">
              {TEMPLATES.map(t => {
                const active = settings.template === t.key;
                return (
                  <button key={t.key}
                    onClick={() => setSettings(s => ({ ...s, template: t.key }))}
                    className="text-left rounded-xl border-2 overflow-hidden transition-all"
                    style={{
                      borderColor: active ? settings.primaryColor : S.border,
                      boxShadow: active ? `0 0 0 3px ${settings.primaryColor}25` : "none",
                      transform: active ? "scale(1.02)" : "scale(1)",
                    }}>
                    <div style={{ height: 80, backgroundColor: active ? `${settings.primaryColor}08` : "#f8f8f8", position: "relative" }}>
                      <div style={{ position: "absolute", inset: 6 }}>
                        {t.preview(settings.primaryColor)}
                      </div>
                      {active && (
                        <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-white"
                          style={{ backgroundColor: settings.primaryColor }}>
                          <Check size={9} />
                        </div>
                      )}
                    </div>
                    <div className="px-2 py-1.5" style={{ backgroundColor: active ? `${settings.primaryColor}06` : S.surface }}>
                      <p className="text-xs font-bold" style={{ color: active ? settings.primaryColor : S.text }}>{t.name}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── Colors ── */}
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="px-5 pt-4 pb-3 border-b" style={{ borderColor: S.border }}>
              <h3 className="font-bold text-sm" style={{ color: S.text }}>রঙ সেটিংস</h3>
            </div>
            <div className="p-4 space-y-4">

              {/* Built-in presets */}
              <div>
                <p className="text-xs font-semibold mb-2.5 uppercase tracking-wide" style={{ color: S.muted }}>Built-in Presets</p>
                <div className="grid grid-cols-3 gap-2">
                  {COLOR_PRESETS.map(p => {
                    const active = isActive(p.primary, p.accent);
                    return (
                      <button key={p.label}
                        onClick={() => setSettings(s => ({ ...s, primaryColor: p.primary, accentColor: p.accent }))}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-xl border text-xs font-medium transition-all"
                        style={{
                          borderColor: active ? p.primary : S.border,
                          backgroundColor: active ? `${p.primary}10` : S.surface,
                          color: active ? p.primary : S.text,
                          boxShadow: active ? `0 0 0 2px ${p.primary}30` : "none",
                        }}>
                        <span className="flex gap-1 flex-shrink-0">
                          <span style={{ width: 11, height: 11, borderRadius: "50%", backgroundColor: p.primary, display: "block" }} />
                          <span style={{ width: 11, height: 11, borderRadius: "50%", backgroundColor: p.accent, display: "block" }} />
                        </span>
                        <span className="truncate">{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom presets */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: S.muted }}>আমার Presets</p>
                  {!showPresetInput && (
                    <button onClick={() => setShowPresetInput(true)}
                      className="text-xs px-2.5 py-1 rounded-lg border font-semibold"
                      style={{ borderColor: settings.primaryColor, color: settings.primaryColor, backgroundColor: `${settings.primaryColor}08` }}>
                      + যোগ করুন
                    </button>
                  )}
                </div>

                {showPresetInput && (
                  <div className="flex gap-2 mb-2.5 p-3 rounded-xl border" style={{ borderColor: settings.primaryColor, backgroundColor: `${settings.primaryColor}06` }}>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <span style={{ width: 13, height: 13, borderRadius: "50%", backgroundColor: settings.primaryColor, display: "inline-block" }} />
                      <span style={{ width: 13, height: 13, borderRadius: "50%", backgroundColor: settings.accentColor, display: "inline-block" }} />
                    </div>
                    <input
                      type="text" value={presetName} onChange={e => setPresetName(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") addCustomPreset(); if (e.key === "Escape") { setShowPresetInput(false); setPresetName(""); } }}
                      placeholder="নাম লিখুন..."
                      autoFocus
                      className="flex-1 text-xs outline-none bg-transparent"
                      style={{ color: S.text }} />
                    <button onClick={addCustomPreset} disabled={!presetName.trim() || savingPreset}
                      className="text-xs px-2.5 py-1 rounded-lg text-white font-semibold disabled:opacity-50"
                      style={{ backgroundColor: settings.primaryColor }}>
                      {savingPreset ? "..." : "সেভ"}
                    </button>
                    <button onClick={() => { setShowPresetInput(false); setPresetName(""); }}
                      className="text-xs px-2 py-1 rounded-lg opacity-50" style={{ color: S.muted }}>✕</button>
                  </div>
                )}

                {customPresets.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {customPresets.map((p, i) => {
                      const active = isActive(p.primary, p.accent);
                      return (
                        <div key={i} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium"
                          style={{ borderColor: active ? p.primary : S.border, backgroundColor: active ? `${p.primary}10` : S.surface }}>
                          <button onClick={() => setSettings(s => ({ ...s, primaryColor: p.primary, accentColor: p.accent }))} className="flex items-center gap-1.5">
                            <span className="flex gap-1">
                              <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: p.primary, display: "block" }} />
                              <span style={{ width: 10, height: 10, borderRadius: "50%", backgroundColor: p.accent, display: "block" }} />
                            </span>
                            <span style={{ color: S.text }}>{p.name}</span>
                          </button>
                          <button onClick={() => deleteCustomPreset(i)} className="opacity-30 hover:opacity-70 ml-0.5" style={{ color: S.muted }}>✕</button>
                        </div>
                      );
                    })}
                  </div>
                ) : !showPresetInput && (
                  <p className="text-xs italic" style={{ color: S.muted }}>কোনো প্রিসেট নেই। উপরের রং বেছে + যোগ করুন ক্লিক করুন।</p>
                )}
              </div>

              {/* Custom pickers */}
              <div>
                <p className="text-xs font-semibold mb-2.5 uppercase tracking-wide" style={{ color: S.muted }}>কাস্টম রং</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Primary রং", key: "primaryColor" as const },
                    { label: "Accent রং", key: "accentColor" as const },
                  ].map(({ label, key }) => (
                    <div key={key}>
                      <label className="block text-xs mb-1.5 font-medium" style={{ color: S.muted }}>{label}</label>
                      <div className="flex gap-2">
                        <input type="color" value={settings[key]}
                          onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
                          className="h-9 w-11 rounded-lg border cursor-pointer p-0.5" style={{ borderColor: S.border }} />
                        <input type="text" value={settings[key]}
                          onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
                          className="flex-1 h-9 px-2.5 rounded-xl border text-xs font-mono outline-none"
                          style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Visibility toggles ── */}
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="px-5 pt-4 pb-3 border-b" style={{ borderColor: S.border }}>
              <h3 className="font-bold text-sm" style={{ color: S.text }}>কী কী দেখাবে</h3>
            </div>
            <div className="px-5 py-2">
              <Toggle checked={settings.showQR} onChange={v => setSettings(s => ({ ...s, showQR: v }))} label="QR Code" />
              <Toggle checked={settings.showBarcode} onChange={v => setSettings(s => ({ ...s, showBarcode: v }))} label="Barcode" />
              <Toggle checked={settings.showSocialMedia} onChange={v => setSettings(s => ({ ...s, showSocialMedia: v }))} label="Social media links" />
              <Toggle checked={settings.showProductPhotos} onChange={v => setSettings(s => ({ ...s, showProductPhotos: v }))} label="পণ্যের ছবি" />
              {/* Brand badge toggle — Business plan only */}
              <div className="flex items-center justify-between py-2.5 border-t mt-1" style={{ borderColor: S.border }}>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium" style={{ color: canHideBrand ? S.text : S.muted }}>"Powered by BizilCore" লুকান</span>
                    {!canHideBrand && (
                      <Link href="/checkout?plan=business"
                        className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ backgroundColor: "#FFF3DC", color: "#92600A" }}>
                        👑 Business
                      </Link>
                    )}
                  </div>
                  {!canHideBrand && <p className="text-xs mt-0.5" style={{ color: S.muted }}>Business plan এ এটি বন্ধ করা যাবে।</p>}
                </div>
                <Toggle
                  checked={canHideBrand ? settings.hideBrandBadge : false}
                  onChange={v => canHideBrand && setSettings(s => ({ ...s, hideBrandBadge: v }))}
                  label=""
                />
              </div>
            </div>
          </div>

          {/* ── Multi-order ── */}
          {relatedOrders.length > 0 && (
            <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
              <div className="px-5 pt-4 pb-3 border-b flex items-center gap-2" style={{ borderColor: S.border }}>
                <h3 className="font-bold text-sm" style={{ color: S.text }}>একসাথে দেখান</h3>
                <span className="text-xs px-2 py-0.5 rounded-full text-white font-semibold" style={{ backgroundColor: settings.primaryColor }}>
                  {relatedOrders.length + 1}টি
                </span>
              </div>
              <div className="px-5 py-3">
                <p className="text-xs mb-3" style={{ color: S.muted }}>এই গ্রাহকের আরও {relatedOrders.length}টি অর্ডার আছে। সব অর্ডার একসাথে স্লিপে দেখান।</p>
                <Toggle
                  checked={combineOrders}
                  onChange={v => setCombineOrders(v)}
                  label={`সব ${relatedOrders.length + 1}টি অর্ডার একসাথে দেখান`}
                />
                {combineOrders && (
                  <div className="mt-3 rounded-xl p-3 text-xs space-y-1.5" style={{ backgroundColor: `${settings.primaryColor}0a`, border: `1px solid ${settings.primaryColor}20` }}>
                    {[...(order ? [order] : []), ...relatedOrders].map((o, i) => (
                      <div key={i} className="flex justify-between">
                        <span style={{ color: S.muted }} className="font-mono">ORD-{o.id.slice(-6).toUpperCase()}</span>
                        <span style={{ fontWeight: 600, color: S.text }}>৳{o.totalAmount.toLocaleString("bn-BD")}</span>
                      </div>
                    ))}
                    <div className="flex justify-between pt-1.5 mt-1" style={{ borderTop: `1px solid ${settings.primaryColor}20` }}>
                      <span style={{ fontWeight: 700, color: settings.primaryColor }}>মোট COD বাকি</span>
                      <span style={{ fontWeight: 700, color: settings.primaryColor }}>
                        ৳{[...(order ? [order] : []), ...relatedOrders].reduce((s, o) => s + o.dueAmount, 0).toLocaleString("bn-BD")}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Message + Social ── */}
          <div className="rounded-2xl border overflow-hidden" style={{ backgroundColor: S.surface, borderColor: S.border }}>
            <div className="px-5 pt-4 pb-3 border-b" style={{ borderColor: S.border }}>
              <h3 className="font-bold text-sm" style={{ color: S.text }}>বার্তা ও সোশ্যাল মিডিয়া</h3>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: S.muted }}>ধন্যবাদ বার্তা</label>
                <textarea rows={2} value={settings.customMessage}
                  onChange={e => setSettings(s => ({ ...s, customMessage: e.target.value }))}
                  placeholder="ধন্যবাদ আপনার কেনাকাটার জন্য..."
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none resize-none"
                  style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: S.muted }}>Facebook Page</label>
                  <input type="text" value={settings.facebookPage} onChange={e => setSettings(s => ({ ...s, facebookPage: e.target.value }))}
                    placeholder="facebook.com/yourpage"
                    className="w-full h-9 px-3 rounded-xl border text-sm outline-none"
                    style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1.5" style={{ color: S.muted }}>WhatsApp</label>
                  <input type="text" value={settings.whatsapp} onChange={e => setSettings(s => ({ ...s, whatsapp: e.target.value }))}
                    placeholder="01XXXXXXXXX"
                    className="w-full h-9 px-3 rounded-xl border text-sm outline-none"
                    style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }} />
                </div>
              </div>
            </div>
          </div>

          {/* ── Save defaults ── */}
          <div className="rounded-2xl overflow-hidden border"
            style={{ backgroundColor: `${settings.primaryColor}08`, borderColor: `${settings.primaryColor}20` }}>
            <div className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold" style={{ color: S.text }}>ডিজাইন সেভ করুন</p>
                  <p className="text-xs mt-0.5" style={{ color: S.muted }}>পরের বার লগিন করলেও এই ডিজাইন থাকবে।</p>
                </div>
                <button onClick={saveDefaults} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-bold flex-shrink-0 disabled:opacity-60 transition-all active:scale-95"
                  style={{ backgroundColor: settings.primaryColor, boxShadow: `0 4px 14px ${settings.primaryColor}50` }}>
                  {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <Check size={14} /> : <Save size={14} />}
                  {saving ? "সেভ হচ্ছে..." : saved ? "সেভ হয়েছে ✓" : "সেভ করুন"}
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
