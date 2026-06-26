"use client";

import { useEditorUIStore } from "@/lib/blog-editor/store/ui-store";
import { PostSettingsPanel } from "./PostSettingsPanel";
import { SEOPanel } from "./SEOPanel";
import { RevisionPanel } from "./RevisionPanel";
import { CommentsPanel } from "./CommentsPanel";
import { DesignInspectorPanel } from "./DesignInspectorPanel";

const TABS = [
  { id: "settings" as const, label: "Post" },
  { id: "seo" as const, label: "SEO" },
  { id: "revisions" as const, label: "History" },
  { id: "comments" as const, label: "Comments" },
  { id: "design" as const, label: "Design" },
];

export function RightSidebar({ postId }: { postId: string }) {
  const { activeSidebarTab, setActiveSidebarTab, highContrast, setHighContrast } = useEditorUIStore();

  return (
    <aside className="h-full flex flex-col" aria-label="Post settings">
      <div className="flex border-b shrink-0 overflow-x-auto" style={{ borderColor: "var(--c-border)" }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSidebarTab(tab.id)}
            className="px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors"
            style={{
              color: activeSidebarTab === tab.id ? "var(--c-primary)" : "var(--c-text-muted)",
              borderBottom: activeSidebarTab === tab.id ? "2px solid var(--c-primary)" : "2px solid transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={`flex-1 overflow-y-auto ${highContrast ? "contrast-more" : ""}`}>
        {activeSidebarTab === "settings" && <PostSettingsPanel postId={postId} />}
        {activeSidebarTab === "seo" && <SEOPanel postId={postId} />}
        {activeSidebarTab === "revisions" && <RevisionPanel postId={postId} />}
        {activeSidebarTab === "comments" && <CommentsPanel postId={postId} />}
        {activeSidebarTab === "design" && <DesignInspectorPanel />}
      </div>

      <div className="p-3 border-t shrink-0" style={{ borderColor: "var(--c-border)" }}>
        <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: "var(--c-text-sub)" }}>
          <input type="checkbox" checked={highContrast} onChange={e => setHighContrast(e.target.checked)} />
          High contrast mode
        </label>
      </div>
    </aside>
  );
}
