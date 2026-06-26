"use client";

const AVATAR_COLORS = ["#0F6E56", "#2563EB", "#7C3AED", "#D97706", "#DC2626", "#059669", "#0891B2"];

function avatarBg(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[Math.abs(h)];
}

export function InvoiceAvatar({ name, size = 10 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold"
      style={{
        backgroundColor: avatarBg(name),
        width: size * 4,
        height: size * 4,
        fontSize: size < 10 ? 11 : 13,
      }}
    >
      {initials}
    </div>
  );
}
