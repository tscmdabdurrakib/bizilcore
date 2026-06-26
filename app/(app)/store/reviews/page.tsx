"use client";

import { useEffect, useState } from "react";
import { Star, Loader2, Check, X, Package } from "lucide-react";
import { PageShell, Tabs, Card, Badge, Button, EmptyState } from "@/components/ui";

interface StoreReview {
  id: string;
  reviewerName: string;
  rating: number;
  comment: string | null;
  isApproved: boolean;
  createdAt: string;
  product: { id: string; name: string; imageUrl: string | null } | null;
}

export default function StoreReviewsPage() {
  const [reviews, setReviews] = useState<StoreReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<"pending" | "approved" | "all">("pending");
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  }

  async function fetchReviews() {
    const r = await fetch("/api/store/reviews");
    if (r.ok) {
      const d = await r.json();
      setReviews(Array.isArray(d) ? d : d.reviews ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { fetchReviews(); }, []);

  async function updateReview(id: string, isApproved: boolean) {
    setUpdating(id);
    const r = await fetch(`/api/store/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isApproved }),
    });
    setUpdating(null);
    if (r.ok) {
      setReviews(rs => rs.map(r => r.id === id ? { ...r, isApproved } : r));
      showToast("success", isApproved ? "অনুমোদিত হয়েছে ✓" : "প্রত্যাখ্যান করা হয়েছে");
    } else {
      showToast("error", "আপডেট করা যায়নি");
    }
  }

  const filtered = reviews.filter(r => {
    if (filterTab === "pending") return !r.isApproved;
    if (filterTab === "approved") return r.isApproved;
    return true;
  });

  const pendingCount = reviews.filter(r => !r.isApproved).length;
  const approvedCount = reviews.filter(r => r.isApproved).length;

  function renderStars(rating: number) {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={12} style={{ color: i < rating ? "#F59E0B" : "var(--c-border)" }} fill={i < rating ? "#F59E0B" : "none"} />
    ));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 size={24} className="animate-spin" style={{ color: "var(--c-text-muted)" }} />
      </div>
    );
  }

  return (
    <PageShell
      title="রিভিউ পর্যালোচনা"
      subtitle={`${pendingCount}টি অপেক্ষমান · ${approvedCount}টি অনুমোদিত`}
      className="max-w-3xl"
    >
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl text-white text-sm font-medium shadow-lg"
          style={{ backgroundColor: toast.type === "success" ? "#1D9E75" : "#E24B4A" }}>
          {toast.msg}
        </div>
      )}

      <Tabs
        tabs={[
          { key: "pending", label: `অপেক্ষমান (${pendingCount})` },
          { key: "approved", label: `অনুমোদিত (${approvedCount})` },
          { key: "all", label: "সব" },
        ]}
        active={filterTab}
        onChange={(k) => setFilterTab(k as typeof filterTab)}
      />

      {filtered.length === 0 ? (
        <EmptyState icon={Star} title="কোনো রিভিউ নেই" />
      ) : (
        <div className="space-y-3">
          {filtered.map(review => (
            <Card key={review.id} padding="md">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <p className="text-sm font-semibold" style={{ color: "var(--c-text)" }}>{review.reviewerName}</p>
                    <div className="flex items-center gap-0.5">{renderStars(review.rating)}</div>
                    <Badge variant={review.isApproved ? "success" : "warning"} className="ml-auto">
                      {review.isApproved ? "অনুমোদিত" : "অপেক্ষমান"}
                    </Badge>
                  </div>

                  {review.product && (
                    <div className="flex items-center gap-2 mb-2 p-2 rounded-lg" style={{ backgroundColor: "var(--c-surface-raised)" }}>
                      <div className="w-7 h-7 rounded-md overflow-hidden flex-shrink-0" style={{ backgroundColor: "var(--c-border)" }}>
                        {review.product.imageUrl
                          ? <img src={review.product.imageUrl} alt={review.product.name} className="w-full h-full object-cover" />
                          : <Package size={12} className="m-auto mt-1" style={{ color: "var(--c-text-muted)" }} />
                        }
                      </div>
                      <p className="text-xs font-medium truncate" style={{ color: "var(--c-text-sub)" }}>{review.product.name}</p>
                    </div>
                  )}

                  {review.comment && (
                    <p className="text-sm" style={{ color: "var(--c-text-sub)" }}>{review.comment}</p>
                  )}

                  <p className="text-xs mt-2" style={{ color: "var(--c-text-muted)" }}>
                    {new Date(review.createdAt).toLocaleDateString("bn-BD", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>

              {!review.isApproved && (
                <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: "var(--c-border)" }}>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    icon={Check}
                    onClick={() => updateReview(review.id, true)}
                    disabled={updating === review.id}
                  >
                    অনুমোদন
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1"
                    icon={X}
                    onClick={() => updateReview(review.id, false)}
                    disabled={updating === review.id}
                  >
                    প্রত্যাখ্যান
                  </Button>
                </div>
              )}

              {review.isApproved && (
                <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--c-border)" }}>
                  <Button
                    variant="danger"
                    size="sm"
                    icon={X}
                    onClick={() => updateReview(review.id, false)}
                    disabled={updating === review.id}
                  >
                    প্রত্যাখ্যান করুন
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </PageShell>
  );
}
