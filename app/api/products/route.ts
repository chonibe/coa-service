import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)
export async function GET() {
  try {
    // Check for admin session cookie
    const cookieStore = await cookies()
    const adminSession = cookieStore.get('admin_session')
    if (!adminSession) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    // Fetch products from the database
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 })
    }
    return NextResponse.json(products || [])
  } catch (error) {
    console.error('Error in products route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 