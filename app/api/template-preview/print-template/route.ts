import { NextResponse } from "next/server"
import { readFile } from "fs/promises"
import { join } from "path"

/**
 * Public API route to serve the print file template PDF
 * This endpoint is accessible without authentication for the template preview page
 * Fetches from Google Drive or serves local file if available
 * Google Drive file ID: 1zSJedpbpth3X1bW9RhLiOaaFk7W2wRZc
 */
const GOOGLE_DRIVE_FILE_ID = "1zSJedpbpth3X1bW9RhLiOaaFk7W2wRZc"
const GOOGLE_DRIVE_DOWNLOAD_URL = `https://drive.google.com/uc?export=download&id=${GOOGLE_DRIVE_FILE_ID}`

export async function GET() {
  try {
    // First, try to read from local public directory (for caching/offline use)
    const templatePath = join(process.cwd(), "public", "templates", "print-file-template.pdf")
    
    try {
      const fileBuffer = await readFile(templatePath)
      
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": 'inline; filename="print-file-template.pdf"',
          "Cache-Control": "public, max-age=3600",
          "Access-Control-Allow-Origin": "*",
        },
      })
    } catch (fileError) {
      // If local file doesn't exist, fetch from Google Drive
      console.log("Local template not found, fetching from Google Drive...")
      
      try {
        const response = await fetch(GOOGLE_DRIVE_DOWNLOAD_URL, {
          redirect: "follow",
        })
        
        if (!response.ok) {
          throw new Error(`Failed to fetch template from Google Drive: ${response.status}`)
        }
        
        const fileBuffer = await response.arrayBuffer()
        
        return new NextResponse(fileBuffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": 'inline; filename="print-file-template.pdf"',
            "Cache-Control": "public, max-age=3600",
            "Access-Control-Allow-Origin": "*",
          },
        })
      } catch (driveError: any) {
        console.error("Error fetching from Google Drive:", driveError)
        // Return 404 instead of 503 to match expected behavior
        return NextResponse.json(
          { 
            error: "Template file not available",
            message: "Could not fetch template from Google Drive. Please contact support.",
          },
          { status: 404 }
        )
      }
    }
  } catch (error: any) {
    console.error("Error serving template:", error)
    return NextResponse.json(
      { error: "Failed to serve template file" },
      { status: 500 }
    )
  }
}

