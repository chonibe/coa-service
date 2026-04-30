import Link from "next/link"

export default function NotFound() {
  return (
    <main className="min-h-screen bg-white px-6 py-24 text-[#1a1a1a]">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm font-medium uppercase tracking-wider text-[#047AFF]">
          Page not found
        </p>
        <h1 className="mt-4 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          This page is not available.
        </h1>
        <p className="mt-6 text-lg leading-8 text-[#1a1a1a]/70">
          The artwork, artist, or page you opened may have moved. Start from the
          current Street Collector collection instead.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/shop/products"
            className="inline-flex h-11 items-center justify-center rounded-md bg-[#047AFF] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#0368d9]"
          >
            Browse artworks
          </Link>
          <Link
            href="/shop/explore-artists"
            className="inline-flex h-11 items-center justify-center rounded-md border border-[#1a1a1a]/15 px-5 text-sm font-semibold text-[#1a1a1a] transition-colors hover:bg-[#1a1a1a]/5"
          >
            Explore artists
          </Link>
        </div>
      </div>
    </main>
  )
}
