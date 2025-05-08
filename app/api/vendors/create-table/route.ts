import { NextResponse } from "next/server"

export async function POST() {
  try {
    // Call the database initialization endpoint
    const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL || ""}/api/db/exec-sql`, {
      method: "POST",
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to initialize database")
    }

    return NextResponse.json({ success: true, message: "Vendors table created successfully" })
  } catch (error) {
    console.error("Error creating vendors table:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unexpected error occurred" },
      { status: 500 },
    )
  }
}
