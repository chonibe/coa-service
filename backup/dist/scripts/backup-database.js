"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.backupDatabase = backupDatabase;
exports.cleanupOldBackups = cleanupOldBackups;
const fs_1 = require("fs");
const path_1 = require("path");
const supabase_js_1 = require("@supabase/supabase-js");
const zlib_1 = require("zlib");
const util_1 = require("util");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const readdirAsync = (0, util_1.promisify)(fs_1.readdir);
const unlinkAsync = (0, util_1.promisify)(fs_1.unlink);
async function backupDatabase(config) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupDir = config.storage.local.path;
    const filename = `backup-${timestamp}.json`;
    const compressedFilename = `${filename}.gz`;
    const backupPath = (0, path_1.join)(backupDir, filename);
    const compressedPath = (0, path_1.join)(backupDir, compressedFilename);
    try {
        // Create backup directory if it doesn't exist (cross-platform)
        if (!(0, fs_1.existsSync)(backupDir)) {
            (0, fs_1.mkdirSync)(backupDir, { recursive: true });
        }
        // Use Supabase URL and Anon Key from environment
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY not set in environment');
        }
        console.log('Supabase URL:', supabaseUrl);
        console.log('Supabase Key:', supabaseKey.substring(0, 8) + '...');
        const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
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
            'benefit_types',
            'tax_forms'
        ];
        // Backup each table
        const backupData = {};
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
        const writeStream = (0, fs_1.createWriteStream)(backupPath);
        writeStream.write(JSON.stringify(backupData, null, 2));
        writeStream.end();
        // Wait for write to complete
        await new Promise((resolve, reject) => {
            writeStream.on('finish', () => resolve());
            writeStream.on('error', reject);
        });
        // Compress the backup (use createReadStream)
        await new Promise((resolve, reject) => {
            const gzip = (0, zlib_1.createGzip)();
            const input = (0, fs_1.createReadStream)(backupPath);
            const output = (0, fs_1.createWriteStream)(compressedPath);
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
            .filter(file => file.endsWith('.json.gz'))
            .map(file => ({
            name: file,
            path: (0, path_1.join)(backupDir, file),
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
    }
    catch (error) {
        console.error('Cleanup failed:', error);
        throw error;
    }
}
