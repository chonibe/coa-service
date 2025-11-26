import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"

/**
 * API route to serve the print file template PDF
 * Place the actual template PDF at: public/templates/print-file-template.pdf
 */
export async function GET() {
  try {
    // Try to read the template file from public directory
    const templatePath = join(process.cwd(), "public", "templates", "print-file-template.pdf")
    
    try {
      const fileBuffer = await readFile(templatePath)
      
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'attachment; filename="print-file-template.pdf"',
          "Cache-Control": "public, max-age=3600",
        },
      })
    } catch (fileError) {
      // If file doesn't exist, return a helpful message
      return NextResponse.json(
        { 
          error: "Template file not found",
          message: "Please add the template PDF at public/templates/print-file-template.pdf",
        },
        { status: 404 }
      )
    }
  } catch (error: any) {
    console.error("Error serving template:", error)
    return NextResponse.json(
      { error: "Failed to serve template file" },
      { status: 500 }
    )
  }
}

