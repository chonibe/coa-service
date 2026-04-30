/**
 * Branded hero band when a synced article has no hero image yet.
 * See docs/features/street-collector/blog-enrichment/README.md.
 */
export function HeroFallback({ title, tags }: { title: string; tags: string[] }) {
  const label = tags[0] ?? 'Street Collector'
  return (
    <div className="w-full overflow-hidden bg-gradient-to-br from-[#1a1a1a] via-[#2d2d2d] to-[#047AFF]/30">
      <div className="max-w-[1400px] mx-auto relative aspect-[21/9] sm:aspect-[16/7] flex flex-col justify-end p-6 sm:p-10 lg:p-14">
        <p className="text-[#f0c417] text-xs sm:text-sm font-medium uppercase tracking-[0.2em] mb-3">
          {label}
        </p>
        <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-[-0.02em] max-w-4xl leading-tight">
          {title}
        </h2>
        <p className="mt-4 text-white/70 text-sm sm:text-base max-w-2xl">
          Collector-focused editorial from Street Collector—paired with artist pages, finite editions, and a display path that keeps context next to the artwork.
        </p>
      </div>
    </div>
  )
}
