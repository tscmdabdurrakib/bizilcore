"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function SubscriptionsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [subs, setSubs] = useState<Array<{ id: string; productId: string; frequency: string; status: string; nextDeliveryAt: string }>>([]);

  useEffect(() => {
    fetch("/api/store/subscriptions").then(r => r.json()).then(d => setSubs(d.subscriptions ?? []));
  }, []);

  async function cancel(id: string) {
    await fetch("/api/store/subscriptions", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "cancelled" }) });
    setSubs(await fetch("/api/store/subscriptions").then(r => r.json()).then(d => d.subscriptions ?? []));
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link href={`/store/${slug}/account`} className="text-sm text-gray-500 mb-4 inline-block">← Back to account</Link>
      <h1 className="text-2xl font-black mb-6">Subscription Boxes</h1>
      {subs.length === 0 ? <p className="text-gray-500 text-sm">No active subscriptions.</p> : subs.map(s => (
        <div key={s.id} className="border rounded-xl p-4 mb-3 flex justify-between items-center">
          <div><p className="font-semibold text-sm">{s.frequency} delivery</p><p className="text-xs text-gray-500">Next: {new Date(s.nextDeliveryAt).toLocaleDateString()} — {s.status}</p></div>
          {s.status === "active" && <button onClick={() => cancel(s.id)} className="text-xs border px-3 py-1 rounded-full">Cancel</button>}
        </div>
      ))}
    </div>
  );
}
