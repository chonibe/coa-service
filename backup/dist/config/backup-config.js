"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultConfig = void 0;
const zod_1 = require("zod");
const backupConfigSchema = zod_1.z.object({
    storage: zod_1.z.object({
        local: zod_1.z.object({
            path: zod_1.z.string(),
            retention: zod_1.z.object({
                days: zod_1.z.number(),
                maxBackups: zod_1.z.number(),
            }),
        }),
        googleDrive: zod_1.z.object({
            enabled: zod_1.z.boolean(),
            folderId: zod_1.z.string().optional(),
            clientEmail: zod_1.z.string(),
            privateKey: zod_1.z.string(),
            retention: zod_1.z.object({
                days: zod_1.z.number(),
                maxBackups: zod_1.z.number(),
            }),
        }),
    }),
    schedule: zod_1.z.object({
        databaseBackup: zod_1.z.string(), // cron expression
        sheetsExport: zod_1.z.string(), // cron expression
        cleanup: zod_1.z.string(), // cron expression
    }),
    database: zod_1.z.object({
        url: zod_1.z.string(),
        ssl: zod_1.z.boolean().optional(),
    }),
    logging: zod_1.z.object({
        level: zod_1.z.enum(['error', 'warn', 'info', 'debug']),
        file: zod_1.z.string().optional(),
    }),
});
exports.defaultConfig = {
    storage: {
        local: {
            path: './backup/storage',
            retention: {
                days: 30,
                maxBackups: 10,
            },
        },
        googleDrive: {
            enabled: false,
            clientEmail: process.env.GOOGLE_CLIENT_EMAIL || '',
            privateKey: process.env.GOOGLE_PRIVATE_KEY || '',
            retention: {
                days: 90,
                maxBackups: 12,
            },
        },
    },
    schedule: {
        databaseBackup: '0 0 * * *', // Daily at midnight
        sheetsExport: '0 0 * * 0', // Weekly on Sunday
        cleanup: '0 1 * * *', // Daily at 1 AM
    },
    database: {
        url: process.env.DATABASE_URL || '',
        ssl: true,
    },
    logging: {
        level: 'info',
        file: './backup/logs/backup.log',
    },
};
