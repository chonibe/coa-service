import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/banking/transactions
 * Get transaction history with pagination
 * Query params: 
 *   - collector_identifier (required)
 *   - page (optional, default 1)
 *   - limit (optional, default 50)
 *   - transaction_type (optional filter)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const collectorIdentifier = searchParams.get('collector_identifier');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100
    const transactionType = searchParams.get('transaction_type');

    if (!collectorIdentifier) {
      return NextResponse.json(
        { error: 'collector_identifier is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from('collector_ledger_entries')
      .select('*', { count: 'exact' })
      .eq('collector_identifier', collectorIdentifier)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Filter by transaction type if provided
    if (transactionType) {
      query = query.eq('transaction_type', transactionType);
    }

    const { data: transactions, error, count } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch transactions', message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      transactions: transactions || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch (error: any) {
    console.error('Error getting transactions:', error);
    return NextResponse.json(
      { error: 'Failed to get transactions', message: error.message },
      { status: 500 }
    );
  }
}

