import { backupDatabase, cleanupOldBackups } from './backup-database';
import { defaultConfig } from '../config/backup-config';

async function testBackup() {
  try {
    console.log('Starting test backup...');
    
    // Create a test config with a temporary database URL
    const testConfig = {
      ...defaultConfig,
      database: {
        ...defaultConfig.database,
        url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres',
      },
    };

    // Run the backup
    const backupPath = await backupDatabase(testConfig);
    console.log('Backup completed successfully!');
    console.log('Backup file:', backupPath);

    // Run cleanup
    await cleanupOldBackups(testConfig);
    console.log('Cleanup completed successfully!');
  } catch (error) {
    console.error('Test backup failed:', error);
    process.exit(1);
  }
}

// Run the test
testBackup(); 