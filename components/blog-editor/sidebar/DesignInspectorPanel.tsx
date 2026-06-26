"use client";

import { useEditorStore } from "@/lib/blog-editor/store/editor-store";

export function DesignInspectorPanel() {
  const selectedBlockId = useEditorStore(s => s.selectedBlockId);
  const blocks = useEditorStore(s => s.blocks);
  const updateBlock = useEditorStore(s => s.updateBlock);

  const block = selectedBlockId ? blocks.find(b => b.id === selectedBlockId) : null;

  if (!block) {
    return (
      <p className="p-4 text-xs text-center" style={{ color: "var(--c-text-muted)" }}>
        Select a block to edit design properties
      </p>
    );
  }

  const design = block.design ?? {};
  const blockId = block.id;

  function setDesign(key: string, value: string) {
    updateBlock(blockId, b => ({
      ...b,
      design: { ...b.design, [key]: value || undefined },
    }));
  }

  return (
    <div className="p-4 space-y-4 text-sm">
      <SliderField label="Padding" value={design.padding ?? "0"} onChange={v => setDesign("padding", `${v}px`)} min={0} max={64} />
      <SliderField label="Margin" value={design.margin ?? "0"} onChange={v => setDesign("margin", `${v}px`)} min={0} max={64} />
      <Field label="Background">
        <input type="color" value={design.background?.startsWith("#") ? design.background : "#ffffff"} onChange={e => setDesign("background", e.target.value)} className="w-full h-8 rounded cursor-pointer" />
      </Field>
      <Field label="Border radius">
        <input type="range" min={0} max={32} value={parseInt(design.borderRadius ?? "0")} onChange={e => setDesign("borderRadius", `${e.target.value}px`)} className="w-full" />
      </Field>
      <Field label="Shadow">
        <select value={design.shadow ?? ""} onChange={e => setDesign("shadow", e.target.value)} className="w-full px-3 py-2 rounded-lg border" style={{ borderColor: "var(--c-border)" }}>
          <option value="">None</option>
          <option value="var(--shadow-card)">Card</option>
          <option value="var(--shadow-elevated)">Elevated</option>
        </select>
      </Field>
      <Field label="Custom CSS">
        <textarea
          value={design.customCss ?? ""}
          onChange={e => setDesign("customCss", e.target.value)}
          rows={4}
          className="w-full font-mono text-xs p-2 rounded-lg border"
          style={{ borderColor: "var(--c-border)" }}
          placeholder="color: red;"
          spellCheck={false}
        />
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5 uppercase tracking-wide" style={{ color: "var(--c-text-muted)" }}>{label}</label>
      {children}
    </div>
  );
}

function SliderField({ label, value, onChange, min, max }: { label: string; value: string; onChange: (v: number) => void; min: number; max: number }) {
  const num = parseInt(value) || 0;
  return (
    <Field label={label}>
      <input type="range" min={min} max={max} value={num} onChange={e => onChange(Number(e.target.value))} className="w-full" />
      <span className="text-xs" style={{ color: "var(--c-text-muted)" }}>{num}px</span>
    </Field>
  );
}
