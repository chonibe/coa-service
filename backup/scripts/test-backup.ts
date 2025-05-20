import { backupDatabase } from './backup-database';
import { defaultConfig } from '../config/backup-config';

async function testBackup() {
  try {
    console.log('Starting test backup...');
    const backupPath = await backupDatabase(defaultConfig);
    console.log(`Backup completed successfully: ${backupPath}`);
  } catch (error) {
    console.error('Backup failed:', error);
  }
}

testBackup(); 