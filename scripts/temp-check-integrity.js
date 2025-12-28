const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIntegrity() {
  // 1. Sum of all completed payouts
  const { data: payoutSum } = await supabase
    .from('vendor_payouts')
    .select('amount')
    .eq('status', 'completed');

  const totalPayouts = payoutSum?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;

  // 2. Sum of all ledger withdrawals
  const { data: ledgerSum } = await supabase
    .from('collector_ledger_entries')
    .select('amount')
    .eq('transaction_type', 'payout_withdrawal')
    .eq('currency', 'USD');

  const totalWithdrawals = Math.abs(ledgerSum?.reduce((sum, l) => sum + Number(l.amount || 0), 0) || 0);

  const drift = Math.abs(totalPayouts - totalWithdrawals);

  console.log('--- PLATFORM INTEGRITY ---');
  console.log({
    totalPayouts,
    totalWithdrawals,
    drift,
    isHealthy: drift < 0.01
  });
}

checkIntegrity();

