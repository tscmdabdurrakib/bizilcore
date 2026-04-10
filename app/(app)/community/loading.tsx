import { Skeleton } from "@/components/ui/Skeleton";

export default function CommunityLoading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-9 h-9 rounded-xl" />
          <div className="space-y-1">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-7 w-28 rounded-full" />
      </div>
      <div className="grid lg:grid-cols-[1fr_280px] gap-5">
        <div className="space-y-4">
          <Skeleton className="h-36 w-full rounded-2xl" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl border p-4 animate-pulse" style={{ borderColor: "var(--c-border)" }}>
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
              </div>
              <Skeleton className="h-3 w-full mb-2" />
              <Skeleton className="h-3 w-4/5 mb-2" />
              <Skeleton className="h-3 w-3/5 mb-4" />
              <div className="flex gap-3">
                <Skeleton className="h-8 w-16 rounded-xl" />
                <Skeleton className="h-8 w-24 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
        <div className="hidden lg:block">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
