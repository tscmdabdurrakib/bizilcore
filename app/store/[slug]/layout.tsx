import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getThemeConfig, FONT_URLS } from "@/lib/themes";
import { StoreThemeProvider } from "@/components/store/ThemeProvider";
import { DynamicNav } from "@/components/store/DynamicNav";
import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreVisitTracker } from "@/components/store/StoreVisitTracker";

async function getStoreShop(slug: string) {
  return prisma.shop.findUnique({
    where: { storeSlug: slug },
    select: {
      id: true,
      name: true,
      logoUrl: true,
      phone: true,
      storeSlug: true,
      storeEnabled: true,
      storeTheme: true,
      storePrimaryColor: true,
      storeAccentColor: true,
      storeBannerUrl: true,
      storeTagline: true,
      storeAbout: true,
      storeShowReviews: true,
      storeShowStock: true,
      storeCODEnabled: true,
      storeBkashNumber: true,
      storeNagadNumber: true,
      storeMinOrder: true,
      storeFreeShipping: true,
      storeShippingFee: true,
      storeSocialFB: true,
      storeSocialIG: true,
      storeSocialWA: true,
    },
  });
}

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const shop = await getStoreShop(slug);

  if (!shop || !shop.storeEnabled) notFound();

  const theme = getThemeConfig(shop.storeTheme ?? "minimal");
  const primary = shop.storePrimaryColor || theme.colors.primary;
  const accent = shop.storeAccentColor || theme.colors.accent;

  const fontUrls = Array.from(
    new Set([
      FONT_URLS[theme.typography.fontHeading],
      FONT_URLS[theme.typography.fontBody],
    ].filter(Boolean))
  );

  return (
    <>
      {fontUrls.map(url => (
        <link key={url} rel="stylesheet" href={url} />
      ))}
      <StoreThemeProvider theme={theme} primary={primary} accent={accent}>
        <div
          className="min-h-screen flex flex-col"
          style={{
            backgroundColor: "#f9fafb",
            color: "#111827",
            fontFamily: `"${theme.typography.fontBody}", sans-serif`,
          }}
        >
          <StoreVisitTracker slug={slug} />
          <DynamicNav shop={{ ...shop, storeSlug: shop.storeSlug! }} />
          <main className="flex-1">{children}</main>
          <StoreFooter shop={{ ...shop, storeSlug: shop.storeSlug! }} />
        </div>
      </StoreThemeProvider>
    </>
  );
}
