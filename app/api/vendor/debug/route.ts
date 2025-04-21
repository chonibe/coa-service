import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function GET(request: NextRequest) {
  const results: any = {
    steps: [],
    success: false,
    vendorFound: false,
    passwordUpdated: false,
  }

  try {
    // Step 1: Check Supabase connection
    results.steps.push("Checking Supabase connection")

    if (!supabaseUrl || !supabaseServiceKey) {
      results.steps.push("❌ Missing Supabase environment variables")
      return NextResponse.json(results, { status: 500 })
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Step 2: Check if vendors table exists
    results.steps.push("Checking vendors table")
    const { data: tableInfo, error: tableError } = await supabase.from("vendors").select("count(*)").limit(1)

    if (tableError) {
      results.steps.push(`❌ Error accessing vendors table: ${tableError.message}`)
      return NextResponse.json(results, { status: 500 })
    }

    results.steps.push("✅ Vendors table exists")

    // Step 3: Check if test_vendor exists
    results.steps.push("Checking if test_vendor exists")
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id, vendor_name, password_hash")
      .eq("vendor_name", "test_vendor")
      .single()

    if (vendorError && !vendorError.message.includes("No rows found")) {
      results.steps.push(`❌ Error checking for test_vendor: ${vendorError.message}`)
      return NextResponse.json(results, { status: 500 })
    }

    if (!vendor) {
      results.steps.push("❌ test_vendor not found, creating it")

      // Create test_vendor
      const { data: newVendor, error: createError } = await supabase
        .from("vendors")
        .insert({ vendor_name: "test_vendor" })
        .select()

      if (createError) {
        results.steps.push(`❌ Error creating test_vendor: ${createError.message}`)
        return NextResponse.json(results, { status: 500 })
      }

      results.steps.push("✅ Created test_vendor")
      results.vendorId = newVendor?.[0]?.id
    } else {
      results.steps.push("✅ test_vendor exists")
      results.vendorId = vendor.id
      results.vendorFound = true
      results.currentPasswordHash = vendor.password_hash || "No password hash set"
    }

    // Step 4: Generate a new password hash for "password123"
    results.steps.push("Generating new password hash for 'password123'")
    const newPasswordHash = await bcrypt.hash("password123", 10)
    results.newPasswordHash = newPasswordHash

    // Step 5: Update the vendor with the new password hash
    results.steps.push("Updating vendor with new password hash")
    const { error: updateError } = await supabase
      .from("vendors")
      .update({ password_hash: newPasswordHash })
      .eq("vendor_name", "test_vendor")

    if (updateError) {
      results.steps.push(`❌ Error updating password hash: ${updateError.message}`)
      return NextResponse.json(results, { status: 500 })
    }

    results.steps.push("✅ Updated password hash")
    results.passwordUpdated = true

    // Step 6: Verify the password hash was updated
    results.steps.push("Verifying password hash update")
    const { data: updatedVendor, error: verifyError } = await supabase
      .from("vendors")
      .select("password_hash")
      .eq("vendor_name", "test_vendor")
      .single()

    if (verifyError) {
      results.steps.push(`❌ Error verifying password hash: ${verifyError.message}`)
      return NextResponse.json(results, { status: 500 })
    }

    if (updatedVendor.password_hash === newPasswordHash) {
      results.steps.push("✅ Password hash verified")
      results.success = true
    } else {
      results.steps.push("❌ Password hash verification failed")
    }

    // Return the results
    return NextResponse.json({
      ...results,
      message: "Diagnostic complete. You can now try logging in with username 'test_vendor' and password 'password123'",
    })
  } catch (error: any) {
    results.steps.push(`❌ Unexpected error: ${error.message || "Unknown error"}`)
    return NextResponse.json(results, { status: 500 })
  }
}
