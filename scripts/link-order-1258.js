const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function linkOrder1258() {
  const envContent = fs.readFileSync('.env', 'utf8');
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=["']?(.*?)["']?(\r|\n|$)/);
  const keyMatch = envContent.match(/SUPABASE_SERVICE_ROLE_KEY=["']?(.*?)["']?(\r|\n|$)/);
  
  if (!urlMatch || !keyMatch) {
    console.error('Could not find Supabase URL or Service Role Key in .env');
    return;
  }
  
  const url = urlMatch[1].trim();
  const key = keyMatch[1].trim();
  const supabase = createClient(url, key);

  const email = 'oransh10@gmail.com';
  const orderName = '#1258';

  console.log(`Linking order ${orderName} to ${email}...`);

  // 1. Find the order
  const { data: order, error: findError } = await supabase
    .from('orders')
    .select('id, customer_email')
    .eq('order_name', orderName)
    .maybeSingle();

  if (findError) {
    console.error('Error finding order:', findError.message);
    return;
  }

  if (!order) {
    console.log(`Order ${orderName} not found in database.`);
    return;
  }

  console.log(`Order found. Current email: "${order.customer_email}"`);

  // 2. Update the order
  const { error: updateError } = await supabase
    .from('orders')
    .update({ 
      customer_email: email,
      kickstarter_backing_amount_gbp: 149.00, // Based on the user's initial data for "oransh10"
      kickstarter_backing_amount_usd: 149.00 * 1.344086 // Using the same rate as before
    })
    .eq('id', order.id);

  if (updateError) {
    console.error('Error updating order:', updateError.message);
  } else {
    console.log(`Successfully linked ${orderName} to ${email} and updated backing amount.`);
  }

  // 3. Ensure the backer is in the list
  const { error: backerError } = await supabase
    .from('kickstarter_backers_list')
    .upsert({ email, backing_amount_gbp: 149.00 }, { onConflict: 'email' });

  if (backerError) {
    console.error('Error updating backer list:', backerError.message);
  } else {
    console.log(`Ensured ${email} is in the Kickstarter backer list.`);
  }

  // 4. Update collector profile flag if exists
  await supabase
    .from('collector_profiles')
    .update({ is_kickstarter_backer: true })
    .ilike('email', email);
}

linkOrder1258().catch(console.error);

