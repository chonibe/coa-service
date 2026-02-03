#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAdminUsers() {
  console.log('🔍 Checking for admin users...\n')

  try {
    // Check user_roles table for admin roles
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .eq('role', 'admin')

    if (roleError) {
      console.error('❌ Error checking user_roles:', roleError)
    } else {
      console.log('👤 Admin roles in user_roles table:')
      if (userRoles && userRoles.length > 0) {
        userRoles.forEach(role => {
          console.log(`  ✅ User ID: ${role.user_id}, Role: ${role.role}`)
        })

        // Check actual user emails for admin users
        console.log('\n📧 Checking admin user emails...')
        const adminUserIds = userRoles.map(role => role.user_id)
        const { data: users, error: userError } = await supabase.auth.admin.listUsers()
        if (userError) {
          console.error('❌ Error fetching user details:', userError)
        } else {
          console.log('👥 Admin user details:')
          users.users.forEach(user => {
            if (adminUserIds.includes(user.id)) {
              console.log(`  ✅ ${user.email} (ID: ${user.id})`)
            }
          })
        }
      } else {
        console.log('  ⚠️  No admin roles found in user_roles table')
      }
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkAdminUsers().catch(console.error)