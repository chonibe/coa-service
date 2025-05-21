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

function validateServiceAccountEmail(email: string): boolean {
  if (!email) return false;
  
  // Check if it's a valid email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;
  
  // Check if it's a service account email
  return email.endsWith('.iam.gserviceaccount.com');
}

function validateGoogleCredentials() {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY;
  const projectId = process.env.GOOGLE_PROJECT_ID;

  console.log('Validating Google credentials...');
  console.log('Client Email:', clientEmail ? `${clientEmail.substring(0, 10)}...` : 'not set');
  console.log('Project ID:', projectId || 'not set');
  console.log('Private Key:', privateKey ? 'set' : 'not set');

  // Check if client email is set and valid
  if (!clientEmail) {
    throw new Error(
      'GOOGLE_CLIENT_EMAIL is not set in environment variables.\n' +
      'Please set it to your Google service account email (e.g., service-account@project-id.iam.gserviceaccount.com)'
    );
  }

  if (!validateServiceAccountEmail(clientEmail)) {
    throw new Error(
      'GOOGLE_CLIENT_EMAIL must be a valid Google service account email.\n' +
      'Expected format: service-account@project-id.iam.gserviceaccount.com\n' +
      'Current value: ' + clientEmail
    );
  }

  // Check if private key is set
  if (!privateKey) {
    throw new Error(
      'GOOGLE_PRIVATE_KEY is not set in environment variables.\n' +
      'Please set it to the private key from your service account JSON file'
    );
  }

  // Check if project ID is set
  if (!projectId) {
    throw new Error(
      'GOOGLE_PROJECT_ID is not set in environment variables.\n' +
      'Please set it to your Google Cloud project ID'
    );
  }

  return {
    clientEmail,
    privateKey,
    projectId
  };
}

