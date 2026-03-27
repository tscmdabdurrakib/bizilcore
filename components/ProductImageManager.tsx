"use client";

import { useState } from "react";
import { Link as LinkIcon, X, Star, AlertCircle, Lock, ChevronUp, ChevronDown } from "lucide-react";

export interface ProductImage {
  id:        string;
  type:      "upload" | "url";
  src:       string;
  isPrimary: boolean;
  order:     number;
  publicId?: string;
}

interface Props {
  plan:       "free" | "pro" | "business";
  productId?: string;
  images:     ProductImage[];
  onChange:   (images: ProductImage[]) => void;
}

const MAX_IMAGES = 5;

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function applyOrder(list: ProductImage[]): ProductImage[] {
  return list.map((img, i) => ({ ...img, order: i, isPrimary: i === 0 }));
}

export default function ProductImageManager({ plan, images, onChange }: Props) {
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");

  const S = {
    primary: "var(--c-primary)", border: "var(--c-border)", bg: "var(--c-bg)",
    surface: "var(--c-surface)", text: "var(--c-text)", muted: "var(--c-text-muted)",
    sub: "var(--c-text-sub)",
  };

  const isBusiness = plan === "business";
  const canAddMore = isBusiness && images.length < MAX_IMAGES;

  function move(index: number, dir: -1 | 1) {
    const next = [...images];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    onChange(applyOrder(next));
  }

  function remove(id: string) {
    onChange(applyOrder(images.filter(img => img.id !== id)));
  }

  function handleAddUrl() {
    setUrlError("");
    const url = urlInput.trim();
    if (!url) return;
    if (!url.startsWith("https://")) {
      setUrlError("নিরাপদ লিংক ব্যবহার করুন (https:// দিয়ে শুরু হতে হবে)");
      return;
    }
    if (!canAddMore) {
      setUrlError("সর্বোচ্চ ৫টি ছবি যোগ করা যাবে।");
      return;
    }
    const newImg: ProductImage = {
      id: uid(), type: "url", src: url,
      isPrimary: images.length === 0, order: images.length,
    };
    onChange(applyOrder([...images, newImg]));
    setUrlInput("");
  }

  if (!isBusiness) {
    return (
      <div className="rounded-2xl border p-4 space-y-2"
        style={{ borderColor: S.border, backgroundColor: S.bg }}>
        <div className="flex items-start gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "#F3F0FF" }}>
            <Lock size={15} style={{ color: "#7C3AED" }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: S.text }}>পণ্যের ছবি — Business প্ল্যান</p>
            <p className="text-xs mt-0.5" style={{ color: S.muted }}>
              পণ্যে ছবি যোগ করতে Business প্ল্যান প্রয়োজন।
              {plan === "free" && " Free ও Pro প্ল্যানে পণ্যে ছবি দেওয়া যাবে না।"}
              {plan === "pro" && " Pro প্ল্যানে পণ্যে ছবি দেওয়া যাবে না।"}
            </p>
          </div>
        </div>
        <a href="/billing"
          className="block text-center text-xs font-medium py-2 rounded-xl transition-colors"
          style={{ color: "#7C3AED", backgroundColor: "#F3F0FF" }}>
          Business প্ল্যানে আপগ্রেড করুন →
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Count bar */}
      <div className="flex items-center gap-2 p-3 rounded-xl text-xs"
        style={{ backgroundColor: S.bg, color: S.muted }}>
        <div className="flex gap-0.5">
          {Array.from({ length: MAX_IMAGES }).map((_, i) => (
            <div key={i} className="w-5 h-2 rounded-sm"
              style={{ backgroundColor: i < images.length ? S.primary : S.border }} />
          ))}
        </div>
        <span style={{ color: S.sub }}>{images.length}/{MAX_IMAGES} ছবি (URL)</span>
      </div>

      {/* URL input */}
      {canAddMore && (
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: S.sub }}>
            ছবির লিংক যোগ করুন
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={e => { setUrlInput(e.target.value); setUrlError(""); }}
              onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddUrl(); } }}
              placeholder="https://example.com/image.jpg"
              className="flex-1 h-10 rounded-xl border px-3 text-sm outline-none"
              style={{ borderColor: S.border, color: S.text, backgroundColor: S.surface }}
            />
            <button type="button" onClick={handleAddUrl}
              disabled={!urlInput.trim()}
              className="px-4 h-10 rounded-xl text-sm font-medium text-white disabled:opacity-40 flex-shrink-0"
              style={{ backgroundColor: S.primary }}>
              <LinkIcon size={14} />
            </button>
          </div>
          <p className="text-xs mt-1" style={{ color: S.muted }}>
            Pinterest, Google Images বা যেকোনো https:// লিংক ব্যবহার করুন
          </p>
          {urlError && (
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-red-600">
              <AlertCircle size={12} /> {urlError}
            </div>
          )}
        </div>
      )}

      {images.length === MAX_IMAGES && (
        <p className="text-xs text-center" style={{ color: S.muted }}>সর্বোচ্চ ৫টি ছবির সীমায় পৌঁছে গেছেন।</p>
      )}

      {/* Image list */}
      {images.length > 0 && (
        <div className="space-y-2">
          {images.map((img, idx) => (
            <div key={img.id}
              className="flex items-center gap-3 p-2 rounded-xl border"
              style={{ borderColor: img.isPrimary ? S.primary : S.border, backgroundColor: S.surface }}>

              <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 relative"
                style={{ backgroundColor: S.bg }}>
                <img
                  src={img.src} alt="product"
                  loading="lazy"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/images/placeholder-product.png"; }}
                />
                {img.isPrimary && (
                  <div className="absolute bottom-0 left-0 right-0 text-center"
                    style={{ background: "rgba(15,110,86,0.85)", color: "#fff", fontSize: "9px", padding: "2px 0" }}>
                    প্রধান
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-xs px-1.5 py-0.5 rounded font-medium"
                    style={{ backgroundColor: "#F0F0F0", color: S.sub }}>লিংক</span>
                  {img.isPrimary && <Star size={11} style={{ color: S.primary }} fill="currentColor" />}
                </div>
                <p className="text-xs truncate" style={{ color: S.muted }}>{img.src}</p>
              </div>

              <div className="flex flex-col gap-0.5">
                <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-opacity">
                  <ChevronUp size={14} style={{ color: S.sub }} />
                </button>
                <button type="button" onClick={() => move(idx, 1)} disabled={idx === images.length - 1}
                  className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 transition-opacity">
                  <ChevronDown size={14} style={{ color: S.sub }} />
                </button>
              </div>
              <button type="button" onClick={() => remove(img.id)}
                className="p-1.5 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0">
                <X size={14} className="text-red-500" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
