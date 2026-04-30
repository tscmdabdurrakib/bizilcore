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
}

const SIZE_MAP: Record<
  BrandSize,
  { icon: number; gap: string; text: string; cHeight: string }
> = {
  xs: { icon: 28, gap: "gap-[2px]", text: "text-base",      cHeight: "1.0em" },
  sm: { icon: 34, gap: "gap-[3px]", text: "text-lg",        cHeight: "1.0em" },
  md: { icon: 42, gap: "gap-[4px]", text: "text-[1.35rem]", cHeight: "1.0em" },
  lg: { icon: 50, gap: "gap-[5px]", text: "text-[1.6rem]",  cHeight: "1.0em" },
  xl: { icon: 64, gap: "gap-[6px]", text: "text-[2rem]",    cHeight: "1.0em" },
};

/**
 * Stylized "C" mark — an open ring with a centered dot.
 * Visually reads as the letter "C" but evokes a "core" / target / orbit.
 * Designed to sit on the text baseline matching cap height.
 */
function CoreCMark({ height, color }: { height: string; color: string }) {
  return (
    <svg
      viewBox="0 0 40 44"
      style={{
        height,
        width: "auto",
        display: "inline-block",
        verticalAlign: "-0.07em",
        marginLeft: "0.02em",
        marginRight: "0.02em",
        flexShrink: 0,
      }}
      aria-hidden="true"
    >
      {/* Open ring — the "C" letterform, opening to the right */}
      <path
        d="M 32.5 12.5 A 13 13 0 1 0 32.5 31.5"
        stroke={color}
        strokeWidth="6"
        strokeLinecap="round"
        fill="none"
      />
      {/* Center dot — the "core" */}
      <circle cx="19.5" cy="22" r="3.4" fill={color} />
    </svg>
  );
}

export default function BrandLogo({
  size = "md",
  tone = "dark",
  iconOnly = false,
  href = "/",
  className = "",
}: BrandLogoProps) {
  const s = SIZE_MAP[size];

  const mainColor = tone === "dark" ? "#0A2A20" : "#FFFFFF";
  const accentColor = tone === "dark" ? "#0F6E56" : "#5EECA0";

  const inner = (
    <span className={`inline-flex items-center ${s.gap} ${className}`}>
      {/* Icon — original brand mark, no spacing fluff */}
      <span
        className="relative inline-flex flex-shrink-0"
        style={{ width: s.icon, height: s.icon }}
      >
        <Image
          src="/brand-icon.svg"
          alt="BizilCore"
          width={s.icon * 2}
          height={s.icon * 2}
          priority
          className="w-full h-full object-contain"
        />
      </span>

      {/* Wordmark — Sora font, tight tracking, professional look */}
      {!iconOnly && (
        <span
          className={`font-bold leading-none whitespace-nowrap ${s.text}`}
          style={{
            color: mainColor,
            fontFamily: "var(--font-sora), 'Inter', system-ui, sans-serif",
            letterSpacing: "-0.035em",
          }}
        >
          Bizil
          <CoreCMark height={s.cHeight} color={accentColor} />
          ore
        </span>
      )}
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center" aria-label="BizilCore">
        {inner}
      </Link>
    );
  }

  return inner;
}
