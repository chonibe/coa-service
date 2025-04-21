import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const defaultPassword = process.env.DEFAULT_VENDOR_PASSWORD || 'password';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createDefaultVendorLogins() {
  try {
    // Hash the default password
    const passwordHash = await bcrypt.hash(defaultPassword, 10);

    // Fetch all vendors from the database
    const { data: vendors, error: fetchError } = await supabase
      .from('vendors')
      .select('id');

    if (fetchError) {
      throw new Error(`Failed to fetch vendors: ${fetchError.message}`);
    }

    if (!vendors || vendors.length === 0) {
      console.log('No vendors found in the database');
      return;
    }

    // Update each vendor with the hashed password
    for (const vendor of vendors) {
      const { error: updateError } = await supabase
        .from('vendors')
        .update({ password_hash: passwordHash })
        .eq('id', vendor.id);

      if (updateError) {
        console.error(`Failed to update vendor ${vendor.id}: ${updateError.message}`);
      } else {
        console.log(`Updated vendor ${vendor.id} with default password`);
      }
    }

    console.log('Successfully created default vendor logins');
  } catch (error) {
    console.error('Error creating default vendor logins:', error.message || error);
  }
}

// Execute the function
createDefaultVendorLogins();
