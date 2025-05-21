import { createWriteStream, createReadStream, readdir, unlink, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { BackupConfig } from '../config/backup-config';
import { createClient } from '@supabase/supabase-js';
import { createGzip } from 'zlib';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();

const readdirAsync = promisify(readdir);
const unlinkAsync = promisify(unlink);

export async function backupDatabase(config: BackupConfig): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = config.storage.local.path;
  const filename = `backup-${timestamp}.json`;
  const compressedFilename = `${filename}.gz`;
  const backupPath = join(backupDir, filename);
  const compressedPath = join(backupDir, compressedFilename);

  try {
    // Create backup directory if it doesn't exist (cross-platform)
    if (!existsSync(backupDir)) {
      mkdirSync(backupDir, { recursive: true });
    }

    // Use Supabase URL and Service Role Key from environment
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in environment');
    }
    console.log('Supabase URL:', supabaseUrl);
    console.log('Supabase Key:', supabaseKey.substring(0, 8) + '...');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // List of tables to backup
    const tables = [
      'products',
      'orders',
      'order_line_items_v2',
      'vendors',
      'vendor_payouts',
      'product_vendor_payouts',
      'customers',
      'users',
      'nfc_tags',
      'collector_benefit_claims',
      'product_benefits',
      'benefit_types'
    ];

    // Backup each table
    const backupData: Record<string, any[]> = {};
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*');

      if (error) {
        console.error(`Error backing up table ${table}:`, error);
        continue;
      }

      backupData[table] = data || [];
    }

    // Write backup to file
    const writeStream = createWriteStream(backupPath);
    writeStream.write(JSON.stringify(backupData, null, 2));
    writeStream.end();

    // Wait for write to complete
    await new Promise<void>((resolve, reject) => {
      writeStream.on('finish', () => resolve());
      writeStream.on('error', reject);
    });

    // Compress the backup (use createReadStream)
    await new Promise<void>((resolve, reject) => {
      const gzip = createGzip();
      const input = createReadStream(backupPath);
      const output = createWriteStream(compressedPath);

      input.pipe(gzip).pipe(output);

      output.on('finish', () => {
        // Remove the uncompressed file
        unlinkAsync(backupPath).then(() => resolve()).catch(reject);
      });

      output.on('error', reject);
    });

    // Clean up old backups
    await cleanupOldBackups(config);

    return compressedPath;
  } catch (error) {
    console.error('Backup failed:', error);
    throw error;
  }
}

export async function cleanupOldBackups(config: BackupConfig): Promise<void> {
  const backupDir = config.storage.local.path;
  const retentionDays = config.storage.local.retention.days;
  const maxBackups = config.storage.local.retention.maxBackups;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  try {
    // List all backup files
    const files = await readdirAsync(backupDir);
    const backupFiles = files
      .filter(file => file.endsWith('.json.gz'))
      .map(file => ({
        name: file,
        path: join(backupDir, file),
        date: new Date(file.replace('backup-', '').replace('.json.gz', '').replace(/-/g, ':'))
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    // Remove files older than retention period
    for (const file of backupFiles) {
      if (file.date < cutoffDate) {
        await unlinkAsync(file.path);
        console.log(`Removed old backup: ${file.name}`);
      }
    }

    // Remove excess backups if we have more than maxBackups
    if (backupFiles.length > maxBackups) {
      const filesToRemove = backupFiles.slice(maxBackups);
      for (const file of filesToRemove) {
        await unlinkAsync(file.path);
        console.log(`Removed excess backup: ${file.name}`);
      }
    }
  } catch (error) {
    console.error('Cleanup failed:', error);
    throw error;
  }
} 