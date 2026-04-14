"use client";

import Link from "next/link";
import { Facebook, Instagram, Twitter, Github, Youtube } from "lucide-react";

interface StoreShop {
  name: string;
  phone: string | null;
  storeSlug: string;
  storeSocialFB: string | null;
  storeSocialIG: string | null;
  storeSocialWA: string | null;
  storeAbout: string | null;
  storeFreeShipping: boolean | null;
  storeCODEnabled: boolean | null;
  storeBkashNumber: string | null;
  storeNagadNumber: string | null;
}

interface Props { shop: StoreShop; }

const FOOTER_COLS = [
  {
    title: "COMPANY",
    links: ["About", "Features", "Works", "Career"],
  },
  {
    title: "HELP",
    links: ["Customer Support", "Delivery Details", "Terms & Conditions", "Privacy Policy"],
  },
  {
    title: "FAQ",
    links: ["Account", "Manage Deliveries", "Orders", "Payments"],
  },
  {
    title: "RESOURCES",
    links: ["Free eBooks", "Development Tutorial", "How to - Blog", "Youtube Playlist"],
  },
];

export function StoreFooter({ shop }: Props) {
  const slug = shop.storeSlug;
  const year = new Date().getFullYear();

  const socials = [
    { href: shop.storeSocialFB || "#", Icon: Facebook, label: "Facebook" },
    { href: "#", Icon: Twitter, label: "Twitter" },
    { href: shop.storeSocialIG || "#", Icon: Instagram, label: "Instagram" },
    { href: "#", Icon: Github, label: "Github" },
    { href: "#", Icon: Youtube, label: "Youtube" },
  ];

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-8">

        {/* Main grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8 mb-10">

          {/* Brand col */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1">
            <Link href={`/store/${slug}`}>
              <span className="text-xl font-black text-black uppercase tracking-tight">{shop.name}</span>
            </Link>
            <p className="text-sm text-gray-500 mt-4 leading-relaxed max-w-[220px]">
              {shop.storeAbout || "We have clothes that suits your style and which you're proud to wear. From women to men."}
            </p>

            {/* Social icons */}
            <div className="flex gap-2.5 mt-6">
              {socials.map(({ href, Icon, label }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label}
                  className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-black hover:text-black transition-colors">
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {FOOTER_COLS.map(col => (
            <div key={col.title}>
              <h4 className="text-sm font-bold text-black tracking-wider mb-5">{col.title}</h4>
              <ul className="space-y-3.5">
                {col.links.map(l => (
                  <li key={l}>
                    <Link href={`/store/${slug}`}
                      className="text-sm text-gray-500 hover:text-black transition-colors">
                      {l}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-gray-500 order-2 sm:order-1">
            Shop.co © 2000-{year}, All Rights Reserved
          </p>

          {/* Payment badges */}
          <div className="flex items-center gap-2 order-1 sm:order-2 flex-wrap justify-center">
            {[
              { label: "VISA",       bg: "#1A1F71", color: "#fff" },
              { label: "Mastercard", bg: "#EB001B", color: "#fff" },
              { label: "bKash",      bg: "#E2136E", color: "#fff" },
              { label: "Nagad",      bg: "#F7941D", color: "#fff" },
              { label: "COD",        bg: "#111",    color: "#fff" },
            ].map(m => (
              <span key={m.label}
                className="text-[11px] font-bold px-3 py-1.5 rounded-md"
                style={{ backgroundColor: m.bg, color: m.color }}>
                {m.label}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
