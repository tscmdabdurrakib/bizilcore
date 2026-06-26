"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCart } from "@/lib/store/cart";
import { Package, RotateCcw, Repeat, Heart } from "lucide-react";

export default function CustomerAccountPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const addItem = useCart(s => s.addItem);
  const [orders, setOrders] = useState<Array<{ id: string; orderNumber: string; totalAmount: number; status: string; createdAt: string; items: Array<{ productName: string; quantity: number; unitPrice: number; productId: string | null; variantId: string | null }> }>>([]);
  const [customer, setCustomer] = useState<{ loyaltyPoints: number; walletBalance: number; referralCode: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/store/customer/orders?slug=${slug}`)
      .then(r => r.json())
      .then(d => { setOrders(d.orders ?? []); setCustomer(d.customer ?? null); })
      .finally(() => setLoading(false));
  }, [slug]);

  function reorder(order: typeof orders[0]) {
    for (const item of order.items) {
      if (!item.productId) continue;
      addItem({
        itemType: "product",
        productId: item.productId,
        productName: item.productName,
        productImage: null,
        variantId: item.variantId,
        variantName: null,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
      }, slug);
    }
  }

  if (loading) return <div className="p-10 text-center text-gray-500">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-black mb-6">My Account</h1>

      {customer && (
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="border rounded-2xl p-4"><p className="text-xs text-gray-500">Loyalty Points</p><p className="text-2xl font-bold">{customer.loyaltyPoints}</p></div>
          <div className="border rounded-2xl p-4"><p className="text-xs text-gray-500">Wallet Balance</p><p className="text-2xl font-bold">৳{customer.walletBalance}</p></div>
        </div>
      )}

      <div className="flex gap-3 mb-6 flex-wrap">
        <Link href={`/store/${slug}/wishlist`} className="flex items-center gap-2 px-4 py-2 border rounded-full text-sm"><Heart size={14} /> Wishlist</Link>
        <Link href={`/store/${slug}/account/returns`} className="flex items-center gap-2 px-4 py-2 border rounded-full text-sm"><RotateCcw size={14} /> Returns</Link>
        <Link href={`/store/${slug}/account/subscriptions`} className="flex items-center gap-2 px-4 py-2 border rounded-full text-sm"><Repeat size={14} /> Subscriptions</Link>
      </div>

      <h2 className="font-bold mb-4 flex items-center gap-2"><Package size={16} /> Order History</h2>
      {orders.length === 0 ? (
        <p className="text-gray-500 text-sm">No orders yet. <Link href={`/store/${slug}/products`} className="underline">Start shopping</Link></p>
      ) : orders.map(o => (
        <div key={o.id} className="border rounded-2xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-semibold">#{o.orderNumber}</p>
              <p className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleString()} — {o.status}</p>
            </div>
            <p className="font-bold">৳{o.totalAmount.toLocaleString()}</p>
          </div>
          <ul className="text-sm text-gray-600 mb-3">{o.items.map((i, idx) => <li key={idx}>{i.productName} × {i.quantity}</li>)}</ul>
          <div className="flex gap-2">
            <button onClick={() => reorder(o)} className="px-4 py-2 bg-black text-white text-xs rounded-full">Reorder</button>
            <Link href={`/store/${slug}/track?order=${o.orderNumber}`} className="px-4 py-2 border text-xs rounded-full">Track</Link>
          </div>
        </div>
      ))}
    </div>
  );
}
