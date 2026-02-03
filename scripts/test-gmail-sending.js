/**
 * Test Gmail Email Sending
 * 
 * Usage:
 *   node scripts/test-gmail-sending.js [recipient-email]
 * 
 * Example:
 *   node scripts/test-gmail-sending.js chonibe@gmail.com
 * 
 * Prerequisites:
 *   1. An admin must have logged in via /login?admin=true and approved Gmail permissions
 *   2. Environment variables must be set (SUPABASE_*, GOOGLE_CLIENT_*)
 */

require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

// Check required env vars
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_GOOGLE_CLIENT_ID',
  'SUPABASE_GOOGLE_CLIENT_SECRET',
];

const missing = requiredEnvVars.filter(v => !process.env[v]);
if (missing.length > 0) {
  console.error('❌ Missing environment variables:', missing.join(', '));
  process.exit(1);
}

// Admin emails (same as in lib/vendor-auth.ts)
const ADMIN_EMAILS = ["choni@thestreetlamp.com", "chonibe@gmail.com"];

async function main() {
  const testEmail = process.argv[2] || 'chonibe@gmail.com';
  
  console.log('🧪 Gmail Email Sending Test');
  console.log('===========================\n');
  
  // Create Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  
  // Step 1: Check for admin users with Gmail tokens
  console.log('1️⃣ Checking for admin users with Gmail tokens...\n');
  
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
  
  if (usersError) {
    console.error('❌ Error listing users:', usersError);
    process.exit(1);
  }
  
  let adminWithTokens = null;
  
  for (const user of users) {
    if (!user.email || !ADMIN_EMAILS.includes(user.email.toLowerCase())) continue;
    
    const providerToken = user.app_metadata?.provider_token;
    const providerRefreshToken = user.app_metadata?.provider_refresh_token;
    
    console.log(`   📧 ${user.email}`);
    console.log(`      - Has access token: ${!!providerToken}`);
    console.log(`      - Has refresh token: ${!!providerRefreshToken}`);
    
    if (providerRefreshToken) {
      adminWithTokens = { email: user.email, refreshToken: providerRefreshToken };
    }
  }
  
  console.log('');
  
  if (!adminWithTokens) {
    console.log('❌ No admin user found with Gmail tokens.');
    console.log('');
    console.log('📋 To fix this:');
    console.log('   1. Go to: ' + (process.env.NEXT_PUBLIC_APP_URL || 'https://your-app.com') + '/login?admin=true');
    console.log('   2. Sign in with an admin Google account');
    console.log('   3. Approve Gmail permissions when prompted');
    console.log('   4. Run this script again');
    process.exit(1);
  }
  
  console.log(`✅ Found admin with Gmail tokens: ${adminWithTokens.email}\n`);
  
  // Step 2: Try to refresh the token
  console.log('2️⃣ Testing token refresh...\n');
  
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.SUPABASE_GOOGLE_CLIENT_ID,
        client_secret: process.env.SUPABASE_GOOGLE_CLIENT_SECRET,
        refresh_token: adminWithTokens.refreshToken,
        grant_type: 'refresh_token',
      }),
    });
    
    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('❌ Token refresh failed:', errorData);
      console.log('');
      console.log('📋 The refresh token may have expired. Please:');
      console.log('   1. Log out from the admin portal');
      console.log('   2. Log in again at /login?admin=true');
      console.log('   3. Make sure to approve Gmail permissions');
      process.exit(1);
    }
    
    const tokenData = await tokenResponse.json();
    console.log('✅ Token refresh successful!\n');
    console.log(`   - Access token: ${tokenData.access_token.substring(0, 20)}...`);
    console.log(`   - Expires in: ${tokenData.expires_in} seconds\n`);
    
    // Step 3: Test sending an email via Gmail API
    console.log('3️⃣ Sending test email via Gmail API...\n');
    
    const { google } = require('googleapis');
    
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: tokenData.access_token });
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Get sender email
    const profile = await gmail.users.getProfile({ userId: 'me' });
    const senderEmail = profile.data.emailAddress;
    console.log(`   Sending from: ${senderEmail}`);
    console.log(`   Sending to: ${testEmail}\n`);
    
    // Create email message
    const subject = '🧪 Gmail Sending Test - Street Collector';
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #8217ff;">Gmail Sending Test</h1>
        <p>This is a test email sent via the Gmail API.</p>
        <p>If you're seeing this, Gmail email sending is working correctly! 🎉</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          Sent at: ${new Date().toISOString()}<br>
          From: ${senderEmail}
        </p>
      </div>
    `;
    
    const messageParts = [
      `From: ${senderEmail}`,
      `To: ${testEmail}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=utf-8',
      '',
      htmlBody,
    ];
    
    const rawMessage = Buffer.from(messageParts.join('\r\n'))
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    
    const sendResult = await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: rawMessage },
    });
    
    console.log('✅ Email sent successfully!\n');
    console.log(`   Message ID: ${sendResult.data.id}`);
    console.log(`   Thread ID: ${sendResult.data.threadId}`);
    console.log('');
    console.log(`📬 Check ${testEmail} for the test email!`);
    
  } catch (error) {
    console.error('❌ Error:', error.message || error);
    
    if (error.message?.includes('invalid_grant')) {
      console.log('');
      console.log('📋 The OAuth grant is invalid. Please:');
      console.log('   1. Log out from the admin portal');
      console.log('   2. Log in again at /login?admin=true');
      console.log('   3. Make sure to approve Gmail permissions');
    }
    
    process.exit(1);
  }
  
  console.log('\n✨ All tests passed! Gmail sending is ready to use.');
}

main().catch(console.error);
