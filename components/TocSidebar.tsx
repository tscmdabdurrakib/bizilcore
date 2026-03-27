"use client";

import Link from "next/link";

interface Section {
  id: string;
  title: string;
}

interface TocSidebarProps {
  sections: Section[];
  crossLink: { href: string; label: string };
}

export default function TocSidebar({ sections, crossLink }: TocSidebarProps) {
  return (
    <div className="sticky top-6 bg-white rounded-2xl border p-5" style={{ borderColor: "#E8E6DF" }}>
      <h3 className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: "#9A9A92" }}>সূচিপত্র</h3>
      <nav className="space-y-1">
        {sections.map((s, i) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="toc-link flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
            style={{ color: "#5A5A56" }}
          >
            <span
              className="text-xs font-bold w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: "#F0F0EC", color: "#9A9A92" }}
            >
              {i + 1}
            </span>
            {s.title}
          </a>
        ))}
      </nav>
      <div className="mt-6 pt-4 border-t" style={{ borderColor: "#E8E6DF" }}>
        <Link href={crossLink.href} className="text-sm font-medium transition-colors hover:opacity-80" style={{ color: "#0F6E56" }}>
          {crossLink.label} →
        </Link>
      </div>
    </div>
  );
}
