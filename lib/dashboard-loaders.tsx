import type { ComponentType } from "react";

type DashboardModule = { default: ComponentType<Record<string, unknown>> };

const LOADERS = {
  restaurant: () => import("@/components/dashboards/DashboardRestaurant"),
  pharmacy: () => import("@/components/dashboards/DashboardPharmacy"),
  retail: () => import("@/components/dashboards/DashboardRetail"),
  salon: () => import("@/components/dashboards/DashboardSalon"),
  tailor: () => import("@/components/dashboards/DashboardTailor"),
  hotel: () => import("@/components/dashboards/DashboardHotel"),
  garage: () => import("@/components/dashboards/DashboardGarage"),
  lab: () => import("@/components/dashboards/DashboardLab"),
  convention: () => import("@/components/dashboards/DashboardConvention"),
  school: () => import("@/components/dashboards/DashboardSchool"),
  farm: () => import("@/components/dashboards/DashboardFarm"),
  hospital: () => import("@/components/dashboards/DashboardHospital"),
  travel: () => import("@/components/dashboards/DashboardTravel"),
  gym: () => import("@/components/dashboards/DashboardGym"),
  photography: () => import("@/components/dashboards/DashboardPhotography"),
  laundry: () => import("@/components/dashboards/DashboardLaundry"),
  printing: () => import("@/components/dashboards/DashboardPrinting"),
  realestate: () => import("@/components/dashboards/DashboardRealEstate"),
  petshop: () => import("@/components/dashboards/DashboardPetShop"),
  electronics: () => import("@/components/dashboards/DashboardElectronics"),
  kindergarten: () => import("@/components/dashboards/DashboardKindergarten"),
  carrental: () => import("@/components/dashboards/DashboardCarRental"),
  legal: () => import("@/components/dashboards/DashboardLegal"),
  spa: () => import("@/components/dashboards/DashboardSpa"),
  catering: () => import("@/components/dashboards/DashboardCatering"),
  freelance: () => import("@/components/dashboards/DashboardFreelance"),
} as Record<string, () => Promise<DashboardModule>>;

export async function loadBusinessDashboard(businessType: string) {
  const loader = LOADERS[businessType];
  if (!loader) return null;
  const mod = await loader();
  return mod.default;
}

export function BusinessDashboardSkeleton() {
  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-6 animate-pulse">
      <div className="rounded-2xl h-36" style={{ background: "linear-gradient(135deg, #0F6E56 0%, #0A5442 55%, #083D31 100%)", opacity: 0.4 }} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-2xl h-24 card-stat" />
        ))}
      </div>
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="rounded-2xl h-64 card-stat lg:col-span-2" />
        <div className="rounded-2xl h-64 card-stat" />
      </div>
    </div>
  );
}
