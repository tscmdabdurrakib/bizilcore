const BN_DIGITS: Record<string, string> = {
  "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
  "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
};

export function normalizeDigits(input: string): string {
  return input.replace(/[০-৯]/g, (d) => BN_DIGITS[d] ?? d);
}

const PHONE_RE = /(?:\+?88)?0?1[3-9]\d{8}/g;

export function extractPhones(text: string): string[] {
  const norm = normalizeDigits(text).replace(/[\s\-()]/g, "");
  const found = norm.match(PHONE_RE) ?? [];
  const out = new Set<string>();
  for (const raw of found) {
    let n = raw.replace(/^\+?88/, "");
    if (!n.startsWith("0")) n = "0" + n;
    if (n.length === 11) out.add(n);
  }
  return Array.from(out);
}

const ADDRESS_HINTS = [
  "ঠিকানা", "address", "এড্রেস", "এড্রেসঃ", "ঠিকানাঃ",
  "জেলা", "থানা", "উপজেলা", "ইউনিয়ন", "গ্রাম", "বাসা",
];

export function extractAddress(text: string): string | null {
  const lines = text.split(/\n|।|,/).map((l) => l.trim()).filter(Boolean);
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (ADDRESS_HINTS.some((h) => lower.includes(h.toLowerCase()))) {
      const cleaned = line.replace(/^(ঠিকানা|address|এড্রেস)[ঃ:\s-]*/i, "").trim();
      if (cleaned.length > 3) return cleaned;
    }
  }
  return null;
}

export function extractContactInfo(text: string): { phones: string[]; address: string | null } {
  return {
    phones:  extractPhones(text),
    address: extractAddress(text),
  };
}
