import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const jwtSecret = process.env.JWT_SECRET || "your-jwt-secret-key"

export async function GET(request: NextRequest) {
  try {
    const token = cookies().get("vendor_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    // Verify token
    const decoded = jwt.verify(token, jwtSecret) as {
      vendorId: number
      vendorName: string
      role: string
    }

    if (decoded.role !== "vendor") {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    // Return vendor info
    return NextResponse.json({
      vendor: {
        id: decoded.vendorId,
        vendorName: decoded.vendorName,
      },
    })
  } catch (error) {
    console.error("Error fetching vendor info:", error)
    return NextResponse.json({ message: "Authentication error" }, { status: 401 })
  }
}
