"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import {
  Image as ImageIcon,
  Lock,
  ChartBarIcon,
  DollarSign,
  ShoppingBagIcon,
  MessageCircle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Palette,
  TrendingUp,
  Shield,
  Zap,
  Star,
  Globe,
} from "lucide-react"

const SUPPORT_EMAIL = "support@thestreetlamp.com"
const MAILTO_SUBJECT = encodeURIComponent("Street Collector Artist Application")
const MAILTO_BODY = encodeURIComponent(
  [
    "Hi Street Collector Team,",
    "",
    "I'm interested in joining the Street Collector platform as an artist vendor.",
    "",
    "Artist/Brand Name:",
    "Contact Name:",
    "Email:",
    "Portfolio/Website:",
    "Brief Description of My Work:",
    "",
    "I'd love to learn more about the platform and discuss how I can contribute.",
    "",
    "Thanks!",
  ].join("\n"),
)

const features = [
  {
    icon: ImageIcon,
    title: "Product Creation",
    description: "Create and submit your artworks through our intuitive product wizard. Manage all your pieces in one place with full control over pricing, images, and descriptions.",
    color: "from-purple-500 to-pink-500",
  },
  {
    icon: Lock,
    title: "Series Management",
    description: "Organize your work into exclusive series with VIP unlocks, time-based releases, and special collector benefits. Create anticipation and exclusivity around your drops.",
    color: "from-blue-500 to-cyan-500",
  },
  {
    icon: ChartBarIcon,
    title: "Analytics & Insights",
    description: "Track your sales performance, revenue trends, and customer engagement with comprehensive analytics. Make data-driven decisions to grow your art business.",
    color: "from-green-500 to-emerald-500",
  },
  {
    icon: DollarSign,
    title: "Payouts & Banking",
    description: "Get paid automatically with transparent payout tracking. View your earnings, pending payments, and complete financial history in real-time.",
    color: "from-amber-500 to-orange-500",
  },
  {
    icon: ShoppingBagIcon,
    title: "Artist Store",
    description: "Access exclusive perks, purchase credits, and redeem benefits. Buy proof prints, upgrade your subscription, and unlock platform features.",
    color: "from-red-500 to-rose-500",
  },
  {
    icon: MessageCircle,
    title: "Messaging",
    description: "Communicate directly with collectors and platform administrators. Stay connected and build relationships with your audience.",
    color: "from-indigo-500 to-purple-500",
  },
]

const benefits = [
  "Reach a global collector audience",
  "Zero upfront costs or monthly fees",
  "Automated order fulfillment",
  "Professional certificate generation",
  "Direct artist-to-collector connection",
  "Transparent revenue sharing",
]

