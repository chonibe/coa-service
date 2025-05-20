import { google } from 'googleapis';
import { BackupConfig } from '../config/backup-config';
import { supabase } from '../../lib/supabase';

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

export async function exportToSheets(config: BackupConfig) {
  try {
    // Authenticate with Google Sheets API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: config.storage.googleDrive.clientEmail,
        private_key: config.storage.googleDrive.privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Create a new spreadsheet
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: `Database Backup ${new Date().toISOString().split('T')[0]}`,
        },
      },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;
    if (!spreadsheetId) {
      throw new Error('Failed to create spreadsheet');
    }

    // Export each table
    for (const table of TABLES_TO_EXPORT) {
      if (!supabase) {
        throw new Error('Supabase client not initialized');
      }

      const { data, error } = await supabase
        .from(table)
        .select('*');

      if (error) {
        console.error(`Error fetching data from ${table}:`, error);
        continue;
      }

      if (!data || data.length === 0) {
        console.log(`No data found in table ${table}`);
        continue;
      }

      // Convert data to sheet format
      const headers = Object.keys(data[0]);
      const values = [
        headers,
        ...data.map(row => headers.map(header => row[header]))
      ];

      // Update sheet with data
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${table}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values },
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
    if (config.storage.googleDrive.folderId) {
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

    console.log('Successfully exported data to Google Sheets');
  } catch (error) {
    console.error('Error exporting to Google Sheets:', error);
    throw error;
  }
}

export async function cleanupOldSheets(config: BackupConfig) {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: config.storage.googleDrive.clientEmail,
        private_key: config.storage.googleDrive.privateKey,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    if (!config.storage.googleDrive.folderId) {
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