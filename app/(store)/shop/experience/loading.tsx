export default function ExperienceLoading() {
  return (
    <div className="fixed inset-0 z-[60] bg-neutral-950 overflow-hidden">
      <div className="w-full h-full relative flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-sm text-white/50">Loading experience…</p>
        </div>
      </div>
    </div>
  )
}

/** Reusable skeleton for Suspense fallbacks */
export function ExperienceLoadingSkeleton() {
  return (
    <div className="flex h-full w-full items-center justify-center bg-neutral-950">
      <div className="flex flex-col items-center gap-6">
        <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        <p className="text-sm text-white/50">Loading experience…</p>
      </div>
    </div>
  )
}
