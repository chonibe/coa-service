import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { redeemPerk } from '@/lib/banking/perk-redemption';

/**
 * POST /api/banking/perks/redeem
 * Redeem a perk (lamp or proof print)
 * Body: { collector_identifier, perk_type, product_sku?, artwork_submission_id? }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { collector_identifier, perk_type, product_sku, artwork_submission_id } = body;

    if (!collector_identifier) {
      return NextResponse.json(
        { error: 'collector_identifier is required' },
        { status: 400 }
      );
    }

    if (!perk_type || (perk_type !== 'lamp' && perk_type !== 'proof_print')) {
      return NextResponse.json(
        { error: 'Valid perk_type is required (lamp or proof_print)' },
        { status: 400 }
      );
    }

    if (perk_type === 'lamp' && !product_sku) {
      return NextResponse.json(
        { error: 'product_sku is required for lamp redemptions' },
        { status: 400 }
      );
    }

    if (perk_type === 'proof_print' && !artwork_submission_id) {
      return NextResponse.json(
        { error: 'artwork_submission_id is required for proof print redemptions' },
        { status: 400 }
      );
    }

    const result = await redeemPerk(
      collector_identifier,
      perk_type,
      product_sku,
      artwork_submission_id
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
    console.error('Error redeeming perk:', error);
    return NextResponse.json(
      { error: 'Failed to redeem perk', message: error.message },
      { status: 500 }
    );
  }
}

