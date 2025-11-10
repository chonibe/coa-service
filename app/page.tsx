import Link from "next/link"
import { ArrowRight, ShieldCheck, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-50">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center gap-16 px-6 py-24 lg:flex-row lg:gap-20">
        <section className="space-y-6 text-center lg:w-1/2 lg:text-left">
          <div className="inline-flex items-center rounded-full border border-white/10 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70 backdrop-blur">
            Street Collector
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Authentication Portal
          </h1>
          <p className="text-base text-slate-200 sm:text-lg">
            Choose how you want to access the platform. Vendors manage their sales and payouts, while administrators gain
            full control over vendor operations and tooling.
          </p>
        </section>

        <section className="grid w-full max-w-md gap-6 lg:w-1/2">
          <Card className="border-white/10 bg-white/5 shadow-lg shadow-cyan-500/20 backdrop-blur">
            <CardContent className="space-y-6 p-6">
              <div className="flex items-center gap-3 text-white">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20">
                  <ShieldCheck className="h-5 w-5 text-cyan-300" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold">Administrator access</h2>
                  <p className="text-sm text-slate-200">
                    Manage vendors, certificates, and platform settings. Requires an approved admin Google account.
                  </p>
                </div>
              </div>
              <Button asChild size="lg" className="w-full justify-between bg-cyan-500 text-slate-950 hover:bg-cyan-400">
                <Link href="/vendor/login?mode=admin">
                  Continue as admin
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 shadow-lg shadow-purple-500/20 backdrop-blur">
            <CardContent className="space-y-6 p-6">
              <div className="flex items-center gap-3 text-white">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-500/20">
                  <Store className="h-5 w-5 text-purple-300" />
                </span>
                <div>
                  <h2 className="text-lg font-semibold">Vendor access</h2>
                  <p className="text-sm text-slate-200">
                    View sales analytics, payouts, and profile settings. Use the Google email paired with your vendor
                    profile.
                  </p>
                </div>
              </div>
              <Button
                asChild
                variant="secondary"
                size="lg"
                className="w-full justify-between bg-white text-slate-900 hover:bg-slate-100"
              >
                <Link href="/vendor/login">
                  Continue as vendor
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-slate-400 lg:text-left">
            Need assistance?{" "}
            <a className="font-medium text-cyan-300" href="mailto:support@streetcollector.com">
              support@streetcollector.com
            </a>
          </p>
        </section>
      </div>
    </main>
  )
}
