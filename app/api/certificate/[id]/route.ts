import { NextResponse, type NextRequest } from "next/server"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.SUPABASE_CONNECTION_STRING!)

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const id = params.id

    // Fetch certificate data
    const certificate = await sql`
      SELECT * FROM certificates WHERE id = ${id}
    `

    if (!certificate || certificate.length === 0) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 })
    }

    return NextResponse.json({ certificate: certificate[0] })
  } catch (error) {
    console.error("Error fetching certificate:", error)
    return NextResponse.json({ error: "Failed to fetch certificate" }, { status: 500 })
  }
}
