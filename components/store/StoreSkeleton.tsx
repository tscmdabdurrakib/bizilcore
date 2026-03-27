"use client";

export function StoreHomeSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="w-full h-64 bg-gray-200" />
      <div className="max-w-6xl mx-auto px-4 mt-8">
        <div className="flex gap-2 mb-6">
          {[1,2,3,4].map(i => <div key={i} className="h-8 w-20 bg-gray-200 rounded-full" />)}
        </div>
        <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden" style={{ backgroundColor: "#F3F4F6" }}>
              <div className="aspect-square bg-gray-200" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 animate-pulse">
      <div className="h-4 w-20 bg-gray-200 rounded mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="aspect-square bg-gray-200 rounded-2xl" />
        <div className="space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          <div className="h-8 bg-gray-200 rounded w-1/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="flex gap-2 mt-4">
            {[1,2,3].map(i => <div key={i} className="h-10 w-16 bg-gray-200 rounded-lg" />)}
          </div>
          <div className="flex gap-3 mt-6">
            <div className="flex-1 h-12 bg-gray-200 rounded-xl" />
            <div className="flex-1 h-12 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
