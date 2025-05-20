"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBackupCron = startBackupCron;
const node_cron_1 = __importDefault(require("node-cron"));
const backup_config_1 = require("../config/backup-config");
const backup_database_1 = require("../scripts/backup-database");
const export_to_sheets_1 = require("../scripts/export-to-sheets");
function startBackupCron(config = backup_config_1.defaultConfig) {
    // Daily database backup
    node_cron_1.default.schedule(config.schedule.databaseBackup, async () => {
        console.log('Starting scheduled database backup...');
        try {
            await (0, backup_database_1.backupDatabase)(config);
            console.log('Database backup completed.');
        }
        catch (err) {
            console.error('Database backup failed:', err);
        }
    });
    // Weekly Google Sheets export
    node_cron_1.default.schedule(config.schedule.sheetsExport, async () => {
        console.log('Starting scheduled Google Sheets export...');
        try {
            await (0, export_to_sheets_1.exportToSheets)(config);
            console.log('Google Sheets export completed.');
        }
        catch (err) {
            console.error('Google Sheets export failed:', err);
        }
    });
    // Daily cleanup
    node_cron_1.default.schedule(config.schedule.cleanup, async () => {
        console.log('Starting scheduled cleanup...');
        try {
            await (0, backup_database_1.cleanupOldBackups)(config);
            await (0, export_to_sheets_1.cleanupOldSheets)(config);
            console.log('Cleanup completed.');
        }
        catch (err) {
            console.error('Cleanup failed:', err);
        }
    });
    console.log('Backup cron jobs started.');
}
