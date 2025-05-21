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
  'benefit_types'
];

export async function exportToSheets(config: BackupConfig, backupPath?: string): Promise<string> {
  try {
    // Initialize Google Sheets API
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    if (!privateKey) {
      throw new Error('GOOGLE_PRIVATE_KEY not set in environment');
    }

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

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
      const chunks: Uint8Array[] = [];
      
      backupData = await new Promise((resolve, reject) => {
        gunzipStream.on('data', (chunk: Uint8Array) => chunks.push(chunk));
        gunzipStream.on('end', () => {
          const decompressedData = Buffer.concat(chunks);
          resolve(JSON.parse(decompressedData.toString()));
        });
        gunzipStream.on('error', reject);
        gunzipStream.end(compressedData);
      });
    } else {
      // Initialize Supabase client with service role key
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
          backupData[table] = []; // Set empty array for failed tables
          continue;
        }

        backupData[table] = data || [];
      }
    }

    // Export each table to a separate sheet
    for (const [tableName, data] of Object.entries(backupData)) {
      if (!Array.isArray(data)) {
        console.warn(`Skipping ${tableName}: data is not an array`);
        continue;
      }

      // Create headers from the first row or use empty array if no data
      const headers = data.length > 0 ? Object.keys(data[0]) : [];
      const rows = data.map(row => headers.map(header => row[header]));

      // Add the sheet
      await sheets.spreadsheets.batchUpdate({
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
                  sheetId: 0,
                  dimension: 'COLUMNS',
                  startIndex: 0,
                  endIndex: headers.length,
                },
              },
            },
            {
              repeatCell: {
                range: {
                  sheetId: 0,
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

    // If main backup spreadsheet is configured, copy the sheet there
    if (config.storage.googleDrive?.folderId) {
      const mainSpreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: config.storage.googleDrive.folderId,
      });

      if (mainSpreadsheet.data) {
        // Copy the new sheet to the main spreadsheet
        await sheets.spreadsheets.sheets.copyTo({
          spreadsheetId,
          sheetId: 0,
          requestBody: {
            destinationSpreadsheetId: config.storage.googleDrive.folderId,
          },
        });

        // Delete the temporary spreadsheet
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: config.storage.googleDrive.folderId,
          requestBody: {
            requests: [
              {
                deleteSheet: {
                  sheetId: 0,
                },
              },
            ],
          },
        });
      }
    }

    console.log(`Backup exported to Google Sheets: ${spreadsheet.data.spreadsheetUrl}`);
    return spreadsheet.data.spreadsheetUrl || '';
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
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    if (!config.storage.googleDrive?.folderId) {
      return;
    }

    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: config.storage.googleDrive.folderId,
    });

    if (!spreadsheet.data.sheets) {
      return;
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - config.storage.googleDrive.retention.days);

    for (const sheet of spreadsheet.data.sheets) {
      const title = sheet.properties?.title;
      if (!title) continue;

      const dateMatch = title.match(/\d{4}-\d{2}-\d{2}/);
      if (!dateMatch) continue;

      const sheetDate = new Date(dateMatch[0]);
      if (sheetDate < cutoffDate) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: config.storage.googleDrive.folderId,
          requestBody: {
            requests: [
              {
                deleteSheet: {
                  sheetId: sheet.properties?.sheetId,
                },
              },
            ],
          },
        });
        console.log(`Deleted old sheet: ${title}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up old sheets:', error);
    throw error;
  }
} 