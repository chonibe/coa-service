const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const crypto = require('crypto');

async function populateTestCollector() {
  const env = fs.readFileSync('.env', 'utf8');
  const url = env.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/)[1];
  const key = env.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/)[1];
  const supabase = createClient(url, key);

  const email = 'beigelbills@gmail.com';
  console.log(`Setting up test data for: ${email}`);

  // 1. Create/Update collector profile
  const { data: profile, error: profileError } = await supabase
    .from('collector_profiles')
    .upsert({
      email: email,
      first_name: 'Beigel',
      last_name: 'Bills',
      bio: 'Professional Street Collector and NFT Enthusiast.',
      avatar_url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=beigelbills'
    }, { onConflict: 'email' })
    .select()
    .single();

  if (profileError) {
    console.error('Error upserting profile:', profileError);
    return;
  }
  console.log('Collector profile ready.');

  // 2. Create mock orders and line items
  const testArtworks = [
    {
      name: 'Cyberpunk Skyline #44',
      vendor_name: 'Neon Artist',
      price: 150.00,
      img_url: 'https://images.unsplash.com/photo-1605142859862-978be7eba909?w=800&auto=format&fit=crop&q=60',
      edition_number: 44,
      edition_total: 100
    },
    {
      name: 'Ethereal Forest',
      vendor_name: 'Nature Soul',
      price: 299.00,
      img_url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&auto=format&fit=crop&q=60',
      edition_number: 12,
      edition_total: 50
    },
    {
      name: 'Abstract Chaos v2',
      vendor_name: 'Glitch Master',
      price: 85.00,
      img_url: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=800&auto=format&fit=crop&q=60',
      edition_number: 7,
      edition_total: 25
    }
  ];

  for (const artwork of testArtworks) {
    const orderId = `TEST-ORDER-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const lineItemId = `TEST-LI-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    // Create mock order
    const { error: orderError } = await supabase
      .from('orders')
      .upsert({
        id: orderId,
        order_number: Math.floor(Math.random() * 10000),
        processed_at: new Date().toISOString(),
        total_price: artwork.price,
        currency_code: 'USD',
        customer_email: email,
        financial_status: 'paid',
        fulfillment_status: 'fulfilled'
      });

    if (orderError) {
      console.error(`Error creating order for ${artwork.name}:`, orderError);
      continue;
    }

    const productId = Math.floor(Math.random() * 1000000000).toString();

    // Create line item (pending NFC)
    const { error: liError } = await supabase
      .from('order_line_items_v2')
      .upsert({
        line_item_id: lineItemId,
        order_id: orderId,
        product_id: productId,
        name: artwork.name,
        vendor_name: artwork.vendor_name,
        price: artwork.price,
        img_url: artwork.img_url,
        edition_number: artwork.edition_number,
        edition_total: artwork.edition_total,
        owner_email: email,
        status: 'active',
        nfc_tag_id: `MOCK-TAG-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        nfc_claimed_at: null, // Keep it null so it shows as pending authentication
        created_at: new Date().toISOString()
      }, { onConflict: 'line_item_id' });

    if (liError) {
      console.error(`Error creating line item for ${artwork.name}:`, liError);
    } else {
      console.log(`Added "${artwork.name}" to collection (Pending NFC).`);
    }
  }

  console.log('\nSuccess! beigelbills@gmail.com now has a populated collection.');
  console.log('You can now log in with this email to test the NFC authentication flow.');
}

populateTestCollector();
