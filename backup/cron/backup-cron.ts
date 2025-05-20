import cron from 'node-cron';
import { defaultConfig, BackupConfig } from '../config/backup-config';
import { backupDatabase, cleanupOldBackups } from '../scripts/backup-database';
import { exportToSheets, cleanupOldSheets } from '../scripts/export-to-sheets';

export function startBackupCron(config: BackupConfig = defaultConfig) {
  // Daily database backup
  cron.schedule(config.schedule.databaseBackup, async () => {
    console.log('Starting scheduled database backup...');
    try {
      await backupDatabase(config);
      console.log('Database backup completed.');
    } catch (err) {
      console.error('Database backup failed:', err);
    }
  });

  // Weekly Google Sheets export
  cron.schedule(config.schedule.sheetsExport, async () => {
    console.log('Starting scheduled Google Sheets export...');
    try {
      await exportToSheets(config);
      console.log('Google Sheets export completed.');
    } catch (err) {
      console.error('Google Sheets export failed:', err);
    }
  });

  // Daily cleanup
  cron.schedule(config.schedule.cleanup, async () => {
    console.log('Starting scheduled cleanup...');
    try {
      await cleanupOldBackups(config);
      await cleanupOldSheets(config);
      console.log('Cleanup completed.');
    } catch (err) {
      console.error('Cleanup failed:', err);
    }
  });

  console.log('Backup cron jobs started.');
} 