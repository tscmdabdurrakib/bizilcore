import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { parseContent } from "@/lib/blog-editor/api-helpers";
import { PublicBlockRenderer } from "@/components/blog-editor/renderer/PublicBlockRenderer";
import { extractPlainText, readingTimeMinutes } from "@/lib/blog-editor/utils/blocks";
import { BlogCtaSection } from "@/components/blog/BlogCtaSection";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar, Clock, User } from "lucide-react";

type PageProps = { params: Promise<{ slug: string }> };

const C = {
  primary: "#0F6E56",
  primaryLight: "#E1F5EE",
  bg: "#F7F6F2",
  surface: "#FFFFFF",
  border: "#E8E6DF",
  text: "#1A1A18",
  textSub: "#5A5A56",
  textMuted: "#A8A69E",
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findFirst({
    where: { slug, status: "published", visibility: "public" },
  });
  if (!post) return { title: "Not Found" };

  return {
    title: post.metaTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt ?? undefined,
    openGraph: {
      title: post.metaTitle ?? post.title,
      description: post.metaDescription ?? post.excerpt ?? undefined,
      images: post.ogImageUrl || post.featuredImageUrl ? [{ url: post.ogImageUrl ?? post.featuredImageUrl! }] : [],
      type: "article",
    },
    alternates: post.canonicalUrl ? { canonical: post.canonicalUrl } : undefined,
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await prisma.blogPost.findFirst({
    where: { slug, status: "published", visibility: "public" },
    include: {
      author: { select: { name: true } },
      categories: { include: { category: true } },
      tags: { include: { tag: true } },
    },
  });

  if (!post) notFound();

  const content = parseContent(post.content);
  const readTime = readingTimeMinutes(extractPlainText(content));
  const publishedDate = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("bn-BD", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": post.schemaType,
    headline: post.title,
    description: post.excerpt,
    image: post.featuredImageUrl,
    datePublished: post.publishedAt?.toISOString(),
    author: { "@type": "Person", name: post.author.name },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div style={{ backgroundColor: C.bg, minHeight: "100vh" }}>
        {/* Hero */}
        {post.featuredImageUrl ? (
          <section className="relative">
            <div className="relative h-[320px] md:h-[420px] overflow-hidden">
              <Image
                src={post.featuredImageUrl}
                alt={post.title}
                fill
                className="object-cover"
                priority
                sizes="100vw"
              />
              <div
                className="absolute inset-0"
                style={{
                  background: `linear-gradient(to top, rgba(7,46,32,0.95) 0%, rgba(7,46,32,0.6) 50%, rgba(7,46,32,0.3) 100%)`,
                }}
              />
            </div>
            <div className="absolute inset-0 flex flex-col justify-end">
              <div className="max-w-3xl mx-auto px-4 sm:px-6 pb-10 md:pb-14 w-full">
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-1.5 text-sm mb-6 text-white/80 hover:text-white transition-colors"
                >
                  <ArrowLeft size={14} />
                  ব্লগে ফিরে যান
                </Link>
                {post.categories[0] && (
                  <span
                    className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-4 bg-white/15 text-white border border-white/25"
                  >
                    {post.categories[0].category.name}
                  </span>
                )}
                <h1
                  className="text-3xl md:text-5xl font-black text-white font-display leading-tight mb-4"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  {post.title}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-white/75">
                  <span className="inline-flex items-center gap-1.5">
                    <User size={14} />
                    {post.author.name}
                  </span>
                  {publishedDate && (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar size={14} />
                      {publishedDate}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5">
                    <Clock size={14} />
                    {readTime} মিনিট পড়া
                  </span>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section
            className="relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, #072E20 0%, #0A5240 40%, #0F6E56 70%, #1A9472 100%)` }}
          >
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full opacity-10 bg-white" />
            </div>
            <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16 relative z-10">
              <Link
                href="/blog"
                className="inline-flex items-center gap-1.5 text-sm mb-6 text-white/80 hover:text-white transition-colors"
              >
                <ArrowLeft size={14} />
                ব্লগে ফিরে যান
              </Link>
              {post.categories[0] && (
                <span
                  className="inline-block text-xs font-semibold px-2.5 py-1 rounded-full mb-4 bg-white/15 text-white border border-white/25"
                >
                  {post.categories[0].category.name}
                </span>
              )}
              <h1
                className="text-3xl md:text-5xl font-black text-white font-display leading-tight mb-4"
                style={{ letterSpacing: "-0.02em" }}
              >
                {post.title}
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-white/75">
                <span className="inline-flex items-center gap-1.5">
                  <User size={14} />
                  {post.author.name}
                </span>
                {publishedDate && (
                  <span className="inline-flex items-center gap-1.5">
                    <Calendar size={14} />
                    {publishedDate}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <Clock size={14} />
                  {readTime} মিনিট পড়া
                </span>
              </div>
            </div>
          </section>
        )}

        {/* Article body card */}
        <article className="max-w-3xl mx-auto px-4 sm:px-6 -mt-6 relative z-10 pb-16">
          <div
            className="rounded-2xl border shadow-sm p-8 md:p-12"
            style={{ backgroundColor: C.surface, borderColor: C.border }}
          >
            {post.excerpt && (
              <p
                className="text-lg md:text-xl mb-10 leading-relaxed italic border-l-4 pl-5"
                style={{ color: C.textSub, borderColor: C.primary }}
              >
                {post.excerpt}
              </p>
            )}

            <div className="blog-content">
              <PublicBlockRenderer blocks={content} />
            </div>

            {post.tags.length > 0 && (
              <div
                className="flex flex-wrap gap-2 mt-12 pt-8 border-t"
                style={{ borderColor: C.border }}
              >
                {post.tags.map(({ tag }) => (
                  <span
                    key={tag.id}
                    className="px-3 py-1.5 rounded-full text-xs font-medium border"
                    style={{ borderColor: C.border, color: C.textSub, backgroundColor: C.bg }}
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </article>

        <BlogCtaSection />
      </div>
    </>
  );
}
