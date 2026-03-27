"use client";

import Link from "next/link";
import { ShoppingCart, ImageIcon } from "lucide-react";
import { useCart } from "@/lib/store/cart";
import { useStoreTheme } from "./ThemeProvider";

export interface ProductCardProduct {
  id: string;
  name: string;
  description?: string | null;
  sellPrice: number;
  imageUrl: string | null;
  stockQty: number;
  category: string | null;
  hasVariants: boolean;
}

interface Props {
  product: ProductCardProduct;
  slug: string;
}

function useAddToCart(product: ProductCardProduct, slug: string) {
  const addItem = useCart((s) => s.addItem);
  function handle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (product.stockQty <= 0 || product.hasVariants) return;
    addItem({
      productId: product.id,
      productName: product.name,
      productImage: product.imageUrl,
      variantId: null,
      variantName: null,
      unitPrice: product.sellPrice,
      quantity: 1,
    }, slug);
  }
  return handle;
}

function ImageOverlayCard({ product, slug, primary }: { product: ProductCardProduct; slug: string; primary: string }) {
  const { theme, defaults } = useStoreTheme();
  const handleAddToCart = useAddToCart(product, slug);
  const inStock = product.stockQty > 0;

  return (
    <Link href={`/store/${slug}/products/${product.id}`} className="group relative block overflow-hidden" style={{ aspectRatio: "2/3" }}>
      {product.imageUrl ? (
        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-900">
          <ImageIcon size={32} className="text-gray-600" />
        </div>
      )}
      {!inStock && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
          <span className="text-white text-xs font-bold bg-red-500 px-3 py-1">স্টক শেষ</span>
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-4 translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
        <p className={`font-bold text-white leading-tight mb-1 ${theme.typography.productNameSize}`} style={{ fontFamily: theme.typography.fontHeading }}>
          {product.name}
        </p>
        {product.description && (
          <p className="text-white/60 text-xs leading-relaxed line-clamp-2 mb-1">{product.description}</p>
        )}
        <p className="text-white/70 text-sm mb-3">৳{product.sellPrice.toLocaleString()}</p>
        {inStock && !product.hasVariants ? (
          <button
            onClick={handleAddToCart}
            className="w-full flex items-center justify-center gap-2 text-xs font-bold py-2 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ backgroundColor: primary }}
          >
            <ShoppingCart size={12} /> কার্টে যোগ
          </button>
        ) : product.hasVariants ? (
          <span className="text-xs text-white/70">বিস্তারিত দেখুন →</span>
        ) : null}
      </div>
    </Link>
  );
}

function BorderlessCard({ product, slug, primary }: { product: ProductCardProduct; slug: string; primary: string }) {
  const { theme, defaults } = useStoreTheme();
  const handleAddToCart = useAddToCart(product, slug);
  const inStock = product.stockQty > 0;

  return (
    <Link href={`/store/${slug}/products/${product.id}`} className="group block">
      <div className="relative overflow-hidden mb-3" style={{ aspectRatio: "1/1" }}>
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: defaults.surface }}>
            <ImageIcon size={28} style={{ color: defaults.muted }} />
          </div>
        )}
        {!inStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-xs font-bold text-red-600">স্টক শেষ</span>
          </div>
        )}
      </div>
      <p className={`font-medium leading-tight mb-1 ${theme.typography.productNameSize}`} style={{ color: defaults.text, fontFamily: theme.typography.fontHeading }}>
        {product.name}
      </p>
      {product.description && (
        <p className="text-xs leading-relaxed mb-1 line-clamp-2" style={{ color: defaults.muted }}>{product.description}</p>
      )}
      {product.category && <p className="text-xs mb-1" style={{ color: defaults.muted }}>{product.category}</p>}
      <div className="flex items-center justify-between">
        <p className="font-semibold" style={{ color: primary }}>৳{product.sellPrice.toLocaleString()}</p>
        {product.hasVariants ? (
          <span className="text-xs" style={{ color: defaults.muted }}>বেছে নিন →</span>
        ) : (
          <button
            onClick={handleAddToCart}
            disabled={!inStock}
            className="text-xs font-medium underline disabled:opacity-40"
            style={{ color: primary }}
          >
            যোগ করুন
          </button>
        )}
      </div>
    </Link>
  );
}

