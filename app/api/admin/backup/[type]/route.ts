import { NextResponse } from "next/server"

// Temporarily disabled due to deployment issues
export async function POST(
  req: Request,
  { params }: { params: { type: string } }
) {
  return NextResponse.json({ 
    message: `Backup ${params.type} endpoint temporarily disabled` 
  })
}

export async function DELETE(
  req: Request,
  { params }: { params: { type: string } }
) {
  return NextResponse.json({ 
    message: `Delete backup ${params.type} endpoint temporarily disabled` 
  })
} 