"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const backup_database_1 = require("./backup-database");
const backup_config_1 = require("../config/backup-config");
async function testBackup() {
    try {
        console.log('Starting test backup...');
        const backupPath = await (0, backup_database_1.backupDatabase)(backup_config_1.defaultConfig);
        console.log(`Backup completed successfully: ${backupPath}`);
    }
    catch (error) {
        console.error('Backup failed:', error);
    }
}
testBackup();
