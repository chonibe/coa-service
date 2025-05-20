import { exec } from 'child_process';
import { promisify } from 'util';
import { createGzip } from 'zlib';
import { createWriteStream, readdir, unlink } from 'fs';
import { join } from 'path';
import { BackupConfig } from '../config/backup-config';

const execAsync = promisify(exec);
const readdirAsync = promisify(readdir);
const unlinkAsync = promisify(unlink);

export async function backupDatabase(config: BackupConfig): Promise<string> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = config.storage.local.path;
  const filename = `backup-${timestamp}.sql`;
  const compressedFilename = `${filename}.gz`;
  const backupPath = join(backupDir, filename);
  const compressedPath = join(backupDir, compressedFilename);

  try {
    // Create backup directory if it doesn't exist
    await execAsync(`mkdir -p ${backupDir}`);

    // Create pg_dump command using DATABASE_URL
    const pgDumpCmd = `pg_dump "${config.database.url}" -F p > ${backupPath}`;

    // Execute pg_dump
    await execAsync(pgDumpCmd);

    // Compress the backup
    await new Promise((resolve, reject) => {
      const gzip = createGzip();
      const input = createWriteStream(backupPath);
      const output = createWriteStream(compressedPath);

      input.pipe(gzip).pipe(output);

      output.on('finish', () => {
        // Remove the uncompressed file
        unlinkAsync(backupPath).then(resolve).catch(reject);
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
      .filter(file => file.endsWith('.sql.gz'))
      .map(file => ({
        name: file,
        path: join(backupDir, file),
        date: new Date(file.replace('backup-', '').replace('.sql.gz', '').replace(/-/g, ':'))
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