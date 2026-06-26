"use client";

import Link from "next/link";
import { Package, ShoppingCart } from "lucide-react";
import { useCart } from "@/lib/store/cart";

export interface StoreCombo {
  id: string;
  name: string;
  description: string | null;
  sellPrice: number;
  imageUrl: string | null;
  originalPrice: number;
  savings: number;
  availableStock: number;
}

interface Props {
  combo: StoreCombo;
  slug: string;
}

export function ComboCard({ combo, slug }: Props) {
  const addItem = useCart((s) => s.addItem);
  const inStock = combo.availableStock > 0;

  function handleAdd() {
    addItem(
      {
        itemType: "combo",
        productId: combo.id,
        comboId: combo.id,
        productName: combo.name,
        productImage: combo.imageUrl,
        variantId: null,
        variantName: null,
        unitPrice: combo.sellPrice,
        quantity: 1,
      },
      slug,
    );
  }

  return (
    <div className="flex-shrink-0 w-[260px] border border-gray-200 rounded-2xl overflow-hidden bg-white hover:shadow-md transition-shadow">
      <div className="relative h-48 bg-[#F2F0F1]">
        {combo.imageUrl ? (
          <img src={combo.imageUrl} alt={combo.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package size={40} className="text-gray-300" />
          </div>
        )}
        {combo.savings > 0 && (
          <span className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
            Save ৳{combo.savings.toLocaleString()}
          </span>
        )}
      </div>
      <div className="p-4">
        <p className="text-xs font-semibold text-purple-600 mb-1">Bundle</p>
        <h3 className="font-bold text-sm text-black line-clamp-2 mb-2">{combo.name}</h3>
        <div className="flex items-center gap-2 mb-3">
          <span className="font-black text-black">৳{combo.sellPrice.toLocaleString()}</span>
          {combo.originalPrice > combo.sellPrice && (
            <span className="text-sm text-gray-400 line-through">৳{combo.originalPrice.toLocaleString()}</span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleAdd}
            disabled={!inStock}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-full bg-black text-white text-xs font-semibold disabled:opacity-40"
          >
            <ShoppingCart size={13} /> Add Bundle
          </button>
          <Link
            href={`/store/${slug}/cart`}
            className="px-3 py-2 rounded-full border border-gray-300 text-xs font-medium hover:border-black"
          >
            Cart
          </Link>
        </div>
      </div>
    </div>
  );
}