function formatPrivateKey(key: string): string {
  try {
    // If the key already has the proper format, return it as is
    if (key.includes('-----BEGIN PRIVATE KEY-----') && key.includes('-----END PRIVATE KEY-----')) {
      // Just ensure proper line endings
      return key.replace(/\r\n|\r|\n/g, '\n');
    }

    // Remove any existing newlines, quotes, and spaces
    let cleanKey = key.replace(/[\n\r" ]/g, '');
    
    // Split the key into chunks of 64 characters
    const chunks = [];
    for (let i = 0; i < cleanKey.length; i += 64) {
      chunks.push(cleanKey.slice(i, i + 64));
    }
    
    // Reconstruct the key with proper PEM format
    return `-----BEGIN PRIVATE KEY-----\n${chunks.join('\n')}\n-----END PRIVATE KEY-----`;
  } catch (error) {
    console.error('Error formatting private key:', error);
    throw new Error(
      'Failed to format private key. Please ensure it is a valid private key from your service account JSON file.\n' +
      'The key should be in PEM format and should look like:\n' +
      '-----BEGIN PRIVATE KEY-----\n' +
      'MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC9QFi67K6...\n' +
      '-----END PRIVATE KEY-----'
    );
  }
}

function flattenObject(obj: any, prefix = ''): Record<string, any> {
  return Object.keys(obj).reduce((acc: Record<string, any>, key: string) => {
    const pre = prefix.length ? `${prefix}.` : '';
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      Object.assign(acc, flattenObject(obj[key], pre + key));
    } else if (Array.isArray(obj[key])) {
      // For arrays, convert to JSON string
      acc[pre + key] = JSON.stringify(obj[key]);
    } else {
      acc[pre + key] = obj[key];
    }
    return acc;
  }, {});
}

export async function exportToSheets(config: BackupConfig, backupPath?: string): Promise<string> {
  try {
    // Validate Google credentials
    const { clientEmail, privateKey, projectId } = validateGoogleCredentials();
    console.log('Using Google service account:', clientEmail);
    console.log('Project ID:', projectId);

    // Format the private key
    let formattedPrivateKey: string;
    try {
      formattedPrivateKey = formatPrivateKey(privateKey);
      console.log('Private key formatted successfully');
    } catch (keyError) {
      console.error('Private key formatting error:', keyError);
      throw new Error(
        'Failed to format private key. Please check your GOOGLE_PRIVATE_KEY environment variable.\n' +
        'Make sure to copy the entire private key from your service account JSON file, including the BEGIN and END lines.'
      );
    }

    // Create JWT client with explicit credentials
    const auth = new google.auth.JWT({
      email: clientEmail,
      key: formattedPrivateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
      projectId: projectId
    });

    // Test the authentication
    try {
      console.log('Testing authentication...');
      const tokens = await auth.authorize();
      console.log('Successfully authenticated with Google Sheets API');
      console.log('Token type:', tokens.token_type);
      console.log('Expires in:', tokens.expiry_date);
    } catch (error: any) {
      console.error('Authentication error details:', {
        message: error.message,
        code: error.code,
        status: error.status,
        errors: error.errors,
        response: error.response?.data
      });
      
      if (error.message?.includes('invalid_grant')) {
        throw new Error(
          'Invalid Google service account credentials. Please verify:\n' +
          '1. The service account exists in your Google Cloud project\n' +
          '2. The private key is correct and properly formatted\n' +
          '3. The service account has the necessary permissions\n' +
          '4. The project ID matches your Google Cloud project\n\n' +
          'You can verify these in the Google Cloud Console:\n' +
          '1. Go to IAM & Admin > Service Accounts\n' +
          '2. Find your service account\n' +
          '3. Click on it and go to the "Keys" tab\n' +
          '4. Create a new key if needed (JSON format)\n' +
          '5. Compare the values in the JSON file with your environment variables'
        );
      }

      if (error.message?.includes('DECODER routines::unsupported')) {
        throw new Error(
          'Invalid private key format. Please ensure your GOOGLE_PRIVATE_KEY is properly formatted:\n' +
          '1. Copy the entire private key from your service account JSON file\n' +
          '2. Include the "-----BEGIN PRIVATE KEY-----" and "-----END PRIVATE KEY-----" lines\n' +
          '3. Make sure there are no extra spaces or characters\n' +
          '4. The key should be in PEM format\n\n' +
          'Example format:\n' +
          '-----BEGIN PRIVATE KEY-----\n' +
          'MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC9QFi67K6...\n' +
          '-----END PRIVATE KEY-----'
        );
      }

      throw new Error(`Failed to authenticate with Google Sheets API: ${error.message}`);
    }

    const sheets = google.sheets({ version: 'v4', auth });

    // Create a new spreadsheet
    console.log('Creating new spreadsheet...');
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
    console.log('Spreadsheet created successfully:', spreadsheetId);

    let backupData: Record<string, any[]>;

    if (backupPath) {
      console.log('Reading backup file:', backupPath);
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
      console.log('Backup file read successfully');
    } else {
      console.log('Fetching data from Supabase...');
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
        try {
          console.log(`Fetching data from table: ${table}`);
          const { data, error } = await supabase
            .from(table)
            .select('*');

          if (error) {
            console.error(`Error fetching data from ${table}:`, error);
            backupData[table] = []; // Set empty array for failed tables
            continue;
          }

          backupData[table] = data || [];
          console.log(`Successfully fetched ${data?.length || 0} rows from ${table}`);
        } catch (tableError) {
          console.error(`Unexpected error fetching data from ${table}:`, tableError);
          backupData[table] = []; // Set empty array for failed tables
        }
      }
    }

    // Export each table to a separate sheet
    console.log('Exporting data to sheets...');
    for (const [tableName, data] of Object.entries(backupData)) {
      if (!Array.isArray(data)) {
        console.warn(`Skipping ${tableName}: data is not an array`);
        continue;
      }

      try {
        console.log(`Creating sheet for table: ${tableName}`);
        
        // Flatten the data structure
        const flattenedData = data.map(row => flattenObject(row));
        
        // Create headers from the first row or use empty array if no data
        const headers = flattenedData.length > 0 ? Object.keys(flattenedData[0]) : [];
        const rows = flattenedData.map(row => headers.map(header => row[header]));

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
        console.log(`Successfully exported table ${tableName}`);
      } catch (sheetError) {
        console.error(`Error exporting table ${tableName} to sheet:`, sheetError);
        // Continue with other tables even if one fails
      }
    }

    // If main backup spreadsheet is configured, copy the sheet there
    if (config.storage.googleDrive?.folderId) {
      try {
        console.log('Copying to main backup spreadsheet...');
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
          console.log('Successfully copied to main backup spreadsheet');
        }
      } catch (copyError) {
        console.error('Error copying to main spreadsheet:', copyError);
        // Continue even if copying fails - we still have the original spreadsheet
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