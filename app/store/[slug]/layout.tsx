import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getThemeConfig, FONT_URLS } from "@/lib/themes";
import { StoreThemeProvider } from "@/components/store/ThemeProvider";
import { DynamicNav } from "@/components/store/DynamicNav";
import { StoreFooter } from "@/components/store/StoreFooter";
import { StoreVisitTracker } from "@/components/store/StoreVisitTracker";
import { FloatingWhatsApp } from "@/components/store/FloatingWhatsApp";
import { StoreCustomerProvider } from "@/components/store/StoreCustomerProvider";
import { StorePixelTracker } from "@/components/store/StorePixelTracker";
import { StoreAnnouncementBar } from "@/components/store/StoreAnnouncementBar";
import { ExitIntentPopup } from "@/components/store/ExitIntentPopup";
import { PwaInstallBanner } from "@/components/store/PwaInstallBanner";

async function getStoreCategories(shopId: string): Promise<string[]> {
  const products = await prisma.product.findMany({
    where: { shopId, storeVisible: true, category: { not: null } },
    select: { category: true },
    distinct: ["category"],
  });
  return products.map(p => p.category!).filter(Boolean);
}

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
      storeDhakaFee: true,
      storeSocialFB: true,
      storeSocialIG: true,
      storeSocialWA: true,
      storeFbPixelId: true,
      storeGoogleAnalyticsId: true,
      storeTiktokPixelId: true,
      storePwaEnabled: true,
      storeAnnouncementBar: true,
      storeAnnouncementEndsAt: true,
      storeSocialProofEnabled: true,
      storeExitPopupEnabled: true,
      storeExitPopupCoupon: true,
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

  const categories = await getStoreCategories(shop.id);

  const theme = getThemeConfig(shop.storeTheme ?? "minimal");
  const primary = shop.storePrimaryColor || theme.colors.primary;
  const accent = shop.storeAccentColor || theme.colors.accent;

  const fontUrls = Array.from(
    new Set([
      FONT_URLS[theme.typography.fontHeading],
      FONT_URLS[theme.typography.fontBody],
    ].filter(Boolean))
  );

  const waNumber = shop.storeSocialWA || shop.phone;

  return (
    <>
      {shop.storePwaEnabled && (
        <link rel="manifest" href={`/store/${slug}/manifest.webmanifest`} />
      )}
      {fontUrls.map(url => (
        <link key={url} rel="stylesheet" href={url} />
      ))}
      <StoreThemeProvider theme={theme} primary={primary} accent={accent}>
        <div
          className="min-h-screen flex flex-col"
          style={{
            backgroundColor: "#ffffff",
            color: "#111827",
            fontFamily: `"${theme.typography.fontBody}", sans-serif`,
          }}
        >
          <StoreVisitTracker slug={slug} />
          <StoreCustomerProvider />
          <StorePixelTracker
            fbPixelId={shop.storeFbPixelId}
            gaId={shop.storeGoogleAnalyticsId}
            tiktokPixelId={shop.storeTiktokPixelId}
          />
          <StoreAnnouncementBar message={shop.storeAnnouncementBar ?? ""} expiresAt={shop.storeAnnouncementEndsAt?.toISOString()} />
          <DynamicNav shop={{ ...shop, storeSlug: shop.storeSlug!, storeFreeShipping: !!shop.storeFreeShipping }} categories={categories} />
          <main className="flex-1">{children}</main>
          <StoreFooter shop={{ ...shop, storeSlug: shop.storeSlug!, storeFreeShipping: !!shop.storeFreeShipping }} />
          <FloatingWhatsApp whatsappNumber={waNumber} shopName={shop.name} primary={primary} />
          <ExitIntentPopup slug={slug} enabled={shop.storeExitPopupEnabled} couponCode={shop.storeExitPopupCoupon} />
          <PwaInstallBanner enabled={shop.storePwaEnabled} />
        </div>
      </StoreThemeProvider>
    </>
  );
}
