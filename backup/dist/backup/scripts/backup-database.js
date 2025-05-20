"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupDatabase = backupDatabase;
exports.cleanupOldBackups = cleanupOldBackups;
const child_process_1 = require("child_process");
const util_1 = require("util");
const zlib_1 = require("zlib");
const fs_1 = require("fs");
const path_1 = require("path");
const execAsync = (0, util_1.promisify)(child_process_1.exec);
const readdirAsync = (0, util_1.promisify)(fs_1.readdir);
const unlinkAsync = (0, util_1.promisify)(fs_1.unlink);
async function backupDatabase(config) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = config.storage.local.path;
    const filename = `backup-${timestamp}.sql`;
    const compressedFilename = `${filename}.gz`;
    const backupPath = (0, path_1.join)(backupDir, filename);
    const compressedPath = (0, path_1.join)(backupDir, compressedFilename);
    try {
        // Create backup directory if it doesn't exist
        await execAsync(`mkdir -p ${backupDir}`);
        // Create pg_dump command using DATABASE_URL
        const pgDumpCmd = `pg_dump "${config.database.url}" -F p > ${backupPath}`;
        // Execute pg_dump
        await execAsync(pgDumpCmd);
        // Compress the backup
        await new Promise((resolve, reject) => {
            const gzip = (0, zlib_1.createGzip)();
            const input = (0, fs_1.createWriteStream)(backupPath);
            const output = (0, fs_1.createWriteStream)(compressedPath);
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
    }
    catch (error) {
        console.error('Backup failed:', error);
        throw error;
    }
}
async function cleanupOldBackups(config) {
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
            path: (0, path_1.join)(backupDir, file),
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
    }
    catch (error) {
        console.error('Cleanup failed:', error);
        throw error;
    }
}
