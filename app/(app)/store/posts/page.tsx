"use client";

import { useEffect, useState } from "react";
import { Loader2, Sparkles, Send, Trash2, Calendar, Facebook, Instagram, CheckCircle2, XCircle, Clock } from "lucide-react";
import { PageShell, Card, Badge, Button, Input, EmptyState, SectionTitle } from "@/components/ui";

interface Product { id: string; name: string; sellPrice: number; imageUrl: string | null; }
interface ScheduledPost {
  id: string;
  platform: string;
  caption: string;
  imageUrls: string[];
  scheduledAt: string;
  status: string;
  postId: string | null;
  error: string | null;
  publishedAt: string | null;
}

const STATUS: Record<string, { label: string; variant: "warning" | "success" | "danger" | "default"; Icon: React.ElementType }> = {
  scheduled: { label: "নির্ধারিত", variant: "warning", Icon: Clock },
  published: { label: "প্রকাশিত", variant: "success", Icon: CheckCircle2 },
  failed:    { label: "ব্যর্থ", variant: "danger", Icon: XCircle },
  cancelled: { label: "বাতিল", variant: "default", Icon: XCircle },
};

function defaultSchedule() {
  const d = new Date(Date.now() + 60 * 60 * 1000);
  d.setMinutes(0, 0, 0);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
}

