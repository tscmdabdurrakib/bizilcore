import { StatCardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function FbOrdersLoading() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => <StatCardSkeleton key={i} />)}
      </div>
      <TableSkeleton rows={6} cols={6} />
    </div>
  );
}
