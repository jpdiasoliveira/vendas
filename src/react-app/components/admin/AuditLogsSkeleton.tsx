export const AuditLogsSkeleton = () => (
  <div className="divide-y divide-[#1B4332]/10">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex animate-pulse gap-3 px-5 py-4">
        <div className="h-9 w-9 shrink-0 rounded-xl bg-[#1B4332]/15" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-48 rounded bg-[#1B4332]/10" />
          <div className="h-3 w-32 rounded bg-[#1B4332]/10" />
        </div>
      </div>
    ))}
  </div>
);