function ShadowCard({ product, slug, primary }: { product: ProductCardProduct; slug: string; primary: string }) {
  const { theme, defaults } = useStoreTheme();
  const handleAddToCart = useAddToCart(product, slug);
  const inStock = product.stockQty > 0;
  const radius = theme.components.borderRadius;

  return (
    <Link
      href={`/store/${slug}/products/${product.id}`}
      className={`group block overflow-hidden transition-all hover:shadow-lg ${radius}`}
      style={{ backgroundColor: defaults.surface, boxShadow: "0 2px 8px rgba(0,0,0,0.08)" }}
    >
      <div className="relative overflow-hidden aspect-square">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: defaults.bg }}>
            <ImageIcon size={28} style={{ color: defaults.muted }} />
          </div>
        )}
        {!inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-xs font-bold bg-red-500 px-2 py-1 rounded-full">স্টক শেষ</span>
          </div>
        )}
        {product.category && (
          <span className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: primary + "cc" }}>
            {product.category}
          </span>
        )}
      </div>
      <div className="p-3">
        <p className={`font-semibold leading-tight mb-1 ${theme.typography.productNameSize}`} style={{ color: defaults.text }}>{product.name}</p>
        {product.description && (
          <p className="text-xs leading-relaxed line-clamp-2 mb-1" style={{ color: defaults.muted }}>{product.description}</p>
        )}
        <div className="flex items-center justify-between gap-2 mt-2">
          <p className="font-bold text-base" style={{ color: primary }}>৳{product.sellPrice.toLocaleString()}</p>
          {product.hasVariants ? (
            <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ backgroundColor: primary + "15", color: primary }}>
              বেছে নিন
            </span>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-full text-white disabled:opacity-40"
              style={{ backgroundColor: inStock ? primary : "#9CA3AF" }}
            >
              <ShoppingCart size={11} /> যোগ
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

function OutlinedCard({ product, slug, primary }: { product: ProductCardProduct; slug: string; primary: string }) {
  const { theme, defaults } = useStoreTheme();
  const handleAddToCart = useAddToCart(product, slug);
  const inStock = product.stockQty > 0;
  const radius = theme.components.borderRadius;

  return (
    <Link
      href={`/store/${slug}/products/${product.id}`}
      className={`group block overflow-hidden border transition-all hover:border-current ${radius}`}
      style={{ backgroundColor: defaults.surface, borderColor: defaults.border }}
    >
      <div className="relative overflow-hidden aspect-square">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105" />
        ) : (
          <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: defaults.bg }}>
            <ImageIcon size={28} style={{ color: defaults.muted }} />
          </div>
        )}
        {!inStock && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="text-xs font-bold text-red-600">স্টক শেষ</span>
          </div>
        )}
      </div>
      <div className="p-3 border-t" style={{ borderColor: defaults.border }}>
        <p className={`font-medium leading-tight mb-1 ${theme.typography.productNameSize}`} style={{ color: defaults.text }}>{product.name}</p>
        {product.description && (
          <p className="text-xs leading-relaxed line-clamp-2 mb-1" style={{ color: defaults.muted }}>{product.description}</p>
        )}
        {product.category && <p className="text-[11px] mb-1.5" style={{ color: defaults.muted }}>{product.category}</p>}
        <div className="flex items-center justify-between gap-2">
          <p className="font-bold" style={{ color: defaults.text }}>৳{product.sellPrice.toLocaleString()}</p>
          {product.hasVariants ? (
            <span className="text-xs border px-2 py-1" style={{ borderColor: primary, color: primary }}>
              বেছে নিন
            </span>
          ) : (
            <button
              onClick={handleAddToCart}
              disabled={!inStock}
              className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 border disabled:opacity-40"
              style={{ borderColor: primary, color: primary }}
            >
              <ShoppingCart size={11} /> যোগ
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

export function DynamicProductCard({ product, slug }: Props) {
  const { primary, theme } = useStoreTheme();
  const cardStyle = theme.layout.productCardStyle;

  if (cardStyle === "image_overlay") return <ImageOverlayCard product={product} slug={slug} primary={primary} />;
  if (cardStyle === "borderless") return <BorderlessCard product={product} slug={slug} primary={primary} />;
  if (cardStyle === "outlined") return <OutlinedCard product={product} slug={slug} primary={primary} />;
  return <ShadowCard product={product} slug={slug} primary={primary} />;
}
