import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { processCreditPayment } from '@/lib/banking/credit-payment';

/**
 * POST /api/banking/pay
 * Process credit payment for a purchase
 * Body: { collector_identifier, amount, purchase_id?, description? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { collector_identifier, amount, purchase_id, description } = body;

    if (!collector_identifier) {
      return NextResponse.json(
        { error: 'collector_identifier is required' },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    const result = await processCreditPayment(
      collector_identifier,
      amount,
      purchase_id,
      description
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, ...result },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('Error processing payment:', error);
    return NextResponse.json(
      { error: 'Failed to process payment', message: error.message },
      { status: 500 }
    );
  }
}

