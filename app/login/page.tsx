import { Suspense } from "react"
import type { Metadata } from "next"
import LoginClient from "./login-client"
import { Loader2 } from "lucide-react"

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center bg-gray-50">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </main>
      }
    >
      <LoginClient />
    </Suspense>
  )
}

