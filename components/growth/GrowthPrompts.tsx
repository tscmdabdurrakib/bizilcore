"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const ReviewModal = dynamic(() => import("./ReviewModal"), { ssr: false });
const NPSBanner = dynamic(() => import("./NPSBanner"), { ssr: false });

const REVIEW_DISMISS_KEY = "review_dismissed_until";
const NPS_DISMISS_KEY = "nps_dismissed_at";
const NPS_LOCAL_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days local snooze
const SESSION_REVIEW_KEY = "review_shown_in_session";
const SESSION_NPS_KEY = "nps_shown_in_session";

export default function GrowthPrompts() {
  const [showReview, setShowReview] = useState(false);
  const [showNps, setShowNps] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function check() {
      // ── Review prompt ───────────────────────────────────────────
      // Always check the server first — admin requests must override
      // any local dismiss flag (server is the source of truth).
      try {
        const shownThisSession = sessionStorage.getItem(SESSION_REVIEW_KEY) === "1";
        if (!shownThisSession) {
          const res = await fetch("/api/reviews/eligibility");
          if (res.ok) {
            const data = await res.json();
            if (data.eligible && !cancelled) {
              const dismissUntil = Number(localStorage.getItem(REVIEW_DISMISS_KEY) || 0);
              const adminOverride = data.reason === "admin_requested";
              // Honor local snooze only when admin hasn't explicitly requested
              if (adminOverride || Date.now() > dismissUntil) {
                // Admin override clears any old local snooze so the user
                // doesn't get blocked next session by a stale flag.
                if (adminOverride) {
                  try { localStorage.removeItem(REVIEW_DISMISS_KEY); } catch {}
                }
                sessionStorage.setItem(SESSION_REVIEW_KEY, "1");
                setShowReview(true);
                return; // don't also show NPS in same session
              }
            }
          }
        }
      } catch {
        /* ignore */
      }

      // ── NPS banner ──────────────────────────────────────────────
      try {
        const lastDismiss = Number(localStorage.getItem(NPS_DISMISS_KEY) || 0);
        const shownThisSession = sessionStorage.getItem(SESSION_NPS_KEY) === "1";
        if (Date.now() - lastDismiss > NPS_LOCAL_COOLDOWN_MS && !shownThisSession) {
          const res = await fetch("/api/nps/eligibility");
          if (res.ok) {
            const data = await res.json();
            if (data.eligible && !cancelled) {
              sessionStorage.setItem(SESSION_NPS_KEY, "1");
              setShowNps(true);
            }
          }
        }
      } catch {
        /* ignore */
      }
    }

    // Defer until after first paint to keep dashboard load snappy
    const t = setTimeout(check, 1500);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  return (
    <>
      {showNps && (
        <div className="px-5 pt-3">
          <NPSBanner onDismiss={() => setShowNps(false)} />
        </div>
      )}
      {showReview && <ReviewModal onClose={() => setShowReview(false)} />}
    </>
  );
}
