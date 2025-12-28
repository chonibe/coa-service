const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log('--- STARTING DIAGNOSTIC ---');
  
  // 1. Get Vendor Info
  const { data: vendor, error: vError } = await supabase
    .from('vendors')
    .select('id, auth_id, vendor_name, paypal_email')
    .ilike('vendor_name', 'carsten%')
    .maybeSingle();

  if (vError) {
    console.error('Error fetching vendor:', vError);
    return;
  }

  if (!vendor) {
    console.log('Vendor not found');
    const { data: allVendors } = await supabase.from('vendors').select('vendor_name').limit(10);
    console.log('Available vendors:', allVendors);
    return;
  }

  console.log('--- VENDOR INFO ---');
  console.log(JSON.stringify(vendor, null, 2));

  const identifier = vendor.auth_id || vendor.vendor_name;
  console.log('Using Identifier:', identifier);

  // 2. Get Unified Balance via RPC or Query
  const { data: ledgerSum, error: lError } = await supabase
    .from('collector_ledger_entries')
    .select('amount, currency, transaction_type')
    .eq('collector_identifier', identifier);

  if (lError) {
    console.error('Error fetching ledger:', lError);
  } else {
    let usdBalance = 0;
    let creditsBalance = 0;
    ledgerSum.forEach(e => {
      if (e.currency === 'USD') usdBalance += Number(e.amount);
      if (e.currency === 'CREDITS') creditsBalance += Number(e.amount);
    });
    console.log('\n--- CALCULATED BALANCE FROM LEDGER ---');
    console.log({ usdBalance, creditsBalance });
  }

  // 3. Get Ledger Entries
  const { data: entries } = await supabase
    .from('collector_ledger_entries')
    .select('*')
    .eq('collector_identifier', identifier)
    .order('created_at', { ascending: false });

  console.log('\n--- LEDGER ENTRIES (Latest 5) ---');
  console.log(JSON.stringify(entries?.slice(0, 5), null, 2));

  // 4. Get Completed Payouts
  const { data: payouts } = await supabase
    .from('vendor_payouts')
    .select('*')
    .eq('vendor_name', vendor.vendor_name)
    .eq('status', 'completed')
    .order('payout_date', { ascending: false });

  console.log('\n--- COMPLETED PAYOUTS (Batch Records) ---');
  console.log(JSON.stringify(payouts, null, 2));

  // 5. Check for missing withdrawals
  console.log('\n--- RECONCILIATION CHECK ---');
  payouts?.forEach(p => {
    const withdrawal = entries?.find(e => e.payout_id === p.id && e.transaction_type === 'payout_withdrawal');
    if (!withdrawal) {
      console.log(`❌ Payout #${p.id} of $${p.amount} is COMPLETED but has NO withdrawal entry in ledger!`);
    } else {
      console.log(`✅ Payout #${p.id} ($${p.amount}) matches ledger entry #${withdrawal.id}`);
    }
  });
}

run().catch(console.error);

