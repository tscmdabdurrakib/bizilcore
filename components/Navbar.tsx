"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E8E6DF" }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="BizilCore" className="w-8 h-8" />
            <span
              className="text-lg tracking-tight"
              style={{
                fontWeight: 800,
                background: "linear-gradient(120deg, #0A5240 0%, #0F6E56 40%, #1BAA78 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                letterSpacing: "-0.02em",
              }}
            >
              BizilCore
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {[
              { href: "/features", label: "ফিচার" },
              { href: "/pricing", label: "প্রাইসিং" },
              { href: "/about", label: "আমাদের সম্পর্কে" },
              { href: "/blog", label: "ব্লগ" },
              { href: "/contact", label: "যোগাযোগ" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm hover:opacity-80 transition-opacity"
                style={{ color: "#5A5A56" }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium px-4 py-2 rounded-lg border transition-colors hover:bg-gray-50"
              style={{ color: "#1A1A18", borderColor: "#E8E6DF" }}
            >
              লগইন
            </Link>
            <Link
              href="/signup"
              className="text-sm font-medium px-4 py-2 rounded-lg text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: "#0F6E56" }}
            >
              বিনামূল্যে শুরু করুন
            </Link>
          </div>

          <button
            className="md:hidden p-2 rounded-lg"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ color: "#1A1A18" }}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-4 border-t" style={{ borderColor: "#E8E6DF" }}>
            <div className="flex flex-col gap-1 pt-3">
              {[
                { href: "/features", label: "ফিচার" },
                { href: "/pricing", label: "প্রাইসিং" },
                { href: "/about", label: "আমাদের সম্পর্কে" },
                { href: "/blog", label: "ব্লগ" },
                { href: "/contact", label: "যোগাযোগ" },
              ].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-2 py-2.5 text-sm rounded-lg hover:bg-gray-50"
                  style={{ color: "#5A5A56" }}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-2">
                <Link
                  href="/login"
                  className="text-sm font-medium px-4 py-2.5 rounded-lg border text-center"
                  style={{ borderColor: "#E8E6DF", color: "#1A1A18" }}
                  onClick={() => setMobileOpen(false)}
                >
                  লগইন
                </Link>
                <Link
                  href="/signup"
                  className="text-sm font-medium px-4 py-2.5 rounded-lg text-white text-center"
                  style={{ backgroundColor: "#0F6E56" }}
                  onClick={() => setMobileOpen(false)}
                >
                  বিনামূল্যে শুরু করুন
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
