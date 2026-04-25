import Link from "next/link";
import Image from "next/image";

type BrandSize = "xs" | "sm" | "md" | "lg" | "xl";
type BrandTone = "dark" | "light";

interface BrandLogoProps {
  size?: BrandSize;
  tone?: BrandTone;
  iconOnly?: boolean;
  href?: string | null;
  className?: string;
  showTagline?: boolean;
}

const SIZE_MAP: Record<
  BrandSize,
  { icon: number; gap: string; text: string; cInner: string; tagline: string; cBox: string }
> = {
  xs: { icon: 22, gap: "gap-1.5", text: "text-base", cInner: "text-[0.95em]", tagline: "text-[9px]", cBox: "px-[3px] py-[1px] rounded-[5px]" },
  sm: { icon: 28, gap: "gap-2",   text: "text-lg",  cInner: "text-[0.95em]", tagline: "text-[10px]", cBox: "px-[4px] py-[1px] rounded-md" },
  md: { icon: 36, gap: "gap-2.5", text: "text-xl",  cInner: "text-[0.95em]", tagline: "text-[11px]", cBox: "px-[5px] py-[1.5px] rounded-md" },
  lg: { icon: 44, gap: "gap-3",   text: "text-2xl", cInner: "text-[0.95em]", tagline: "text-[12px]", cBox: "px-[6px] py-[2px] rounded-lg" },
  xl: { icon: 56, gap: "gap-3.5", text: "text-3xl", cInner: "text-[0.95em]", tagline: "text-[12px]", cBox: "px-[7px] py-[2px] rounded-lg" },
};

export default function BrandLogo({
  size = "md",
  tone = "dark",
  iconOnly = false,
  href = "/",
  className = "",
  showTagline = false,
}: BrandLogoProps) {
  const s = SIZE_MAP[size];

  const mainColor = tone === "dark" ? "#0A2E22" : "#FFFFFF";
  const subtleColor = tone === "dark" ? "#5A6B65" : "rgba(255,255,255,0.65)";
  const cBg = tone === "dark"
    ? "linear-gradient(135deg, #0F6E56 0%, #1BAA78 100%)"
    : "linear-gradient(135deg, #1BAA78 0%, #5EECA0 100%)";

  const inner = (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      {/* Icon */}
      <span
        className="relative inline-flex flex-shrink-0"
        style={{ width: s.icon, height: s.icon }}
      >
        <Image
          src="/brand-icon.png"
          alt="BizilCore"
          width={s.icon * 2}
          height={s.icon * 2}
          priority
          className="w-full h-full object-contain"
          style={{ filter: tone === "dark" ? "none" : "drop-shadow(0 2px 6px rgba(0,0,0,0.15))" }}
        />
      </span>

      {/* Wordmark */}
      {!iconOnly && (
        <span className="inline-flex flex-col leading-none">
          <span
            className={`font-extrabold tracking-tight ${s.text} brand-wordmark`}
            style={{
              color: mainColor,
              fontFamily: "var(--font-sora), 'Inter', system-ui, sans-serif",
              letterSpacing: "-0.025em",
            }}
          >
            <span>Bizil</span>
            {/* "C" of Core — special highlighted treatment */}
            <span
              className={`relative inline-flex items-center justify-center align-baseline mx-[1px] ${s.cBox} brand-c`}
              style={{
                background: cBg,
                color: "#FFFFFF",
                boxShadow: tone === "dark"
                  ? "0 2px 8px rgba(15,110,86,0.35), inset 0 1px 0 rgba(255,255,255,0.25)"
                  : "0 2px 10px rgba(27,170,120,0.55), inset 0 1px 0 rgba(255,255,255,0.3)",
                transform: "translateY(-0.04em)",
              }}
            >
              <span
                className={`font-black ${s.cInner}`}
                style={{
                  fontFamily: "var(--font-sora), 'Inter', system-ui, sans-serif",
                  letterSpacing: "-0.04em",
                }}
              >
                C
              </span>
            </span>
            <span>ore</span>
          </span>
          {showTagline && (
            <span
              className={`mt-1 font-semibold uppercase tracking-[0.18em] ${s.tagline}`}
              style={{
                color: subtleColor,
                fontFamily: "var(--font-sora), 'Inter', system-ui, sans-serif",
              }}
            >
              Smart Commerce
            </span>
          )}
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center group" aria-label="BizilCore">
        {inner}
      </Link>
    );
  }

  return inner;
}
