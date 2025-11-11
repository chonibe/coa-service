import Link from "next/link"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-slate-950 px-6 text-slate-50">
      <div className="space-y-4 text-center">
        <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">Street Collector</span>
        <h1 className="text-3xl font-semibold sm:text-4xl">Select your portal</h1>
        <p className="max-w-xl text-sm text-slate-300 sm:text-base">
          Sign in with the Google account assigned to your role. Administrators manage the platform; vendors manage their
          storefronts.
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href="/admin/login"
          className="rounded-lg border border-white/10 bg-white/5 px-8 py-5 text-center text-sm font-semibold text-white transition hover:border-cyan-400 hover:bg-cyan-500/10"
        >
          Continue as admin
        </Link>
        <Link
          href="/vendor/login"
          className="rounded-lg border border-white/10 bg-white/5 px-8 py-5 text-center text-sm font-semibold text-white transition hover:border-purple-400 hover:bg-purple-500/10"
        >
          Continue as vendor
        </Link>
      </div>

      <p className="text-xs text-slate-500">
        Need help?{" "}
        <a className="font-medium text-cyan-300" href="mailto:support@streetcollector.com">
          support@streetcollector.com
        </a>
      </p>
    </main>
  )
}
