import Link from "next/link";

const posts = [
  {
    slug: "facebook-seller-tips",
    title: "Facebook Seller দের জন্য ৫টি গুরুত্বপূর্ণ টিপস",
    excerpt:
      "Facebook এ ব্যবসা করছেন? এই ৫টি টিপস আপনার sales বাড়াতে এবং অর্ডার manage করতে সাহায্য করবে।",
    category: "টিপস",
    date: "১৫ মার্চ, ২০২৬",
    readTime: "৫ মিনিট",
  },
  {
    slug: "stock-management-guide",
    title: "স্টক ম্যানেজমেন্ট: সহজে শিখুন",
    excerpt:
      "পণ্যের স্টক সঠিকভাবে manage না করলে ব্যবসায় বড় ক্ষতি হতে পারে। জানুন কীভাবে সহজে স্টক track করবেন।",
    category: "গাইড",
    date: "৮ মার্চ, ২০২৬",
    readTime: "৭ মিনিট",
  },
  {
    slug: "customer-due-management",
    title: "কাস্টমারের বাকি হিসাব রাখুন সহজে",
    excerpt:
      "বাকিতে পণ্য দেন? BizilCore দিয়ে কাস্টমারের due automatically track করুন এবং সময়মতো payment নিন।",
    category: "ফিচার",
    date: "১ মার্চ, ২০২৬",
    readTime: "৪ মিনিট",
  },
];

const categories = ["সব", "টিপস", "গাইড", "ফিচার", "সাফল্যের গল্প"];

export default function BlogPage() {
  return (
    <div style={{ backgroundColor: "#F7F6F2" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4" style={{ color: "#1A1A18" }}>
            BizilCore ব্লগ
          </h1>
          <p className="text-lg" style={{ color: "#5A5A56" }}>
            Facebook seller দের জন্য টিপস, গাইড ও সাফল্যের গল্প
          </p>
        </div>

        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-10 justify-center">
          {categories.map((cat, i) => (
            <button
              key={cat}
              className="px-4 py-1.5 rounded-full text-sm font-medium border transition-colors"
              style={{
                backgroundColor: i === 0 ? "#0F6E56" : "#FFFFFF",
                color: i === 0 ? "#FFFFFF" : "#5A5A56",
                borderColor: i === 0 ? "#0F6E56" : "#E8E6DF",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Posts grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="rounded-2xl border overflow-hidden bg-white"
              style={{ borderColor: "#E8E6DF" }}
            >
              {/* Placeholder thumbnail */}
              <div
                className="h-44 flex items-center justify-center"
                style={{ backgroundColor: "#E1F5EE" }}
              >
                <span className="text-4xl">📝</span>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                    style={{ backgroundColor: "#E1F5EE", color: "#0F6E56" }}
                  >
                    {post.category}
                  </span>
                  <span className="text-xs" style={{ color: "#A8A69E" }}>
                    {post.readTime} পড়া
                  </span>
                </div>
                <h2 className="font-semibold text-lg leading-snug mb-2" style={{ color: "#1A1A18" }}>
                  {post.title}
                </h2>
                <p className="text-sm leading-relaxed mb-4" style={{ color: "#5A5A56" }}>
                  {post.excerpt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs" style={{ color: "#A8A69E" }}>{post.date}</span>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="text-sm font-medium hover:underline"
                    style={{ color: "#0F6E56" }}
                  >
                    পড়ুন →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
