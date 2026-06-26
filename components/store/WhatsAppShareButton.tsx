"use client";

interface Props {
  productName: string;
  whatsappNumber?: string | null;
  slug: string;
  productId: string;
}

export function WhatsAppShareButton({ productName, whatsappNumber, slug, productId }: Props) {
  if (!whatsappNumber) return null;

  const phone = whatsappNumber.replace(/[^0-9]/g, "");
  const url = typeof window !== "undefined" ? window.location.origin : "";
  const message = encodeURIComponent(
    `আমি "${productName}" কিনতে/chai। ${url}/store/${slug}/products/${productId}`,
  );

  return (
    <a
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-20 right-4 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full text-white text-xs font-bold shadow-lg md:hidden"
      style={{ backgroundColor: "#25D366" }}
    >
      WhatsApp অর্ডার
    </a>
  );
}
