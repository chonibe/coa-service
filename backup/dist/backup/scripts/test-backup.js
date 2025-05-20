"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const backup_database_1 = require("./backup-database");
const backup_config_1 = require("../config/backup-config");
async function testBackup() {
    try {
        console.log('Starting test backup...');
        // Create a test config with a temporary database URL
        const testConfig = {
            ...backup_config_1.defaultConfig,
            database: {
                ...backup_config_1.defaultConfig.database,
                url: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres',
            },
        };
        // Run the backup
        const backupPath = await (0, backup_database_1.backupDatabase)(testConfig);
        console.log('Backup completed successfully!');
        console.log('Backup file:', backupPath);
        // Run cleanup
        await (0, backup_database_1.cleanupOldBackups)(testConfig);
        console.log('Cleanup completed successfully!');
    }
    catch (error) {
        console.error('Test backup failed:', error);
        process.exit(1);
    }
}
// Run the test
testBackup();
