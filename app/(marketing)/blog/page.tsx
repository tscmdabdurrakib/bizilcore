import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { serializePost, BLOG_POST_INCLUDE } from "@/lib/blog-editor/api-helpers";
import { extractPlainText, readingTimeMinutes } from "@/lib/blog-editor/utils/blocks";
import { BlogCtaSection } from "@/components/blog/BlogCtaSection";
import { BookOpen, Calendar, Clock, FolderOpen, FileText } from "lucide-react";

export const revalidate = 60;

const C = {
  primary: "#0F6E56",
  primaryDark: "#0A5240",
  primaryLight: "#E1F5EE",
  bg: "#F7F6F2",
  surface: "#FFFFFF",
  border: "#E8E6DF",
  text: "#1A1A18",
  textSub: "#5A5A56",
  textMuted: "#A8A69E",
};

export default async function BlogPage() {
  const posts = await prisma.blogPost.findMany({
    where: {
      status: "published",
      visibility: "public",
    },
    include: BLOG_POST_INCLUDE,
    orderBy: { publishedAt: "desc" },
  });

  const serialized = posts.map(serializePost);
  const categories = [...new Set(serialized.flatMap(p => p.categories?.map(c => c.name) ?? []))];

  const avgReadTime =
    serialized.length > 0
      ? Math.round(
          serialized.reduce((sum, p) => sum + readingTimeMinutes(extractPlainText(p.content)), 0) /
            serialized.length,
        )
      : 0;

  return (
    <div style={{ backgroundColor: C.bg }}>
      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, #072E20 0%, #0A5240 40%, #0F6E56 70%, #1A9472 100%)` }}
      >
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full opacity-10 bg-white" />
          <div className="absolute bottom-0 -left-20 w-72 h-72 rounded-full opacity-10 bg-white" />
        </div>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-24 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 bg-white/15 text-white border border-white/25">
              <BookOpen size={13} />
              BizilCore ব্লগ
            </span>
            <h1
              className="text-4xl md:text-5xl font-black text-white mb-5 font-display leading-tight"
              style={{ letterSpacing: "-0.02em" }}
            >
              Facebook Seller দের জন্য<br />
              <span style={{ color: "#5EECA0" }}>টিপস ও গাইড</span>
            </h1>
            <p className="text-lg text-white/75 leading-relaxed max-w-2xl mx-auto">
              Facebook seller দের জন্য টিপস, গাইড ও সাফল্যের গল্প — BizilCore দল থেকে।
            </p>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 -mt-10 relative z-10 mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { value: `${serialized.length}টি`, label: "প্রকাশিত পোস্ট", icon: FileText, color: C.primary, bg: C.primaryLight },
            { value: `${categories.length}টি`, label: "ক্যাটাগরি", icon: FolderOpen, color: "#3B82F6", bg: "#EFF6FF" },
            { value: avgReadTime > 0 ? `${avgReadTime} মিনিট` : "—", label: "গড় পড়ার সময়", icon: Clock, color: "#F59E0B", bg: "#FFFBEB" },
            { value: "সাপ্তাহিক", label: "নতুন কন্টেন্ট", icon: BookOpen, color: "#8B5CF6", bg: "#F5F3FF" },
          ].map(s => (
            <div
              key={s.label}
              className="rounded-2xl p-5 border shadow-sm flex flex-col items-center text-center"
              style={{ backgroundColor: C.surface, borderColor: C.border }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                style={{ backgroundColor: s.bg }}
              >
                <s.icon size={18} style={{ color: s.color }} />
              </div>
              <p className="text-xl font-bold font-display" style={{ color: C.text }}>
                {s.value}
              </p>
              <p className="text-xs mt-1" style={{ color: C.textMuted }}>
                {s.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Category pills (display only) */}
      {categories.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 sm:px-6 mb-10">
          <div className="flex flex-wrap gap-2 justify-center">
            <span
              className="px-4 py-2 rounded-full text-sm font-medium"
              style={{ backgroundColor: C.primary, color: "white" }}
            >
              সব
            </span>
            {categories.map(cat => (
              <span
                key={cat}
                className="px-4 py-2 rounded-full text-sm font-medium border"
                style={{ borderColor: C.border, color: C.textSub, backgroundColor: C.surface }}
              >
                {cat}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Post grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20">
        {serialized.length === 0 ? (
          <div
            className="text-center py-20 rounded-2xl border"
            style={{ backgroundColor: C.surface, borderColor: C.border }}
          >
            <BookOpen size={40} className="mx-auto mb-4" style={{ color: C.textMuted }} />
            <p style={{ color: C.textSub }}>কোনো পোস্ট এখনো প্রকাশিত হয়নি।</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {serialized.map(post => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group block rounded-2xl overflow-hidden border shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
                style={{ backgroundColor: C.surface, borderColor: C.border }}
              >
                <div className="relative aspect-video overflow-hidden bg-gray-100">
                  {post.featuredImageUrl ? (
                    <>
                      <Image
                        src={post.featuredImageUrl}
                        alt={post.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </>
                  ) : (
                    <div
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: C.primaryLight }}
                    >
                      <BookOpen size={32} style={{ color: C.primary }} />
                    </div>
                  )}
                </div>
                <div className="p-6">
                  {post.categories?.[0] && (
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ backgroundColor: C.primaryLight, color: C.primary }}
                    >
                      {post.categories[0].name}
                    </span>
                  )}
                  <h2
                    className="text-lg font-bold mt-3 mb-2 line-clamp-2 font-display group-hover:underline decoration-2 underline-offset-2"
                    style={{ color: C.text }}
                  >
                    {post.title}
                  </h2>
                  <p className="text-sm line-clamp-3 leading-relaxed" style={{ color: C.textSub }}>
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-1.5 text-xs mt-4" style={{ color: C.textMuted }}>
                    <Calendar size={12} />
                    {post.publishedAt
                      ? new Date(post.publishedAt).toLocaleDateString("bn-BD", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      : ""}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <BlogCtaSection />
    </div>
  );
}
