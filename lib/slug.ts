export function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 40) || "shop";
}

export function normalizeSlugStrict(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 40);
}

export async function generateUniqueSlug(
  base: string,
  prisma: { shop: { findUnique: (a: { where: { slug: string } }) => Promise<unknown> } }
): Promise<string> {
  const baseSlug = normalizeSlugStrict(base) || "shop";
  let slug = baseSlug;
  let i = 1;
  while (await prisma.shop.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${i++}`;
  }
  return slug;
}
