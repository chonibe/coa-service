import { NextRequest, NextResponse } from "next/server";
import { startBackupCron } from '@/backup/cron/backup-cron';
import { guardAdminRequest } from "@/lib/auth-guards"

export async function POST(request: NextRequest) {
  const guard = guardAdminRequest(request)
  if (guard.kind !== "ok") return guard.response

  try {
    startBackupCron();
    return NextResponse.json({ 
      success: true, 
      message: 'Backup system started successfully',
      schedule: {
        daily: 'Daily at midnight',
        weekly: 'Weekly on Sunday'
      }
    });
  } catch (error) {
    console.error('Error starting backup system:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred' 
      },
      { status: 500 }
    );
  }
} 