export default function JoinVendorPage() {
  const router = useRouter()
  const [googleLoading, setGoogleLoading] = useState(false)

  const handleGoogleLogin = () => {
    setGoogleLoading(true)
    router.push("/api/auth/google/start?redirect=/vendor/dashboard")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/20 dark:bg-blue-900/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-purple-200/20 dark:bg-purple-900/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-indigo-200/20 dark:bg-indigo-900/10 rounded-full blur-3xl animate-pulse delay-2000" />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 border-b border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Logo className="h-8 w-auto object-contain" alt="Street Collector Logo" />
            </Link>
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="hidden sm:flex"
              >
                Sign In
              </Button>
              <Button
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {googleLoading ? "Loading..." : "Get Started"}
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            <span>Open Call for Artists</span>
          </div>
          
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 dark:from-slate-100 dark:via-blue-100 dark:to-indigo-100 bg-clip-text text-transparent leading-tight">
            Join Street Collector
            <br />
            <span className="text-4xl sm:text-5xl lg:text-6xl">Share Your Art with the World</span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-400 mb-8 max-w-3xl mx-auto leading-relaxed">
            A platform built for artists, by artists. Create, sell, and connect with collectors worldwide through our comprehensive artist portal.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              size="lg"
              className="w-full sm:w-auto px-8 h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95"
            >
              <Zap className="h-5 w-5 mr-2" />
              {googleLoading ? "Signing In..." : "Join Now - It's Free"}
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto px-8 h-14 text-lg font-semibold border-2"
              asChild
            >
              <Link href={`mailto:${SUPPORT_EMAIL}?subject=${MAILTO_SUBJECT}&body=${MAILTO_BODY}`}>
                Learn More
              </Link>
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span>No Setup Fees</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span>Global Reach</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span>Secure Payments</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span>24/7 Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Our comprehensive platform provides all the tools you need to manage your art business and connect with collectors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <CardHeader>
                  <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.color} mb-4 w-fit`}>
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 bg-white/30 dark:bg-slate-900/30 backdrop-blur-sm">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-r from-slate-900 to-slate-700 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
              Why Artists Choose Us
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400">
              Join a community of artists building sustainable art businesses
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-4 rounded-lg bg-white/60 dark:bg-slate-800/60 backdrop-blur-md"
              >
                <Star className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <span className="text-lg text-slate-700 dark:text-slate-300">{benefit}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-lg text-center">
              <CardHeader>
                <Globe className="h-10 w-10 mx-auto mb-4 text-blue-600" />
                <CardTitle>Global Marketplace</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-400">
                  Reach collectors worldwide with our integrated e-commerce platform
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-lg text-center">
              <CardHeader>
                <Shield className="h-10 w-10 mx-auto mb-4 text-green-600" />
                <CardTitle>Secure & Safe</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-400">
                  Your work and payments are protected with enterprise-grade security
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-lg text-center">
              <CardHeader>
                <TrendingUp className="h-10 w-10 mx-auto mb-4 text-purple-600" />
                <CardTitle>Grow Your Business</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 dark:text-slate-400">
                  Analytics and insights help you make informed decisions to scale
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-4xl">
          <Card className="bg-gradient-to-br from-blue-600 to-indigo-600 border-0 shadow-2xl text-white">
            <CardHeader className="text-center pb-4">
              <Palette className="h-16 w-16 mx-auto mb-4 text-white/90" />
              <CardTitle className="text-4xl sm:text-5xl font-bold mb-4 text-white">
                Ready to Start Your Journey?
              </CardTitle>
              <CardDescription className="text-xl text-blue-100 max-w-2xl mx-auto">
                Join Street Collector today and connect with collectors who appreciate your art. 
                Setup is quick, easy, and completely free.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-6">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  size="lg"
                  className="w-full sm:w-auto px-8 h-14 text-lg font-semibold bg-white text-blue-600 hover:bg-blue-50 shadow-xl hover:shadow-2xl transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <Zap className="h-5 w-5 mr-2" />
                  {googleLoading ? "Signing In..." : "Join Now"}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto px-8 h-14 text-lg font-semibold border-2 border-white text-white hover:bg-white/10"
                  asChild
                >
                  <Link href={`mailto:${SUPPORT_EMAIL}?subject=${MAILTO_SUBJECT}&body=${MAILTO_BODY}`}>
                    Contact Us
                  </Link>
                </Button>
              </div>
              <p className="text-blue-100 text-sm">
                Already have an account?{" "}
                <button
                  onClick={handleGoogleLogin}
                  disabled={googleLoading}
                  className="underline font-semibold hover:text-white transition-colors"
                >
                  Sign in here
                </button>
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md py-8 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Logo className="h-6 w-auto object-contain" alt="Street Collector Logo" />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Built for artists, by artists
              </span>
            </div>
            <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
              <Link
                href={`mailto:${SUPPORT_EMAIL}`}
                className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                Support
              </Link>
              <Link
                href={`mailto:${SUPPORT_EMAIL}?subject=${MAILTO_SUBJECT}&body=${MAILTO_BODY}`}
                className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                Apply as Artist
              </Link>
              <button
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                Sign In
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

