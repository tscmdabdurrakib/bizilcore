import Link from "next/link";
import { ArrowRight } from "lucide-react";

const C = { primary: "#0F6E56" };

export function BlogCtaSection() {
  return (
    <section
      style={{
        background: `linear-gradient(135deg, #0A5240 0%, #0F6E56 60%, #1A9472 100%)`,
      }}
      className="relative overflow-hidden"
    >
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 md:py-24 text-center relative z-10">
        <h2 className="text-3xl md:text-4xl font-bold mb-5 text-white font-display">
          আজই শুরু করুন — বিনামূল্যে
        </h2>
        <p className="mb-10 text-white/80 text-lg max-w-xl mx-auto">
          ১০,০০০+ seller ইতিমধ্যে ব্যবহার করছেন। কোনো credit card লাগবে না। ২ মিনিটে setup।
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-white font-semibold text-lg transition-all hover:bg-green-50 shadow-xl"
            style={{ color: C.primary }}
          >
            বিনামূল্যে সাইনআপ করুন
            <ArrowRight size={20} />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg border border-white/40 text-white hover:bg-white/10 transition-all"
          >
            প্ল্যান দেখুন
          </Link>
        </div>
        <p className="mt-6 text-white/60 text-sm">
          Free plan চিরকালের জন্য বিনামূল্যে। Upgrade করুন যখন দরকার।
        </p>
      </div>
    </section>
  );
}
