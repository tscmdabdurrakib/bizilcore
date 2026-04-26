import { Star } from "lucide-react";
import { prisma } from "@/lib/prisma";

const BIZ_LABEL: Record<string, string> = {
  fcommerce: "ফেসবুক কমার্স",
  retail: "রিটেইল দোকান",
  restaurant: "রেস্টুরেন্ট",
  pharmacy: "ফার্মেসি",
  salon: "সেলুন",
  tailor: "টেইলর",
  hotel: "হোটেল",
};

function maskName(full: string | null | undefined): string {
  if (!full) return "Anon";
  const parts = full.trim().split(/\s+/);
  const first = parts[0] ?? "Anon";
  const lastInitial = parts.length > 1 ? `${parts[parts.length - 1][0]}.` : "";
  return `${first}${lastInitial ? " " + lastInitial : ""}`;
}

function truncate(s: string | null | undefined, n: number) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
}

export default async function TestimonialsSection() {
  let reviews: Array<{
    id: string;
    rating: number;
    body: string | null;
    title: string | null;
    businessType: string | null;
    user: { name: string | null } | null;
  }> = [];

  try {
    reviews = await prisma.appReview.findMany({
      where: { isApproved: true, showOnSite: true },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
      take: 6,
    });
  } catch {
    return null;
  }

  if (reviews.length === 0) return null;

  return (
    <section style={{ backgroundColor: "#F7F6F2" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3" style={{ color: "#1A1A18" }}>
            ব্যবহারকারীরা কী বলছেন
          </h2>
          <p style={{ color: "#6B7280" }}>
            ১০,০০০+ seller-এর বিশ্বাসযোগ্য প্ল্যাটফর্ম
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {reviews.map((r) => (
            <div
              key={r.id}
              className="bg-white rounded-2xl p-6 border shadow-sm"
              style={{ borderColor: "#E5E7EB" }}
            >
              <div className="flex items-center gap-1 mb-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={16}
                    fill={i <= r.rating ? "#F5B400" : "transparent"}
                    stroke={i <= r.rating ? "#F5B400" : "#9CA3AF"}
                    strokeWidth={1.5}
                  />
                ))}
              </div>
              <p className="text-sm leading-relaxed mb-4" style={{ color: "#374151" }}>
                “{truncate(r.body || r.title || "", 150)}”
              </p>
              <div className="text-sm pt-3 border-t" style={{ borderColor: "#F3F4F6", color: "#1A1A18" }}>
                <span className="font-semibold">{maskName(r.user?.name)}</span>
                {r.businessType && (
                  <span style={{ color: "#6B7280" }}> — {BIZ_LABEL[r.businessType] ?? r.businessType}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
