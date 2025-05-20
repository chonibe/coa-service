import { z } from 'zod';

const backupConfigSchema = z.object({
  storage: z.object({
    local: z.object({
      path: z.string(),
      retention: z.object({
        days: z.number(),
        maxBackups: z.number(),
      }),
    }),
    googleDrive: z.object({
      enabled: z.boolean(),
      folderId: z.string().optional(),
      clientEmail: z.string(),
      privateKey: z.string(),
      retention: z.object({
        days: z.number(),
        maxBackups: z.number(),
      }),
    }),
  }),
  schedule: z.object({
    databaseBackup: z.string(), // cron expression
    sheetsExport: z.string(), // cron expression
    cleanup: z.string(), // cron expression
  }),
  database: z.object({
    url: z.string(),
    ssl: z.boolean().optional(),
  }),
  logging: z.object({
    level: z.enum(['error', 'warn', 'info', 'debug']),
    file: z.string().optional(),
  }),
});

export type BackupConfig = z.infer<typeof backupConfigSchema>;

export const defaultConfig: BackupConfig = {
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