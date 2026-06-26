export default function ShopsPageSkeleton() {
  const block = "animate-pulse rounded-2xl";
  const bg = { backgroundColor: "var(--c-surface)" };

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-24 md:pb-6">
      <div className={`h-36 w-full ${block}`} style={bg} />
      <div className="grid lg:grid-cols-12 gap-5">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`h-10 w-24 rounded-xl ${block}`} style={bg} />
            ))}
          </div>
          <div className={`h-10 w-full rounded-xl ${block}`} style={bg} />
          <div className="grid sm:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`h-44 ${block}`} style={bg} />
            ))}
          </div>
        </div>
        <div className="lg:col-span-4 space-y-4 hidden lg:block">
          {[1, 2, 3].map(i => (
            <div key={i} className={`h-32 ${block}`} style={bg} />
          ))}
        </div>
      </div>
    </div>
  );
}