export default function StorePostsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState<"facebook" | "instagram">("facebook");
  const [productId, setProductId] = useState("");
  const [caption, setCaption] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [scheduledAt, setScheduledAt] = useState(defaultSchedule());
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  async function loadPosts() {
    const r = await fetch("/api/store/posts");
    if (r.ok) setPosts(await r.json());
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/products").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/store/posts").then((r) => (r.ok ? r.json() : [])),
    ]).then(([p, ps]) => {
      setProducts(Array.isArray(p) ? p : []);
      setPosts(Array.isArray(ps) ? ps : []);
      setLoading(false);
    });
  }, []);

  function onSelectProduct(id: string) {
    setProductId(id);
    const p = products.find((x) => x.id === id);
    if (p?.imageUrl) setImageUrl(p.imageUrl);
  }

  async function genCaption() {
    if (!productId && !caption) {
      showToast("error", "একটি পণ্য বেছে নিন");
      return;
    }
    setGenerating(true);
    const r = await fetch("/api/store/posts/caption", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId: productId || undefined }),
    });
    const d = await r.json();
    setGenerating(false);
    if (r.ok && d.caption) setCaption(d.caption);
    else showToast("error", d.error ?? "ক্যাপশন তৈরি করা যায়নি");
  }

  async function schedule() {
    if (!caption.trim()) { showToast("error", "ক্যাপশন লিখুন"); return; }
    setSaving(true);
    const r = await fetch("/api/store/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        platform,
        productId: productId || undefined,
        caption,
        imageUrls: imageUrl ? [imageUrl] : [],
        scheduledAt: new Date(scheduledAt).toISOString(),
      }),
    });
    const d = await r.json();
    setSaving(false);
    if (r.ok) {
      showToast("success", "পোস্ট নির্ধারিত হয়েছে ✓");
      setCaption(""); setProductId(""); setImageUrl(""); setScheduledAt(defaultSchedule());
      loadPosts();
    } else {
      showToast("error", d.error ?? "নির্ধারণ করা যায়নি");
    }
  }

  async function remove(id: string) {
    const r = await fetch(`/api/store/posts/${id}`, { method: "DELETE" });
    if (r.ok) { loadPosts(); showToast("success", "মুছে ফেলা হয়েছে"); }
  }

  return (
    <PageShell
      title="সোশ্যাল পোস্ট শিডিউলার"
      subtitle="পণ্য পোস্ট আগেভাগে তৈরি করুন, AI ক্যাপশন নিন, সময়মতো অটো-পাবলিশ হবে।"
      className="max-w-5xl"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="space-y-3">
          <SectionTitle title="নতুন পোস্ট" className="mb-0" />

          <div className="flex gap-2">
            <Button
              variant={platform === "facebook" ? "secondary" : "outline"}
              size="sm"
              icon={Facebook}
              className="flex-1"
              onClick={() => setPlatform("facebook")}
            >
              Facebook
            </Button>
            <Button
              variant={platform === "instagram" ? "secondary" : "outline"}
              size="sm"
              icon={Instagram}
              className="flex-1"
              onClick={() => setPlatform("instagram")}
            >
              Instagram
            </Button>
          </div>
          {platform === "instagram" && (
            <p className="text-[11px]" style={{ color: "#9A3412" }}>Instagram অটো-পাবলিশ শীঘ্রই আসছে (Meta অ্যাপ রিভিউ প্রয়োজন)। আপাতত Facebook ব্যবহার করুন।</p>
          )}

          <div>
            <label className="text-xs font-semibold mb-1 block uppercase tracking-wide" style={{ color: "var(--c-text-muted)" }}>পণ্য (ঐচ্ছিক)</label>
            <select value={productId} onChange={(e) => onSelectProduct(e.target.value)}
              className="w-full border rounded-xl px-3 py-2.5 text-sm" style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text)" }}>
              <option value="">— পণ্য বেছে নিন —</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} (৳{p.sellPrice})</option>)}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--c-text-muted)" }}>ক্যাপশন</label>
              <Button variant="ghost" size="sm" icon={generating ? Loader2 : Sparkles} onClick={genCaption} disabled={generating}>
                AI ক্যাপশন
              </Button>
            </div>
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={6}
              placeholder="পোস্টের লেখা..." className="w-full border rounded-xl px-3 py-2.5 text-sm resize-none focus:ring-2 focus:ring-[var(--c-primary)]/20 focus:border-[var(--c-primary)] outline-none"
              style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-bg)", color: "var(--c-text)" }} />
          </div>

          <Input
            label="ছবির URL (ঐচ্ছিক)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
          />

          <Input
            label="সময়"
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />

          <Button onClick={schedule} disabled={saving} loading={saving} icon={Calendar} className="w-full">
            শিডিউল করুন
          </Button>
        </Card>

        <div>
          <SectionTitle title="নির্ধারিত ও প্রকাশিত পোস্ট" />
          {loading ? (
            <div className="flex items-center justify-center py-16"><Loader2 className="animate-spin" style={{ color: "var(--c-text-muted)" }} /></div>
          ) : posts.length === 0 ? (
            <EmptyState icon={Send} title="এখনো কোনো পোস্ট নেই।" />
          ) : (
            <div className="space-y-2.5">
              {posts.map((p) => {
                const st = STATUS[p.status] ?? STATUS.scheduled;
                const { Icon } = st;
                return (
                  <Card key={p.id} padding="sm">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        {p.platform === "instagram" ? <Instagram size={14} style={{ color: "#E1306C" }} /> : <Facebook size={14} style={{ color: "#1877F2" }} />}
                        <Badge variant={st.variant}><Icon size={11} className="inline mr-0.5" />{st.label}</Badge>
                      </div>
                      {(p.status === "scheduled" || p.status === "failed" || p.status === "cancelled") && (
                        <button onClick={() => remove(p.id)} className="p-1 rounded-lg hover:bg-red-50" title="মুছুন">
                          <Trash2 size={14} style={{ color: "#E24B4A" }} />
                        </button>
                      )}
                    </div>
                    <p className="text-sm mt-2 whitespace-pre-wrap line-clamp-3" style={{ color: "var(--c-text)" }}>{p.caption}</p>
                    <p className="text-[11px] mt-1.5" style={{ color: "var(--c-text-muted)" }}>
                      {new Date(p.scheduledAt).toLocaleString("bn-BD")}
                    </p>
                    {p.error && <p className="text-[11px] mt-1" style={{ color: "#E24B4A" }}>{p.error}</p>}
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl text-sm font-medium text-white shadow-lg z-50"
          style={{ backgroundColor: toast.type === "success" ? "#0F6E56" : "#E24B4A" }}>
          {toast.msg}
        </div>
      )}
    </PageShell>
  );
}
