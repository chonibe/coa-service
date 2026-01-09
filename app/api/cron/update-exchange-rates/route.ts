import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

/**
 * Daily Cron Job to update currency exchange rates in the database.
 * This ensures financial calculations (GBP -> USD, NIS -> USD) use market rates.
 */
export async function GET(request: Request) {
  // Check for Vercel Cron header to ensure it's a scheduled request
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const EXCHANGE_RATE_API = "https://api.exchangerate-api.com/v4/latest/USD";
  const supabase = createClient();

  try {
    console.log("[cron/update-exchange-rates] Fetching live rates...");
    const response = await fetch(EXCHANGE_RATE_API);
    
    if (!response.ok) {
      throw new Error(`External API error: ${response.statusText}`);
    }

    const data = await response.json();
    const rates = data.rates;

    if (!rates) {
      throw new Error("Rates not found in API response");
    }

    // We want conversion TO USD, so we calculate 1 / rate_relative_to_usd
    // e.g. If 1 USD = 0.79 GBP, then 1 GBP = 1/0.79 = 1.265 USD
    const gbpToUsd = 1 / rates.GBP;
    const ilsToUsd = 1 / rates.ILS;

    console.log(`[cron/update-exchange-rates] New rates: GBP=${gbpToUsd.toFixed(4)}, ILS=${ilsToUsd.toFixed(4)}`);

    // Update database
    const updates = [
      { from_currency: 'GBP', to_currency: 'USD', rate: gbpToUsd },
      { from_currency: 'ILS', to_currency: 'USD', rate: ilsToUsd },
      { from_currency: 'NIS', to_currency: 'USD', rate: ilsToUsd }, // Map NIS same as ILS
    ];

    for (const update of updates) {
      const { error } = await supabase
        .from('exchange_rates')
        .upsert(update, { onConflict: 'from_currency,to_currency' });

      if (error) {
        console.error(`Error updating ${update.from_currency}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      updated_at: new Date().toISOString(),
      rates: updates
    });

  } catch (error: any) {
    console.error("[cron/update-exchange-rates] Fatal error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


