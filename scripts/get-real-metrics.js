const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function run() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = "https://ldmppmnpgdxueebkkpid.supabase.co";
  const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/) ||
                   env.match(/SUPABASE_SERVICE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  console.log('🔍 Getting Real Platform Metrics...\n');

  try {
    // ============================================================================
    // PAYOUT SYSTEM METRICS
    // ============================================================================

    console.log('📊 PAYOUT SYSTEM METRICS');
    console.log('='.repeat(50));

    // 1. Total payouts processed
    const { data: payouts, error: payoutsError } = await supabase
      .from('vendor_payouts')
      .select('amount, status, created_at, payout_date');

    if (payoutsError) {
      console.error('Payouts error:', payoutsError);
    } else {
      const totalPayouts = payouts?.length || 0;
      const totalPayoutAmount = payouts?.reduce((sum, p) => sum + Number(p.amount || 0), 0) || 0;
      const completedPayouts = payouts?.filter(p => p.status === 'completed').length || 0;
      const successRate = totalPayouts > 0 ? (completedPayouts / totalPayouts) * 100 : 0;

      console.log(`Total payouts processed: ${totalPayouts}`);
      console.log(`Total payout amount: $${totalPayoutAmount.toFixed(2)}`);
      console.log(`Completed payouts: ${completedPayouts}`);
      console.log(`Success rate: ${successRate.toFixed(1)}%`);
    }

    // 2. Payout velocity (payouts per week)
    if (payouts && payouts.length > 0) {
      const sortedPayouts = payouts.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      const firstDate = new Date(sortedPayouts[0].created_at);
      const lastDate = new Date(sortedPayouts[sortedPayouts.length - 1].created_at);
      const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);
      const weeksDiff = Math.max(daysDiff / 7, 1);
      const payoutVelocity = sortedPayouts.length / weeksDiff;

      console.log(`Payout velocity: ${payoutVelocity.toFixed(1)} payouts/week`);
    }

    // 3. Average payout amount
    if (payouts && payouts.length > 0) {
      const avgPayout = payouts.reduce((sum, p) => sum + Number(p.amount || 0), 0) / payouts.length;
      console.log(`Average payout amount: $${avgPayout.toFixed(2)}`);
    }

    console.log('');

    // ============================================================================
    // NFC AUTHENTICATION METRICS
    // ============================================================================

    console.log('📱 NFC AUTHENTICATION METRICS');
    console.log('='.repeat(50));

    // 1. Total certificates generated
    const { data: certificates, error: certError } = await supabase
      .from('certificates')
      .select('id');

    if (certError) {
      console.error('Certificates error:', certError);
    } else {
      console.log(`Total certificates generated: ${certificates?.length || 0}`);
    }

    // 2. NFC tags paired
    const { data: nfcTags, error: nfcError } = await supabase
      .from('nfc_tags')
      .select('id, status');

    if (nfcError) {
      console.error('NFC tags error:', nfcError);
    } else {
      const activeTags = nfcTags?.filter(tag => tag.status === 'active').length || 0;
      console.log(`Total NFC tags paired: ${nfcTags?.length || 0}`);
      console.log(`Active NFC tags: ${activeTags}`);
    }

    // 3. Collector dashboard authentication stats
    const { data: lineItems, error: liError } = await supabase
      .from('order_line_items_v2')
      .select('id, nfc_tag_id, nfc_claimed_at, certificate_url, edition_number')
      .not('edition_number', 'is', null);

    if (liError) {
      console.error('Line items error:', liError);
    } else {
      const totalArtworks = lineItems?.length || 0;
      const authenticatedCount = lineItems?.filter(li => li.nfc_tag_id && li.nfc_claimed_at).length || 0;
      const unauthenticatedCount = lineItems?.filter(li => li.nfc_tag_id && !li.nfc_claimed_at).length || 0;
      const certificatesReady = lineItems?.filter(li => li.certificate_url).length || 0;

      console.log(`Total artworks with editions: ${totalArtworks}`);
      console.log(`Authenticated artworks: ${authenticatedCount}`);
      console.log(`Unauthenticated artworks: ${unauthenticatedCount}`);
      console.log(`Certificates ready: ${certificatesReady}`);
    }

    console.log('');

    // ============================================================================
    // UNLOCKABLE SERIES METRICS
    // ============================================================================

    console.log('🎯 UNLOCKABLE SERIES METRICS');
    console.log('='.repeat(50));

    // 1. Active series count
    const { data: series, error: seriesError } = await supabase
      .from('artwork_series')
      .select('id, name, unlock_type')
      .eq('is_active', true);

    if (seriesError) {
      console.error('Series error:', seriesError);
    } else {
      console.log(`Total active series: ${series?.length || 0}`);

      // Series by unlock type
      const unlockTypes = {};
      series?.forEach(s => {
        unlockTypes[s.unlock_type] = (unlockTypes[s.unlock_type] || 0) + 1;
      });

      console.log('Series by unlock type:');
      Object.entries(unlockTypes).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
    }

    // 2. Series membership stats
    const { data: seriesMembers, error: membersError } = await supabase
      .from('artwork_series_members')
      .select('shopify_product_id, series_id');

    if (membersError) {
      console.error('Series members error:', membersError);
    } else {
      const totalMemberships = seriesMembers?.length || 0;
      const uniqueSeries = new Set(seriesMembers?.map(m => m.series_id)).size;

      console.log(`Total series memberships: ${totalMemberships}`);
      console.log(`Unique series with members: ${uniqueSeries}`);
    }

    // 3. Collector series ownership
    if (lineItems && seriesMembers) {
      const productIds = new Set(lineItems.map(li => li.product_id).filter(Boolean));
      const ownedSeriesProducts = seriesMembers.filter(member =>
        productIds.has(member.shopify_product_id)
      );

      const uniqueOwnedSeries = new Set(ownedSeriesProducts.map(m => m.series_id)).size;
      console.log(`Collectors own products in ${uniqueOwnedSeries} different series`);
    }

    console.log('');

    // ============================================================================
    // ARTIST-COLLECTOR ECOSYSTEM METRICS
    // ============================================================================

    console.log('🌐 ARTIST-COLLECTOR ECOSYSTEM METRICS');
    console.log('='.repeat(50));

    // 1. Credit transactions
    const { data: creditTransactions, error: creditError } = await supabase
      .from('collector_ledger_entries')
      .select('amount, transaction_type, currency')
      .eq('currency', 'USD');

    if (creditError) {
      console.error('Credit transactions error:', creditError);
    } else {
      const earned = creditTransactions?.filter(t => t.transaction_type === 'payout_earned').reduce((sum, t) => sum + t.amount, 0) || 0;
      const spent = Math.abs(creditTransactions?.filter(t => t.transaction_type === 'payout_withdrawal').reduce((sum, t) => sum + t.amount, 0) || 0);
      const refunds = Math.abs(creditTransactions?.filter(t => t.transaction_type === 'refund_deduction').reduce((sum, t) => sum + t.amount, 0) || 0);

      console.log(`Total credits earned by artists: $${earned.toFixed(2)}`);
      console.log(`Total credits spent/withdrawn: $${spent.toFixed(2)}`);
      console.log(`Total refund deductions: $${refunds.toFixed(2)}`);
      console.log(`Net credits in circulation: $${(earned - spent - refunds).toFixed(2)}`);
    }

    // 2. Product benefits/perks
    const { data: benefits, error: benefitsError } = await supabase
      .from('product_benefits')
      .select('benefit_type_id, benefit_types(name)')
      .not('benefit_type_id', 'is', null);

    if (benefitsError) {
      console.error('Benefits error:', benefitsError);
    } else {
      const totalBenefits = benefits?.length || 0;
      console.log(`Total product benefits configured: ${totalBenefits}`);

      const benefitTypes = {};
      benefits?.forEach(b => {
        const typeName = b.benefit_types?.name || 'unknown';
        benefitTypes[typeName] = (benefitTypes[typeName] || 0) + 1;
      });

      console.log('Benefits by type:');
      Object.entries(benefitTypes).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });
    }

    // 3. Collector profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('collector_profile_comprehensive')
      .select('user_email, total_editions, authenticated_editions');

    if (profilesError) {
      console.error('Profiles error:', profilesError);
    } else {
      const totalProfiles = profiles?.length || 0;
      const totalEditions = profiles?.reduce((sum, p) => sum + (p.total_editions || 0), 0) || 0;
      const totalAuthenticated = profiles?.reduce((sum, p) => sum + (p.authenticated_editions || 0), 0) || 0;

      console.log(`Total collector profiles: ${totalProfiles}`);
      console.log(`Total editions owned: ${totalEditions}`);
      console.log(`Total authenticated editions: ${totalAuthenticated}`);
    }

    // 4. Vendor stats
    const { data: vendors, error: vendorError } = await supabase
      .from('vendors')
      .select('vendor_name');

    if (vendorError) {
      console.error('Vendors error:', vendorError);
    } else {
      console.log(`Total registered vendors: ${vendors?.length || 0}`);
    }

    console.log('');

    // ============================================================================
    // PLATFORM OVERVIEW
    // ============================================================================

    console.log('📈 PLATFORM OVERVIEW');
    console.log('='.repeat(50));

    // Orders and line items
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, created_at, customer_email');

    if (ordersError) {
      console.error('Orders error:', ordersError);
    } else {
      console.log(`Total orders: ${orders?.length || 0}`);

      if (orders && orders.length > 0) {
        const sortedOrders = orders.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
        const firstOrder = sortedOrders[0];
        const lastOrder = sortedOrders[sortedOrders.length - 1];

        console.log(`First order date: ${new Date(firstOrder.created_at).toLocaleDateString()}`);
        console.log(`Last order date: ${new Date(lastOrder.created_at).toLocaleDateString()}`);

        // Unique customers
        const uniqueCustomers = new Set(orders.map(o => o.customer_email).filter(Boolean)).size;
        console.log(`Unique customers: ${uniqueCustomers}`);
      }
    }

    // Recent platform updates
    const { data: updates, error: updatesError } = await supabase
      .from('platform_updates')
      .select('title, category, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    if (updatesError) {
      console.error('Updates error:', updatesError);
    } else {
      console.log(`Recent platform updates: ${updates?.length || 0}`);
      updates?.forEach(update => {
        console.log(`  ${update.created_at.split('T')[0]}: ${update.title} (${update.category})`);
      });
    }

    console.log('\n✅ Metrics collection complete!');

  } catch (error) {
    console.error('Error:', error);
  }
}

run();