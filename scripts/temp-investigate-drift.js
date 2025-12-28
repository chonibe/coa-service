const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function investigate() {
  const { data: entries } = await supabase
    .from('collector_ledger_entries')
    .select('*')
    .eq('transaction_type', 'payout_withdrawal')
    .eq('currency', 'USD');
  
  console.log('--- ALL LEDGER WITHDRAWALS ---');
  entries?.forEach(e => {
    console.log(`ID: ${e.id} | Vendor: ${e.collector_identifier} | Amount: ${e.amount} | PayoutID: ${e.payout_id} | Desc: ${e.description}`);
  });

  const { data: payouts } = await supabase
    .from('vendor_payouts')
    .select('*')
    .eq('status', 'completed');

  console.log('\n--- ALL COMPLETED PAYOUTS ---');
  payouts?.forEach(p => {
    console.log(`ID: ${p.id} | Vendor: ${p.vendor_name} | Amount: ${p.amount} | Ref: ${p.reference}`);
  });
}

investigate();

