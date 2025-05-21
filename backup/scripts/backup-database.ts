import { BackupConfig } from '../config/backup-config';
import { createClient } from '@supabase/supabase-js';
import { createGzip } from 'zlib';
import { promisify } from 'util';
import dotenv from 'dotenv';

dotenv.config();

export async function backupDatabase(config: BackupConfig): Promise<string> {
  try {
    console.log('Starting database backup...');
    
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
      'benefit_types',
      'tax_forms'
    ];

    // Backup each table
    const backupData: Record<string, any[]> = {};
    for (const table of tables) {
      console.log(`Backing up table ${table}...`);
      const { data, error } = await supabase
        .from(table)
        .select('*');

      if (error) {
        console.error(`Error backing up table ${table}:`, error);
        continue;
      }

      backupData[table] = data || [];
      console.log(`Successfully backed up ${data?.length || 0} rows from ${table}`);
    }

    // Convert backup data to JSON string
    const jsonData = JSON.stringify(backupData, null, 2);
    
    // Compress the data
    const compressedData = await new Promise<Uint8Array>((resolve, reject) => {
      const gzip = createGzip();
      const chunks: Uint8Array[] = [];
      
      gzip.on('data', (chunk) => chunks.push(chunk));
      gzip.on('end', () => {
        const result = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          result.set(chunk, offset);
          offset += chunk.length;
        }
        resolve(result);
      });
      gzip.on('error', reject);
      
      gzip.write(jsonData);
      gzip.end();
    });

    // Convert to base64 string
    const base64Data = Buffer.from(compressedData).toString('base64');
    console.log('Backup completed successfully');
    
    return base64Data;
  } catch (error) {
    console.error('Backup failed:', error);
    throw error;
  }
}

export async function cleanupOldBackups(config: BackupConfig): Promise<void> {
  try {
    console.log('Starting cleanup of old backups...');
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in environment');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const retentionDays = config.storage.local.retention.days;
    const maxBackups = config.storage.local.retention.maxBackups;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    // Get all backups
    const { data: backups, error } = await supabase
      .from('backups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Delete backups older than retention period
    for (const backup of backups) {
      const backupDate = new Date(backup.created_at);
      if (backupDate < cutoffDate) {
        await supabase
          .from('backups')
          .delete()
          .eq('id', backup.id);
        console.log(`Deleted old backup from ${backupDate.toISOString()}`);
      }
    }

    // Delete excess backups if we have more than maxBackups
    if (backups.length > maxBackups) {
      const backupsToDelete = backups.slice(maxBackups);
      for (const backup of backupsToDelete) {
        await supabase
          .from('backups')
          .delete()
          .eq('id', backup.id);
        console.log(`Deleted excess backup from ${new Date(backup.created_at).toISOString()}`);
      }
    }

    console.log('Cleanup completed successfully');
  } catch (error) {
    console.error('Cleanup failed:', error);
    throw error;
  }
} 