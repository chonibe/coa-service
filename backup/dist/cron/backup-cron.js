"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startBackupCron = startBackupCron;
const node_cron_1 = __importDefault(require("node-cron"));
const backup_config_1 = require("../config/backup-config");
const backup_database_1 = require("../scripts/backup-database");
function startBackupCron(config = backup_config_1.defaultConfig) {
    // Schedule daily backup (at midnight)
    node_cron_1.default.schedule(config.schedule.daily, async () => {
        try {
            console.log('Starting daily backup...');
            const backupPath = await (0, backup_database_1.backupDatabase)(config);
            console.log(`Daily backup completed successfully: ${backupPath}`);
        }
        catch (error) {
            console.error('Daily backup failed:', error);
        }
    });
    // Schedule weekly backup (on Sunday)
    node_cron_1.default.schedule(config.schedule.weekly, async () => {
        try {
            console.log('Starting weekly backup...');
            const backupPath = await (0, backup_database_1.backupDatabase)(config);
            console.log(`Weekly backup completed successfully: ${backupPath}`);
        }
        catch (error) {
            console.error('Weekly backup failed:', error);
        }
    });
    console.log('Backup cron jobs started');
}
