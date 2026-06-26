"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function NewBlogPostPage() {
  const router = useRouter();

  useEffect(() => {
    fetch("/api/admin/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Untitled" }),
    })
      .then(r => r.json())
      .then(post => {
        if (post.id) router.replace(`/admin/blog/${post.id}/edit`);
      });
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: "var(--c-primary)" }} />
    </div>
  );
}
