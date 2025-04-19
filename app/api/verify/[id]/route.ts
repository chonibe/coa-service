import { NextResponse, type NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.SUPABASE_CONNECTION_STRING!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Verify certificate
    const certificate = await sql`
      SELECT * FROM certificates WHERE id = ${id}
    `

    if (!certificate || certificate.length === 0) {
      return NextResponse.json({ verified: false, error: "Certificate not found" }, { status: 404 })
    }

    return NextResponse.json({ verified: true, certificate: certificate[0] })
  } catch (error) {
    console.error("Error verifying certificate:", error)
    return NextResponse.json({ verified: false, error: "Failed to verify certificate" }, { status: 500 })
  }
}
