"use client";

import Link from "next/link";
import { ShoppingCart, ImageIcon, Heart, Star, Zap } from "lucide-react";
import { useCart } from "@/lib/store/cart";
import { useWishlist } from "@/lib/store/wishlist";
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
  storeFeatured?: boolean;
}

interface Props {
  product: ProductCardProduct;
  slug: string;
  showDiscount?: boolean;
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

function fakeDiscount(id: string): number {
  const n = id.charCodeAt(id.length - 1) + id.charCodeAt(0);
  const opts = [10, 12, 15, 18, 20, 25];
  return opts[n % opts.length];
}

function fakeRating(id: string): number {
  const n = id.charCodeAt(2) + id.charCodeAt(id.length - 2);
  return 4 + (n % 2 === 0 ? 0.5 : 0);
}

export function DynamicProductCard({ product, slug, showDiscount = true }: Props) {
  const { primary } = useStoreTheme();
  const handleAddToCart = useAddToCart(product, slug);
  const { toggle, isWishlisted } = useWishlist();
  const inStock = product.stockQty > 0;
  const wishlisted = isWishlisted(product.id);
  const discount = showDiscount && product.storeFeatured ? fakeDiscount(product.id) : 0;
  const originalPrice = discount > 0 ? Math.round(product.sellPrice / (1 - discount / 100)) : null;
  const rating = fakeRating(product.id);

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    toggle({
      productId: product.id,
      productName: product.name,
      productImage: product.imageUrl,
      sellPrice: product.sellPrice,
      slug,
    });
  }

  return (
    <Link
      href={`/store/${slug}/products/${product.id}`}
      className="group relative block bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-transparent hover:shadow-2xl transition-all duration-300"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
    >
      {/* Image */}
      <div className="relative overflow-hidden bg-gray-50" style={{ paddingBottom: "100%" }}>
        <div className="absolute inset-0">
          {product.imageUrl ? (
            <>
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-gray-100 to-gray-50">
              <ImageIcon size={32} className="text-gray-300" />
              <span className="text-[10px] text-gray-400">কোনো ছবি নেই</span>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {discount > 0 && inStock && (
            <span className="flex items-center gap-0.5 text-[10px] font-black px-2 py-1 rounded-full text-white shadow-sm"
              style={{ backgroundColor: "#EF4444" }}>
              -{discount}%
            </span>
          )}
          {product.storeFeatured && inStock && (
            <span className="flex items-center gap-0.5 text-[10px] font-bold px-2 py-1 rounded-full text-white shadow-sm"
              style={{ backgroundColor: "#F59E0B" }}>
              <Zap size={8} fill="white" /> HOT
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={handleWishlist}
          className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-all duration-200 hover:scale-110"
          style={{ backgroundColor: wishlisted ? "#FEE2E2" : "rgba(255,255,255,0.95)" }}
        >
          <Heart
            size={14}
            fill={wishlisted ? "#EF4444" : "none"}
            stroke={wishlisted ? "#EF4444" : "#9CA3AF"}
          />
        </button>

        {/* Out of stock overlay */}
        {!inStock && (
          <div className="absolute inset-0 bg-white/75 backdrop-blur-[2px] flex items-center justify-center">
            <span className="px-3 py-1.5 rounded-full text-xs font-bold text-red-600 bg-white border border-red-200 shadow-sm">
              স্টক শেষ
            </span>
          </div>
        )}

        {/* Add to cart hover button */}
        {inStock && (
          <div className="absolute bottom-0 left-0 right-0 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out p-3">
            {!product.hasVariants ? (
              <button
                onClick={handleAddToCart}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white shadow-xl transition-opacity hover:opacity-90 backdrop-blur-sm"
                style={{ backgroundColor: primary }}
              >
                <ShoppingCart size={13} /> কার্টে যোগ করুন
              </button>
            ) : (
              <div
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white shadow-xl"
                style={{ backgroundColor: primary }}
              >
                বিস্তারিত দেখুন →
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        {product.category && (
          <p className="text-[9px] font-bold uppercase tracking-widest mb-1" style={{ color: primary + "99" }}>
            {product.category}
          </p>
        )}
        <p className="font-semibold text-sm text-gray-800 leading-snug mb-2 line-clamp-2 group-hover:text-gray-900 transition-colors">
          {product.name}
        </p>

        {/* Rating row */}
        <div className="flex items-center gap-1 mb-2">
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map(i => (
              <Star key={i} size={10}
                fill={i <= Math.floor(rating) ? "#F59E0B" : i === Math.ceil(rating) && rating % 1 !== 0 ? "#F59E0B" : "none"}
                stroke={i <= Math.ceil(rating) ? "#F59E0B" : "#D1D5DB"}
              />
            ))}
          </div>
          <span className="text-[10px] text-gray-500">({rating})</span>
        </div>

        {/* Price row */}
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="font-black text-base" style={{ color: primary }}>
              ৳{product.sellPrice.toLocaleString()}
            </span>
            {originalPrice && (
              <span className="text-xs text-gray-400 line-through ml-1.5">
                ৳{originalPrice.toLocaleString()}
              </span>
            )}
          </div>
          {inStock ? (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-emerald-700 bg-emerald-50 border border-emerald-100 flex-shrink-0">
              ✓ আছে
            </span>
          ) : (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full text-red-600 bg-red-50 border border-red-100 flex-shrink-0">
              শেষ
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
