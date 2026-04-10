"use client";
import { useState, useRef } from "react";
import { Image as ImageIcon, X, Send } from "lucide-react";
import type { PostData } from "./PostCard";

interface Props {
  userName:    string;
  onPostCreated: (post: PostData) => void;
}

function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const colors = [
    "#0F6E56", "#1877F2", "#8B5CF6", "#EF4444", "#F59E0B",
    "#10B981", "#3B82F6", "#EC4899", "#06B6D4", "#84CC16",
  ];
  const color = colors[name.charCodeAt(0) % colors.length];
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{ width: size, height: size, backgroundColor: color, fontSize: size * 0.36 }}
    >
      {initials || "?"}
    </div>
  );
}

export default function CreatePost({ userName, onPostCreated }: Props) {
  const [content, setContent]       = useState("");
  const [preview, setPreview]       = useState<string | null>(null);
  const [file, setFile]             = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 2 * 1024 * 1024) {
      setError("ছবির সাইজ সর্বোচ্চ 2MB হতে হবে");
      return;
    }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
  };

  const removeImage = () => {
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    setError(null);

    const fd = new FormData();
    fd.append("content", content.trim());
    if (file) fd.append("image", file);

    const res  = await fetch("/api/community/posts", { method: "POST", body: fd });
    const data = await res.json();

    if (!res.ok) {
      setError(data?.error ?? "পোস্ট করতে সমস্যা হয়েছে");
      setSubmitting(false);
      return;
    }

    onPostCreated(data as PostData);
    setContent("");
    removeImage();
    setSubmitting(false);
  };

  return (
    <div
      className="rounded-2xl border p-4"
      style={{ borderColor: "var(--c-border)", backgroundColor: "var(--c-surface)" }}
    >
      <form onSubmit={handleSubmit}>
        <div className="flex items-start gap-3 mb-3">
          <Avatar name={userName} size={38} />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="কী মনে আছে? শেয়ার করুন…"
            rows={3}
            maxLength={2000}
            className="flex-1 px-3 py-2.5 rounded-xl border text-sm resize-none outline-none transition-all"
            style={{
              borderColor:     "var(--c-border)",
              backgroundColor: "var(--c-bg)",
              color:           "var(--c-text)",
            }}
          />
        </div>

        {/* Image preview */}
        {preview && (
          <div className="relative mb-3 ml-12 rounded-xl overflow-hidden" style={{ maxHeight: 300 }}>
            <img src={preview} alt="Preview" className="w-full object-cover" style={{ maxHeight: 300 }} />
            <button
              type="button"
              onClick={removeImage}
              className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "#fff" }}
            >
              <X size={14} />
            </button>
          </div>
        )}

        {error && (
          <p className="text-xs ml-12 mb-2 font-medium" style={{ color: "#E24B4A" }}>{error}</p>
        )}

        <div className="flex items-center justify-between ml-12">
          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleFile}
              id="community-image-upload"
            />
            <label
              htmlFor="community-image-upload"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer transition-colors border"
              style={{
                borderColor:     "var(--c-border)",
                color:           "var(--c-text-sub)",
                backgroundColor: preview ? "#E1F5EE" : "transparent",
              }}
            >
              <ImageIcon size={14} />
              ছবি যোগ করুন
            </label>
          </div>

          <button
            type="submit"
            disabled={!content.trim() || submitting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{ backgroundColor: "#0F6E56", color: "#fff" }}
          >
            {submitting ? (
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Send size={14} />
            )}
            পোস্ট করুন
          </button>
        </div>
      </form>
    </div>
  );
}
