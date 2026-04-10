"use client";

import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

interface Props {
  whatsappNumber: string | null;
  shopName: string;
  primary: string;
}

export function FloatingWhatsApp({ whatsappNumber, shopName, primary }: Props) {
  const [open, setOpen] = useState(false);

  if (!whatsappNumber) return null;

  const clean = whatsappNumber.replace(/[^0-9]/g, "");
  const intl = clean.startsWith("0") ? "880" + clean.slice(1) : clean;
  const url = `https://wa.me/${intl}?text=${encodeURIComponent(`হ্যালো ${shopName}! আমি কিছু জানতে চাইছি।`)}`;

  return (
    <div className="fixed bottom-6 right-5 z-50 flex flex-col items-end gap-3">
      {open && (
        <div
          className="bg-white rounded-2xl shadow-2xl border p-4 w-64 text-sm animate-in slide-in-from-bottom-3 duration-200"
          style={{ borderColor: "#E5E7EB" }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: "#25D366" }}>
                <MessageCircle size={18} color="white" />
              </div>
              <div>
                <p className="font-bold text-sm text-gray-900">{shopName}</p>
                <p className="text-xs text-green-600">● অনলাইন</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
              <X size={16} />
            </button>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 mb-3 text-xs text-gray-600 leading-5">
            হ্যালো! 👋 আমি কীভাবে আপনাকে সাহায্য করতে পারি? WhatsApp এ মেসেজ করুন।
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-white font-bold text-sm"
            style={{ backgroundColor: "#25D366" }}
            onClick={() => setOpen(false)}
          >
            <MessageCircle size={16} />
            WhatsApp এ চ্যাট করুন
          </a>
        </div>
      )}

      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-110"
        style={{ backgroundColor: "#25D366" }}
        aria-label="WhatsApp"
      >
        {open ? (
          <X size={24} color="white" />
        ) : (
          <svg viewBox="0 0 32 32" width="26" height="26" fill="white">
            <path d="M16.004 0C7.164 0 0 7.163 0 16.003c0 2.824.738 5.574 2.139 7.998L.049 31.998l8.23-2.062A15.958 15.958 0 0016.004 32C24.836 32 32 24.837 32 16.003 32 7.163 24.836 0 16.004 0zm0 29.28a13.25 13.25 0 01-6.769-1.85l-.485-.286-5.026 1.26 1.293-4.879-.32-.503A13.232 13.232 0 012.72 16.003c0-7.33 5.963-13.29 13.284-13.29 7.325 0 13.29 5.96 13.29 13.29C29.294 23.32 23.33 29.28 16.004 29.28zm7.28-9.937c-.399-.2-2.36-1.163-2.725-1.297-.365-.133-.63-.2-.896.2-.265.398-1.03 1.297-1.263 1.562-.232.265-.465.3-.864.1-.4-.2-1.688-.622-3.214-1.983-1.188-1.059-1.99-2.367-2.222-2.766-.232-.4-.025-.616.175-.815.18-.18.4-.465.6-.698.198-.232.264-.399.397-.664.133-.265.066-.498-.033-.698-.1-.2-.897-2.162-1.23-2.96-.323-.779-.65-.673-.897-.686l-.763-.013a1.466 1.466 0 00-1.063.498c-.365.398-1.395 1.363-1.395 3.323 0 1.96 1.43 3.853 1.629 4.119.2.265 2.812 4.292 6.813 6.02.952.41 1.695.656 2.274.839.956.304 1.826.261 2.514.158.767-.115 2.36-.965 2.692-1.896.333-.93.333-1.73.233-1.896-.1-.167-.365-.267-.764-.466z"/>
          </svg>
        )}
      </button>
    </div>
  );
}
