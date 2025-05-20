import cron from 'node-cron';
import { backupDatabase } from './backup-database';
import { exportToSheets } from './export-to-sheets';
import { BackupConfig } from '../config/backup-config';
import dotenv from 'dotenv';

dotenv.config();

// Load backup configuration
const config: BackupConfig = {
  storage: {
    local: {
      path: './backup/storage',
      retention: {
        days: 30,
        maxBackups: 10
      }
    },
    googleDrive: {
      enabled: true,
      retention: {
        days: 30,
        maxBackups: 10
      },
      clientEmail: process.env.GOOGLE_CLIENT_EMAIL || '',
      privateKey: process.env.GOOGLE_PRIVATE_KEY || '',
      folderId: process.env.GOOGLE_DRIVE_FOLDER_ID
    }
  },
  schedule: {
    databaseBackup: '0 0 * * *', // Daily at midnight
    sheetsExport: '0 1 * * *',   // Daily at 1 AM
    cleanup: '0 2 * * *'         // Daily at 2 AM
  },
  database: {
    url: process.env.DATABASE_URL || ''
  },
  logging: {
    level: 'info',
    file: './backup/logs/backup.log'
  }
};

// Schedule database backup
cron.schedule(config.schedule.databaseBackup, async () => {
  try {
    console.log('Starting scheduled database backup...');
    const backupPath = await backupDatabase(config);
    console.log('Database backup completed:', backupPath);
  } catch (error) {
    console.error('Database backup failed:', error);
  }
});

// Schedule Google Sheets export
cron.schedule(config.schedule.sheetsExport, async () => {
  try {
    console.log('Starting scheduled Google Sheets export...');
    const sheetsUrl = await exportToSheets(config);
    console.log('Google Sheets export completed:', sheetsUrl);
  } catch (error) {
    console.error('Google Sheets export failed:', error);
  }
});

console.log('Backup scheduler started');
console.log('Database backup schedule:', config.schedule.databaseBackup);
console.log('Google Sheets export schedule:', config.schedule.sheetsExport); 