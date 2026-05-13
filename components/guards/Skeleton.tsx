export default function Skeleton() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="h-16 bg-brand-navyLight" />
      <div className="flex">
        <div className="w-64 h-screen bg-brand-navyDeep" />
        <div className="flex-1 p-8 space-y-4">
          <div className="h-8 bg-brand-navyLight rounded w-1/3" />
          <div className="h-32 bg-brand-navyLight rounded" />
          <div className="h-32 bg-brand-navyLight rounded" />
        </div>
      </div>
    </div>
  );
}
