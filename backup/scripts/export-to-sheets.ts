import { google } from 'googleapis';
import { BackupConfig } from '../config/backup-config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { createGunzip } from 'zlib';
import { promisify } from 'util';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const gunzip = promisify(createGunzip);

const TABLES_TO_EXPORT = [
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

export async function exportToSheets(config: BackupConfig, backupPath?: string) {
  try {
    // Initialize Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
      ],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });

    // Create a new spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `Database Backup - ${new Date().toISOString().split('T')[0]}`,
        },
      },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;
    if (!spreadsheetId) {
      throw new Error('Failed to create spreadsheet');
    }

    let backupData: Record<string, any[]>;

    if (backupPath) {
      // Read and decompress the backup file
      const compressedData = readFileSync(backupPath);
      const gunzipStream = createGunzip();
      const chunks: Buffer[] = [];
      
      return new Promise((resolve, reject) => {
        gunzipStream.on('data', (chunk: Buffer) => chunks.push(chunk));
        gunzipStream.on('end', () => {
          const decompressedData = Buffer.concat(chunks);
          backupData = JSON.parse(decompressedData.toString());
          resolve(backupData);
        });
        gunzipStream.on('error', reject);
        gunzipStream.end(compressedData);
      });
    } else {
      // Initialize Supabase client
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseUrl || !supabaseKey) {
        throw new Error('NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set in environment');
      }
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Fetch data from Supabase
      backupData = {};
      for (const table of TABLES_TO_EXPORT) {
        const { data, error } = await supabase
          .from(table)
          .select('*');

        if (error) {
          console.error(`Error fetching data from ${table}:`, error);
          continue;
        }

        backupData[table] = data || [];
      }
    }

    // Export each table to a separate sheet
    for (const [tableName, data] of Object.entries(backupData)) {
      if (!Array.isArray(data) || data.length === 0) continue;

      // Create headers from the first row
      const headers = Object.keys(data[0]);
      const rows = data.map(row => headers.map(header => row[header]));

      // Add the sheet
      const addSheetResponse = await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [{
            addSheet: {
              properties: {
                title: tableName,
              },
            },
          }],
        },
      });

      const sheetId = addSheetResponse.data.replies?.[0]?.addSheet?.properties?.sheetId;
      if (!sheetId) {
        throw new Error(`Failed to create sheet for table ${tableName}`);
      }

      // Write the data
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${tableName}!A1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [headers, ...rows],
        },
      });

      // Format the sheet
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
          requests: [
            {
              autoResizeDimensions: {
                dimensions: {
                  sheetId,
                  dimension: 'COLUMNS',
                  startIndex: 0,
                  endIndex: headers.length,
                },
              },
            },
            {
              repeatCell: {
                range: {
                  sheetId,
                  startRowIndex: 0,
                  endRowIndex: 1,
                },
                cell: {
                  userEnteredFormat: {
                    backgroundColor: { red: 0.8, green: 0.8, blue: 0.8 },
                    textFormat: { bold: true },
                  },
                },
                fields: 'userEnteredFormat(backgroundColor,textFormat)',
              },
            },
          ],
        },
      });
    }

    // If folder ID is configured, move the spreadsheet to that folder
    if (config.storage.googleDrive?.folderId) {
      await drive.files.update({
        fileId: spreadsheetId,
        addParents: config.storage.googleDrive.folderId,
        fields: 'id, parents',
      });
    }

    console.log(`Backup exported to Google Sheets: ${spreadsheet.data.spreadsheetUrl}`);
    return spreadsheet.data.spreadsheetUrl;
  } catch (error) {
    console.error('Error exporting to Google Sheets:', error);
    throw error;
  }
}

export async function cleanupOldSheets(config: BackupConfig) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
      ],
    });

    const drive = google.drive({ version: 'v3', auth });

    if (!config.storage.googleDrive?.folderId) {
      return;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.storage.googleDrive.retention.days);

    // List all files in the folder
    const response = await drive.files.list({
      q: `'${config.storage.googleDrive.folderId}' in parents and mimeType='application/vnd.google-apps.spreadsheet'`,
      fields: 'files(id, name, createdTime)',
    });

    if (!response.data.files) {
      return;
    }

    // Delete old files
    for (const file of response.data.files) {
      const fileDate = new Date(file.createdTime || '');
      if (fileDate < cutoffDate) {
        await drive.files.delete({
          fileId: file.id!,
        });
        console.log(`Deleted old spreadsheet: ${file.name}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up old sheets:', error);
    throw error;
  }
} 