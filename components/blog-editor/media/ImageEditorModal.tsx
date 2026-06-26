"use client";

import { Dialog } from "@/components/ui/Dialog";
import { useState } from "react";
import Image from "next/image";

interface ImageEditorModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  onSave: (data: { url: string; alt: string; caption: string }) => void;
}

/** Image editor with crop/rotate placeholders — extend with react-easy-crop for full crop UI */
export function ImageEditorModal({ open, onClose, imageUrl, onSave }: ImageEditorModalProps) {
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);

  function handleSave() {
    // Cloudinary transform placeholder: apply rotation/flip via URL transforms in production
    const transformUrl = imageUrl.replace("/upload/", `/upload/a_${rotation}${flipH ? ",hflip" : ""}/`);
    onSave({ url: transformUrl, alt, caption });
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose} title="Edit Image" size="lg">
      <div className="p-4 space-y-4">
        <div className="relative aspect-video rounded-xl overflow-hidden bg-black/5">
          <Image
            src={imageUrl}
            alt={alt}
            fill
            className="object-contain"
            style={{ transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1})` }}
          />
        </div>

        <div className="flex gap-2">
          <button type="button" onClick={() => setRotation(r => (r + 90) % 360)} className="px-3 py-1.5 rounded-lg border text-xs" style={{ borderColor: "var(--c-border)" }}>
            Rotate 90°
          </button>
          <button type="button" onClick={() => setFlipH(f => !f)} className="px-3 py-1.5 rounded-lg border text-xs" style={{ borderColor: "var(--c-border)" }}>
            Flip horizontal
          </button>
        </div>

        <input type="text" value={alt} onChange={e => setAlt(e.target.value)} placeholder="Alt text" className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--c-border)" }} />
        <input type="text" value={caption} onChange={e => setCaption(e.target.value)} placeholder="Caption" className="w-full px-3 py-2 rounded-lg border text-sm" style={{ borderColor: "var(--c-border)" }} />

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl text-sm border" style={{ borderColor: "var(--c-border)" }}>Cancel</button>
          <button type="button" onClick={handleSave} className="px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: "var(--c-primary)" }}>Save</button>
        </div>
      </div>
    </Dialog>
  );
}
