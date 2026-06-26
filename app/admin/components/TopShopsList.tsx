import AdminCard from "./AdminCard";
import { TopShop } from "./constants";

interface Props {
  shops: TopShop[];
}

export default function TopShopsList({ shops }: Props) {
  const maxOrders = shops.length > 0 ? Math.max(...shops.map((s) => s.orderCount), 1) : 1;

  return (
    <AdminCard title="Top Shops by Orders" subtitle="Highest order volume">
      {shops.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">কোনো shop নেই</p>
      ) : (
        <ul className="space-y-4">
          {shops.map((shop, i) => (
            <li key={shop.id}>
              <div className="mb-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                    {i + 1}
                  </span>
                  <span className="text-sm font-medium text-gray-900">{shop.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-700">{shop.orderCount} orders</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${(shop.orderCount / maxOrders) * 100}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </AdminCard>
  );
}
