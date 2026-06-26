"use client";

import { useCallback, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { useEditorUIStore } from "@/lib/blog-editor/store/ui-store";
import { useBlogMedia } from "@/hooks/blog-editor/useBlogPost";
import { Search, Upload, Image as ImageIcon, Film, File } from "lucide-react";
import Image from "next/image";
import toast from "react-hot-toast";

export function MediaLibraryModal() {
  const { mediaLibraryOpen, mediaLibraryCallback, closeMediaLibrary } = useEditorUIStore();
  const [type, setType] = useState<string>("");
  const [q, setQ] = useState("");
  const { data: media = [], refetch } = useBlogMedia(type || undefined, q || undefined);
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) await uploadFile(file);
  }, []);

  async function uploadFile(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/admin/blog/media", { method: "POST", body: fd });
      if (!res.ok) throw new Error("Upload failed");
      await refetch();
      toast.success("Uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function select(item: { url: string; alt?: string | null; type: string }) {
    mediaLibraryCallback?.(item.url, { alt: item.alt, type: item.type });
    closeMediaLibrary();
  }

  return (
    <Dialog open={mediaLibraryOpen} onClose={closeMediaLibrary} title="Media Library" size="xl">
      <div className="p-4 space-y-4">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--c-text-muted)" }} />
            <input
              type="search"
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder="Search media…"
              className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: "var(--c-border)" }}
            />
          </div>
          {(["", "image", "video", "file"] as const).map(t => (
            <button
              key={t || "all"}
              type="button"
              onClick={() => setType(t)}
              className="px-3 py-2 rounded-lg text-xs capitalize border"
              style={{
                borderColor: type === t ? "var(--c-primary)" : "var(--c-border)",
                color: type === t ? "var(--c-primary)" : "var(--c-text-sub)",
              }}
            >
              {t || "All"}
            </button>
          ))}
        </div>

        <div
          onDrop={onDrop}
          onDragOver={e => e.preventDefault()}
          className="border-2 border-dashed rounded-xl p-8 text-center"
          style={{ borderColor: "var(--c-border)" }}
        >
          <Upload className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--c-text-muted)" }} />
          <p className="text-sm mb-2" style={{ color: "var(--c-text-sub)" }}>Drag & drop or click to upload</p>
          <label className="inline-flex px-4 py-2 rounded-xl text-sm font-medium text-white cursor-pointer" style={{ background: "var(--c-primary)" }}>
            {uploading ? "Uploading…" : "Choose file"}
            <input type="file" className="hidden" accept="image/*,video/*,.pdf,.doc,.docx" onChange={e => e.target.files?.[0] && uploadFile(e.target.files[0])} />
          </label>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-4 gap-2 max-h-80 overflow-y-auto">
          {media.map((item: { id: string; url: string; type: string; alt?: string | null }) => (
            <button
              key={item.id}
              type="button"
              onClick={() => select(item)}
              className="relative aspect-square rounded-lg overflow-hidden border hover:ring-2 ring-[var(--c-primary)] transition-all group"
              style={{ borderColor: "var(--c-border)" }}
            >
              {item.type === "image" ? (
                <Image src={item.url} alt={item.alt ?? ""} fill className="object-cover" sizes="120px" />
              ) : (
                <div className="flex flex-col items-center justify-center h-full" style={{ background: "var(--c-bg)" }}>
                  {item.type === "video" ? <Film className="w-6 h-6" /> : <File className="w-6 h-6" />}
                </div>
              )}
            </button>
          ))}
        </div>
      </div>
    </Dialog>
  );
}
