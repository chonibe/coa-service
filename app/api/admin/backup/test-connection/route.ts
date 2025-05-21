import { NextResponse } from "next/server"
import { google } from "googleapis"
import { createClient } from "@supabase/supabase-js"

export async function POST(req: Request) {
  try {
    const { folderId } = await req.json()

    if (!folderId) {
      return NextResponse.json(
        { error: "Folder ID is required" },
        { status: 400 }
      )
    }

    // Initialize Google Drive API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      },
      scopes: ["https://www.googleapis.com/auth/drive"],
    })

    const drive = google.drive({ version: "v3", auth })

    // Test folder access
    try {
      await drive.files.get({
        fileId: folderId,
        fields: "id, name",
      })
    } catch (error) {
      console.error("Error accessing Google Drive folder:", error)
      return NextResponse.json(
        { error: "Failed to access Google Drive folder. Please check the folder ID and permissions." },
        { status: 400 }
      )
    }

    // Test file creation
    try {
      const testFile = await drive.files.create({
        requestBody: {
          name: "test-connection.txt",
          mimeType: "text/plain",
          parents: [folderId],
        },
        media: {
          mimeType: "text/plain",
          body: "Test connection file",
        },
      })

      // Clean up test file
      if (testFile.data.id) {
        await drive.files.delete({
          fileId: testFile.data.id,
        })
      }
    } catch (error) {
      console.error("Error creating test file in Google Drive:", error)
      return NextResponse.json(
        { error: "Failed to create test file in Google Drive. Please check write permissions." },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error testing Google Drive connection:", error)
    return NextResponse.json(
      { error: "Failed to test Google Drive connection" },
      { status: 500 }
    )
  }
} 