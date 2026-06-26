"use client";

import { SessionProvider } from "next-auth/react";
import ImpersonationBanner from "@/app/admin/components/ImpersonationBanner";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <ImpersonationBanner />
    </SessionProvider>
  );
}
