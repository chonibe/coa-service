"use server"

import { NextResponse } from "next/server"
import { clearVendorSessionCookie } from "@/lib/vendor-session"

export async function POST() {
  const response = NextResponse.json({ success: true })
  const clearCookie = clearVendorSessionCookie()
  response.cookies.set(clearCookie.name, "", clearCookie.options)
  return response
}


