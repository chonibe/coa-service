"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function AdminLoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const redirectTarget = searchParams.get("redirect") || "/admin/dashboard"
    const query = new URLSearchParams({ redirect: redirectTarget, mode: "admin" })
    router.replace(`/vendor/login?${query.toString()}`)
  }, [router, searchParams])

  return null
}
