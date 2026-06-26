"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function CustomerReturnsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [returns, setReturns] = useState<Array<{ id: string; reason: string; status: string; storeOrder: { orderNumber: string } }>>([]);
  const [form, setForm] = useState({ orderNumber: "", reason: "" });
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch(`/api/store/returns?slug=${slug}`).then(r => r.json()).then(d => setReturns(d.returns ?? []));
  }, [slug]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/store/returns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, orderNumber: form.orderNumber, reason: form.reason, items: [{ productName: "Order items", quantity: 1, unitPrice: 0 }] }),
    });
    const d = await r.json();
    setMsg(r.ok ? "Return request submitted" : d.error);
    if (r.ok) setReturns(await fetch(`/api/store/returns?slug=${slug}`).then(x => x.json()).then(x => x.returns));
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href={`/store/${slug}/account`} className="text-sm text-gray-500 mb-4 inline-block">← Back to account</Link>
      <h1 className="text-2xl font-black mb-6">Return Requests</h1>
      <form onSubmit={submit} className="border rounded-2xl p-4 mb-8 space-y-3">
        <input required placeholder="Order number" value={form.orderNumber} onChange={e => setForm(f => ({ ...f, orderNumber: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-sm" />
        <textarea required placeholder="Reason for return" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className="w-full border rounded-xl px-3 py-2 text-sm" rows={3} />
        <button className="px-5 py-2 bg-black text-white text-sm rounded-full">Submit Return</button>
        {msg && <p className="text-sm text-green-600">{msg}</p>}
      </form>
      {returns.map(r => (
        <div key={r.id} className="border rounded-xl p-4 mb-3">
          <p className="font-semibold text-sm">#{r.storeOrder.orderNumber}</p>
          <p className="text-xs text-gray-500">{r.reason} — {r.status}</p>
        </div>
      ))}
    </div>
  );
}
