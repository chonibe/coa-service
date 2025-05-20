"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_cron_1 = __importDefault(require("node-cron"));
const backup_database_1 = require("./backup-database");
const export_to_sheets_1 = require("./export-to-sheets");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Load backup configuration
const config = {
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
        sheetsExport: '0 1 * * *', // Daily at 1 AM
        cleanup: '0 2 * * *' // Daily at 2 AM
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
node_cron_1.default.schedule(config.schedule.databaseBackup, async () => {
    try {
        console.log('Starting scheduled database backup...');
        const backupPath = await (0, backup_database_1.backupDatabase)(config);
        console.log('Database backup completed:', backupPath);
    }
    catch (error) {
        console.error('Database backup failed:', error);
    }
});
// Schedule Google Sheets export
node_cron_1.default.schedule(config.schedule.sheetsExport, async () => {
    try {
        console.log('Starting scheduled Google Sheets export...');
        const sheetsUrl = await (0, export_to_sheets_1.exportToSheets)(config);
        console.log('Google Sheets export completed:', sheetsUrl);
    }
    catch (error) {
        console.error('Google Sheets export failed:', error);
    }
});
console.log('Backup scheduler started');
console.log('Database backup schedule:', config.schedule.databaseBackup);
console.log('Google Sheets export schedule:', config.schedule.sheetsExport);
