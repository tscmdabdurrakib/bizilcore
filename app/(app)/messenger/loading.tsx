import { StatCardSkeleton, TableSkeleton } from "@/components/ui/Skeleton";

export default function MessengerLoading() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => <StatCardSkeleton key={i} />)}
      </div>
      <TableSkeleton rows={5} cols={4} />
    </div>
  );
}
