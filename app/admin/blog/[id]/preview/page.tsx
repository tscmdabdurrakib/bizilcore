import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { parseContent } from "@/lib/blog-editor/api-helpers";
import { PublicBlockRenderer } from "@/components/blog-editor/renderer/PublicBlockRenderer";
import Link from "next/link";

type PageProps = { params: Promise<{ id: string }> };

export default async function BlogPreviewPage({ params }: PageProps) {
  const { id } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { id },
    include: { author: { select: { name: true } } },
  });

  if (!post) notFound();

  const content = parseContent(post.content);

  return (
    <div style={{ background: "#F7F6F2", minHeight: "100vh" }}>
      <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-center text-sm text-amber-800">
        Preview mode — <Link href={`/admin/blog/${id}/edit`} className="underline font-medium">Back to editor</Link>
      </div>
      <article className="max-w-3xl mx-auto px-4 py-12">
        {post.featuredImageUrl && (
          <img src={post.featuredImageUrl} alt="" className="w-full rounded-2xl mb-8 aspect-video object-cover" />
        )}
        <h1 className="text-4xl font-bold font-display mb-4" style={{ color: "#1A1A18" }}>{post.title}</h1>
        <p className="text-sm mb-8" style={{ color: "#5A5A56" }}>
          {post.author?.name} · {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString() : "Draft"}
        </p>
        {post.excerpt && <p className="text-lg mb-8 italic" style={{ color: "#5A5A56" }}>{post.excerpt}</p>}
        <PublicBlockRenderer blocks={content} />
      </article>
    </div>
  );
}
