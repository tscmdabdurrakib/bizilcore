"use client";

import type { ReactNode } from "react";

interface Props {
  main: ReactNode;
  sidebar: ReactNode;
  mobileAlerts?: ReactNode;
}

export default function ShopsDashboardGrid({ main, sidebar, mobileAlerts }: Props) {
  return (
    <div className="space-y-4">
      {mobileAlerts && (
        <div className="lg:hidden space-y-3">{mobileAlerts}</div>
      )}
      <div className="grid lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8 min-w-0">{main}</div>
        <div className="hidden lg:block lg:col-span-4 min-w-0">{sidebar}</div>
      </div>
    </div>
  );
}
