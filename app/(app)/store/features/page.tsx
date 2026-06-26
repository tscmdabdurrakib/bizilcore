"use client";

import { useEffect, useState } from "react";
import { PageShell, Card, Button, Input, SectionTitle } from "@/components/ui";

type Tab = "loyalty" | "flash" | "gift" | "affiliate" | "campaigns" | "returns" | "funnel" | "vendors" | "live" | "marketing" | "easy" | "utm" | "import" | "qa";

export default function StoreFeaturesPage() {
  const [tab, setTab] = useState<Tab>("loyalty");
  const [toast, setToast] = useState("");
  const [loyalty, setLoyalty] = useState({ storeLoyaltyEnabled: false, storeLoyaltyEarnRate: 1, storeLoyaltyRedeemRate: 0.5 });
  const [flashSales, setFlashSales] = useState<Array<{ id: string; name: string; startAt: string; endAt: string }>>([]);
  const [giftCards, setGiftCards] = useState<Array<{ id: string; code: string; balance: number }>>([]);
  const [affiliates, setAffiliates] = useState<Array<{ id: string; name: string; code: string; totalEarnings: number }>>([]);
  const [campaigns, setCampaigns] = useState<Array<{ id: string; name: string; type: string; status: string; sentCount: number }>>([]);
  const [returns, setReturns] = useState<Array<{ id: string; reason: string; status: string; storeOrder: { orderNumber: string } }>>([]);
  const [funnel, setFunnel] = useState<{ funnel: Record<string, number>; conversionRate: number } | null>(null);
  const [vendors, setVendors] = useState<Array<{ id: string; name: string; email: string; _count: { products: number } }>>([]);
  const [liveSessions, setLiveSessions] = useState<Array<{ id: string; title: string; status: string; startAt: string }>>([]);

  const [flashForm, setFlashForm] = useState({ name: "", startAt: "", endAt: "", productId: "", salePrice: "" });
  const [giftForm, setGiftForm] = useState({ balance: "500" });
  const [affForm, setAffForm] = useState({ name: "", code: "", commissionRate: "5" });
  const [campForm, setCampForm] = useState({ name: "", type: "sms", body: "" });
  const [vendorForm, setVendorForm] = useState({ name: "", email: "", commissionRate: "10" });
  const [liveForm, setLiveForm] = useState({ title: "", streamUrl: "", startAt: "" });
  const [marketing, setMarketing] = useState({
    storeFbPixelId: "", storeGoogleAnalyticsId: "", storeTiktokPixelId: "",
    storeSslcommerzEnabled: false, storeSslcommerzStoreId: "", storeSslcommerzStorePass: "",
    storePwaEnabled: false, storeAnnouncementBar: "", storeAnnouncementEndsAt: "",
  });
  const [easySettings, setEasySettings] = useState({
    storePickupEnabled: false, storePickupAddress: "",
    storeSocialProofEnabled: false, storeExitPopupEnabled: false, storeExitPopupCoupon: "",
    storeCheckoutOtpEnabled: true, deliverySlots: [] as Array<{ label: string; value: string }>,
  });
  const [utmReport, setUtmReport] = useState<{ bySource: Array<{ source: string; orders: number; revenue: number }>; byCampaign: Array<{ campaign: string; orders: number; revenue: number }>; totalRevenue: number } | null>(null);
  const [csvText, setCsvText] = useState("name,price,stock,category\nSample Product,500,10,Electronics");
  const [productQuestions, setProductQuestions] = useState<Array<{ id: string; question: string; answer: string | null; product: { name: string } }>>([]);

  function show(msg: string) { setToast(msg); setTimeout(() => setToast(""), 3000); }

  useEffect(() => {
    fetch("/api/store/loyalty").then(r => r.json()).then(setLoyalty).catch(() => {});
    fetch("/api/store/flash-sales/manage").then(r => r.json()).then(setFlashSales).catch(() => {});
    fetch("/api/store/gift-cards").then(r => r.json()).then(setGiftCards).catch(() => {});
    fetch("/api/store/affiliate").then(r => r.json()).then(setAffiliates).catch(() => {});
    fetch("/api/store/campaigns").then(r => r.json()).then(setCampaigns).catch(() => {});
    fetch("/api/store/returns/manage").then(r => r.json()).then(setReturns).catch(() => {});
    fetch("/api/store/funnel/analytics").then(r => r.json()).then(setFunnel).catch(() => {});
    fetch("/api/store/vendors").then(r => r.json()).then(setVendors).catch(() => {});
    fetch("/api/store/live").then(r => r.json()).then(setLiveSessions).catch(() => {});
    fetch("/api/store/marketing-settings").then(r => r.json()).then(d => setMarketing(m => ({ ...m, ...d, storeAnnouncementEndsAt: d.storeAnnouncementEndsAt ? d.storeAnnouncementEndsAt.slice(0, 16) : "" }))).catch(() => {});
    fetch("/api/store/easy-settings").then(r => r.json()).then(d => setEasySettings(s => ({ ...s, ...d, deliverySlots: d.deliverySlots ?? [] }))).catch(() => {});
    fetch("/api/store/utm-report").then(r => r.json()).then(setUtmReport).catch(() => {});
    fetch("/api/store/product-questions?manage=1").then(r => r.json()).then(setProductQuestions).catch(() => {});
  }, []);

  async function saveLoyalty() {
    await fetch("/api/store/loyalty", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(loyalty) });
    show("Loyalty settings saved");
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "loyalty", label: "Loyalty" },
    { id: "flash", label: "Flash Sales" },
    { id: "gift", label: "Gift Cards" },
    { id: "affiliate", label: "Affiliates" },
    { id: "campaigns", label: "Campaigns" },
    { id: "returns", label: "Returns" },
    { id: "funnel", label: "Funnel" },
    { id: "vendors", label: "Vendors" },
    { id: "live", label: "Live Commerce" },
    { id: "marketing", label: "Marketing & PWA" },
    { id: "easy", label: "Easy UX" },
    { id: "utm", label: "UTM Report" },
    { id: "import", label: "CSV Import" },
    { id: "qa", label: "Product Q&A" },
  ];

  return (
    <PageShell title="Store Features" subtitle="Advanced F-Commerce tools">
      {toast && <div className="mb-4 p-3 rounded-xl bg-green-50 text-green-700 text-sm">{toast}</div>}
      <div className="flex gap-2 flex-wrap mb-6">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium border ${tab === t.id ? "bg-black text-white border-black" : "border-gray-200"}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "loyalty" && (
        <Card className="p-6 space-y-4 max-w-xl">
          <SectionTitle title="Loyalty Program" />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={loyalty.storeLoyaltyEnabled} onChange={e => setLoyalty(l => ({ ...l, storeLoyaltyEnabled: e.target.checked }))} />
            Enable loyalty points
          </label>
          <Input label="Earn rate (points per 100 tk)" value={String(loyalty.storeLoyaltyEarnRate)} onChange={e => setLoyalty(l => ({ ...l, storeLoyaltyEarnRate: parseFloat(e.target.value) || 0 }))} />
          <Input label="Redeem rate (tk per point)" value={String(loyalty.storeLoyaltyRedeemRate)} onChange={e => setLoyalty(l => ({ ...l, storeLoyaltyRedeemRate: parseFloat(e.target.value) || 0 }))} />
          <Button onClick={saveLoyalty}>Save</Button>
        </Card>
      )}

      {tab === "flash" && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-3">
            <SectionTitle title="Create Flash Sale" />
            <Input label="Name" value={flashForm.name} onChange={e => setFlashForm(f => ({ ...f, name: e.target.value }))} />
            <Input label="Start" type="datetime-local" value={flashForm.startAt} onChange={e => setFlashForm(f => ({ ...f, startAt: e.target.value }))} />
            <Input label="End" type="datetime-local" value={flashForm.endAt} onChange={e => setFlashForm(f => ({ ...f, endAt: e.target.value }))} />
            <Input label="Product ID" value={flashForm.productId} onChange={e => setFlashForm(f => ({ ...f, productId: e.target.value }))} />
            <Input label="Sale Price" value={flashForm.salePrice} onChange={e => setFlashForm(f => ({ ...f, salePrice: e.target.value }))} />
            <Button onClick={async () => {
              const r = await fetch("/api/store/flash-sales/manage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: flashForm.name, startAt: flashForm.startAt, endAt: flashForm.endAt, products: [{ productId: flashForm.productId, salePrice: flashForm.salePrice }] }) });
              if (r.ok) { show("Flash sale created"); const d = await fetch("/api/store/flash-sales/manage").then(x => x.json()); setFlashSales(d); }
            }}>Create</Button>
          </Card>
          <Card className="p-6">
            <SectionTitle title="Active Flash Sales" />
            <div className="space-y-2">{flashSales.map(s => <div key={s.id} className="text-sm border rounded-xl p-3">{s.name} — {new Date(s.startAt).toLocaleDateString()}</div>)}</div>
          </Card>
        </div>
      )}

      {tab === "gift" && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-3 max-w-md">
            <SectionTitle title="Issue Gift Card" />
            <Input label="Balance (tk)" value={giftForm.balance} onChange={e => setGiftForm({ balance: e.target.value })} />
            <Button onClick={async () => {
              const r = await fetch("/api/store/gift-cards", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ balance: giftForm.balance }) });
              if (r.ok) { const card = await r.json(); show(`Created ${card.code}`); setGiftCards(g => [card, ...g]); }
            }}>Create Gift Card</Button>
          </Card>
          <Card className="p-6"><SectionTitle title="Gift Cards" />{giftCards.map(c => <div key={c.id} className="text-sm border rounded-xl p-3 mb-2">{c.code} — ৳{c.balance}</div>)}</Card>
        </div>
      )}

      {tab === "affiliate" && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-3 max-w-md">
            <SectionTitle title="Add Affiliate" />
            <Input label="Name" value={affForm.name} onChange={e => setAffForm(f => ({ ...f, name: e.target.value }))} />
            <Input label="Code" value={affForm.code} onChange={e => setAffForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
            <Input label="Commission %" value={affForm.commissionRate} onChange={e => setAffForm(f => ({ ...f, commissionRate: e.target.value }))} />
            <Button onClick={async () => {
              const r = await fetch("/api/store/affiliate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(affForm) });
              if (r.ok) { show("Affiliate added"); setAffiliates(await fetch("/api/store/affiliate").then(x => x.json())); }
            }}>Add</Button>
          </Card>
          <Card className="p-6">{affiliates.map(a => <div key={a.id} className="text-sm border rounded-xl p-3 mb-2">{a.name} ({a.code}) — ৳{a.totalEarnings}</div>)}</Card>
        </div>
      )}

      {tab === "campaigns" && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-3 max-w-md">
            <SectionTitle title="SMS Campaign" />
            <Input label="Name" value={campForm.name} onChange={e => setCampForm(f => ({ ...f, name: e.target.value }))} />
            <textarea className="w-full border rounded-xl p-3 text-sm" rows={4} value={campForm.body} onChange={e => setCampForm(f => ({ ...f, body: e.target.value }))} />
            <Button onClick={async () => {
              await fetch("/api/store/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...campForm, sendNow: true }) });
              show("Campaign sent"); setCampaigns(await fetch("/api/store/campaigns").then(x => x.json()));
            }}>Send Now</Button>
          </Card>
          <Card className="p-6">{campaigns.map(c => <div key={c.id} className="text-sm border rounded-xl p-3 mb-2">{c.name} — {c.status} ({c.sentCount} sent)</div>)}</Card>
        </div>
      )}

      {tab === "returns" && (
        <Card className="p-6">{returns.map(r => (
          <div key={r.id} className="border rounded-xl p-4 mb-3 flex items-center justify-between gap-4">
            <div><p className="font-semibold text-sm">#{r.storeOrder.orderNumber}</p><p className="text-xs text-gray-500">{r.reason}</p></div>
            <div className="flex gap-2">
              <Button size="sm" onClick={async () => { await fetch("/api/store/returns/manage", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id, status: "approved", restock: true }) }); setReturns(await fetch("/api/store/returns/manage").then(x => x.json())); }}>Approve</Button>
              <Button size="sm" variant="outline" onClick={async () => { await fetch("/api/store/returns/manage", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: r.id, status: "rejected" }) }); setReturns(await fetch("/api/store/returns/manage").then(x => x.json())); }}>Reject</Button>
            </div>
          </div>
        ))}</Card>
      )}

      {tab === "funnel" && funnel && (
        <Card className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(funnel.funnel).map(([k, v]) => <div key={k} className="border rounded-xl p-4"><p className="text-xs text-gray-500">{k}</p><p className="text-2xl font-bold">{v}</p></div>)}
          <div className="border rounded-xl p-4 col-span-full"><p className="text-xs text-gray-500">Conversion Rate</p><p className="text-2xl font-bold">{funnel.conversionRate}%</p></div>
        </Card>
      )}

      {tab === "vendors" && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-3 max-w-md">
            <SectionTitle title="Add Vendor" />
            <Input label="Name" value={vendorForm.name} onChange={e => setVendorForm(f => ({ ...f, name: e.target.value }))} />
            <Input label="Email" value={vendorForm.email} onChange={e => setVendorForm(f => ({ ...f, email: e.target.value }))} />
            <Button onClick={async () => { await fetch("/api/store/vendors", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(vendorForm) }); show("Vendor added"); setVendors(await fetch("/api/store/vendors").then(x => x.json())); }}>Add Vendor</Button>
          </Card>
          <Card className="p-6">{vendors.map(v => <div key={v.id} className="text-sm border rounded-xl p-3 mb-2">{v.name} — {v._count.products} products</div>)}</Card>
        </div>
      )}

      {tab === "live" && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-3 max-w-md">
            <SectionTitle title="Schedule Live Session" />
            <Input label="Title" value={liveForm.title} onChange={e => setLiveForm(f => ({ ...f, title: e.target.value }))} />
            <Input label="Stream URL" value={liveForm.streamUrl} onChange={e => setLiveForm(f => ({ ...f, streamUrl: e.target.value }))} />
            <Input label="Start" type="datetime-local" value={liveForm.startAt} onChange={e => setLiveForm(f => ({ ...f, startAt: e.target.value }))} />
            <Button onClick={async () => { await fetch("/api/store/live", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(liveForm) }); show("Live session scheduled"); setLiveSessions(await fetch("/api/store/live").then(x => x.json())); }}>Schedule</Button>
          </Card>
          <Card className="p-6">{liveSessions.map(s => <div key={s.id} className="text-sm border rounded-xl p-3 mb-2">{s.title} — {s.status}</div>)}</Card>
        </div>
      )}

      {tab === "marketing" && (
        <Card className="p-6 space-y-4 max-w-xl">
          <SectionTitle title="Pixels, SSLCommerz & PWA" />
          <Input label="Facebook Pixel ID" value={marketing.storeFbPixelId ?? ""} onChange={e => setMarketing(m => ({ ...m, storeFbPixelId: e.target.value }))} />
          <Input label="Google Analytics ID" value={marketing.storeGoogleAnalyticsId ?? ""} onChange={e => setMarketing(m => ({ ...m, storeGoogleAnalyticsId: e.target.value }))} />
          <Input label="TikTok Pixel ID" value={marketing.storeTiktokPixelId ?? ""} onChange={e => setMarketing(m => ({ ...m, storeTiktokPixelId: e.target.value }))} />
          <Input label="Announcement Bar" value={marketing.storeAnnouncementBar ?? ""} onChange={e => setMarketing(m => ({ ...m, storeAnnouncementBar: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={marketing.storeSslcommerzEnabled} onChange={e => setMarketing(m => ({ ...m, storeSslcommerzEnabled: e.target.checked }))} /> SSLCommerz enabled</label>
          <Input label="SSLCommerz Store ID" value={marketing.storeSslcommerzStoreId ?? ""} onChange={e => setMarketing(m => ({ ...m, storeSslcommerzStoreId: e.target.value }))} />
          <Input label="SSLCommerz Store Password" value={marketing.storeSslcommerzStorePass ?? ""} onChange={e => setMarketing(m => ({ ...m, storeSslcommerzStorePass: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={marketing.storePwaEnabled} onChange={e => setMarketing(m => ({ ...m, storePwaEnabled: e.target.checked }))} /> PWA installable store</label>
          <Button onClick={async () => { await fetch("/api/store/marketing-settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(marketing) }); show("Marketing settings saved"); }}>Save</Button>
        </Card>
      )}

      {tab === "easy" && (
        <Card className="p-6 space-y-4 max-w-xl">
          <SectionTitle title="Customer Easy Features" />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={easySettings.storePickupEnabled} onChange={e => setEasySettings(s => ({ ...s, storePickupEnabled: e.target.checked }))} /> BOPIS — Pickup in store</label>
          <Input label="Pickup address" value={easySettings.storePickupAddress} onChange={e => setEasySettings(s => ({ ...s, storePickupAddress: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={easySettings.storeCheckoutOtpEnabled} onChange={e => setEasySettings(s => ({ ...s, storeCheckoutOtpEnabled: e.target.checked }))} /> Guest checkout OTP</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={easySettings.storeSocialProofEnabled} onChange={e => setEasySettings(s => ({ ...s, storeSocialProofEnabled: e.target.checked }))} /> Social proof badges</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={easySettings.storeExitPopupEnabled} onChange={e => setEasySettings(s => ({ ...s, storeExitPopupEnabled: e.target.checked }))} /> Exit-intent popup</label>
          <Input label="Exit popup coupon code" value={easySettings.storeExitPopupCoupon ?? ""} onChange={e => setEasySettings(s => ({ ...s, storeExitPopupCoupon: e.target.value }))} />
          <Input label="Delivery slots (JSON)" value={JSON.stringify(easySettings.deliverySlots)} onChange={e => { try { setEasySettings(s => ({ ...s, deliverySlots: JSON.parse(e.target.value) })); } catch { /* */ } }} />
          <Button onClick={async () => { await fetch("/api/store/easy-settings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(easySettings) }); show("Easy settings saved"); }}>Save</Button>
        </Card>
      )}

      {tab === "utm" && utmReport && (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-6">
            <SectionTitle title="By UTM Source" />
            {utmReport.bySource.map(s => <div key={s.source} className="text-sm border rounded-xl p-3 mb-2 flex justify-between"><span>{s.source}</span><span>{s.orders} orders · ৳{s.revenue.toLocaleString()}</span></div>)}
          </Card>
          <Card className="p-6">
            <SectionTitle title="By Campaign" />
            {utmReport.byCampaign.map(c => <div key={c.campaign} className="text-sm border rounded-xl p-3 mb-2 flex justify-between"><span>{c.campaign}</span><span>{c.orders} orders · ৳{c.revenue.toLocaleString()}</span></div>)}
            <p className="text-sm font-bold mt-4">Total revenue: ৳{utmReport.totalRevenue.toLocaleString()}</p>
          </Card>
        </div>
      )}

      {tab === "import" && (
        <Card className="p-6 space-y-4 max-w-2xl">
          <SectionTitle title="CSV Product Import" />
          <p className="text-xs text-gray-500">Columns: name, price, stock (optional), category (optional)</p>
          <textarea className="w-full border rounded-xl p-3 text-sm font-mono" rows={8} value={csvText} onChange={e => setCsvText(e.target.value)} />
          <Button onClick={async () => {
            const r = await fetch("/api/products/import-csv", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ csv: csvText }) });
            const d = await r.json();
            if (r.ok) show(`Imported ${d.created} products`);
            else show(d.error || "Import failed");
          }}>Import Products</Button>
        </Card>
      )}

      {tab === "qa" && (
        <Card className="p-6 space-y-3">
          <SectionTitle title="Product Q&A" />
          {productQuestions.map(q => (
            <div key={q.id} className="border rounded-xl p-4">
              <p className="text-sm font-semibold">{q.product.name}: {q.question}</p>
              {q.answer ? <p className="text-xs text-gray-600 mt-1">{q.answer}</p> : (
                <div className="flex gap-2 mt-2">
                  <Input label="" placeholder="Answer..." onKeyDown={async e => {
                    if (e.key === "Enter") {
                      const answer = (e.target as HTMLInputElement).value;
                      await fetch("/api/store/product-questions", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: q.id, answer, isApproved: true }) });
                      setProductQuestions(await fetch("/api/store/product-questions?manage=1").then(x => x.json()));
                    }
                  }} />
                </div>
              )}
            </div>
          ))}
        </Card>
      )}
    </PageShell>
  );
}
