import { NextResponse } from 'next/server';
import { startBackupCron } from '@/backup/cron/backup-cron';

export async function POST() {
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