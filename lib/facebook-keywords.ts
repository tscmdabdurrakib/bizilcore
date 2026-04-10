export const KEYWORDS = [
  "order", "অর্ডার", "কিনতে চাই", "নিব", "দেন",
  "buy", "want", "নিতে চাই", "কিনব", "পাঠান",
  "price", "দাম", "কত", "পাইকারি", "চাই", "লাগবে",
  "inbox", "ইনবক্স", "বুক", "confirm", "কনফার্ম",
];

export function hasOrderKeyword(text: string): boolean {
  const lower = text.toLowerCase();
  return KEYWORDS.some((kw) => lower.includes(kw.toLowerCase()));
}
