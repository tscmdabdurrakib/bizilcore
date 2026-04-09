export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl p-5 border bg-white">
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-8 w-8 rounded-xl" />
      </div>
      <Skeleton className="h-8 w-24 mb-2" />
      <Skeleton className="h-3 w-20" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <Skeleton className="h-24 w-full rounded-2xl" />
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
      </div>
    </div>
  );
}

export function TableRowSkeleton({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {[...Array(cols)].map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-2xl border bg-white overflow-hidden">
      <div className="p-4 border-b flex gap-3">
        <Skeleton className="h-9 w-64 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
        <Skeleton className="ml-auto h-9 w-28 rounded-xl" />
      </div>
      <table className="w-full">
        <tbody>
          {[...Array(rows)].map((_, i) => <TableRowSkeleton key={i} cols={cols} />)}
        </tbody>
      </table>
    </div>
  );
}

export function OrdersPageSkeleton() {
  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <TableSkeleton rows={8} cols={6} />
    </div>
  );
}

export function InventoryPageSkeleton() {
  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="rounded-2xl border bg-white p-3">
            <Skeleton className="h-36 w-full rounded-xl mb-3" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CustomersPageSkeleton() {
  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <TableSkeleton rows={10} cols={5} />
    </div>
  );
}

export function ReportsPageSkeleton() {
  return (
    <div className="space-y-5 p-6">
      <Skeleton className="h-7 w-44" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        <Skeleton className="h-72 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
      <Skeleton className="h-72 w-full rounded-2xl" />
    </div>
  );
}

export function HisabPageSkeleton() {
  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <TableSkeleton rows={8} cols={5} />
    </div>
  );
}

export function TasksPageSkeleton() {
  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <div className="flex gap-2 mb-2">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-20 rounded-full" />)}
      </div>
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
      </div>
    </div>
  );
}

export function GenericPageSkeleton() {
  return (
    <div className="space-y-5 p-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <StatCardSkeleton key={i} />)}
      </div>
      <TableSkeleton rows={8} cols={5} />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex gap-2">
        <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce [animation-delay:-0.3s]" />
        <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce [animation-delay:-0.15s]" />
        <div className="w-2 h-2 bg-green-600 rounded-full animate-bounce" />
      </div>
    </div>
  );
}
