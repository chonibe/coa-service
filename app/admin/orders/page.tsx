import { Suspense } from 'react';
import { headers } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { formatCurrency } from '@/lib/utils';
import type { Database } from '@/types/supabase';
import OrdersList from './OrdersList';
import SyncAllOrdersButton from './SyncAllOrdersButton';

interface Order {
  id: string;
  order_number: string;
  processed_at: string;
  financial_status: string;
  fulfillment_status: string;
  total_price: number;
  currency_code: string;
  customer_email: string;
}

interface PageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

interface GetOrdersParams {
  page: number;
  limit: number;
}

async function getOrders({ page, limit }: GetOrdersParams) {
  try {
    console.log('Fetching orders with params:', { page, limit });
    
    const cookieStore = await cookies();
    const supabase = createServerComponentClient({ cookies: () => cookieStore });

    const offset = (page - 1) * limit;
    console.log('Calculated offset:', offset);

    // Get total count
    const { count, error: countError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error getting count:', countError);
      return { orders: [], totalPages: 0 };
    }

    console.log('Total orders count:', count);

    // Get paginated orders
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .order('processed_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching orders:', error);
      return { orders: [], totalPages: 0 };
    }

    console.log('Fetched orders:', orders);

    return {
      orders: orders as Order[],
      totalPages: Math.ceil((count || 0) / limit),
    };
  } catch (error) {
    console.error('Unexpected error in getOrders:', error);
    return { orders: [], totalPages: 0 };
  }
}

async function OrdersList() {
  const cookieStore = cookies();
  const supabase = createServerComponentClient({ cookies: () => cookieStore });

  // Use a fixed page size and default to first page
  const PAGE_SIZE = 10;
  const page = 1;

  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

  if (error) {
    return <div>Error loading orders: {error.message}</div>;
  }

  return (
    <div>
      {orders.map(order => (
        <div key={order.id}>
          {/* Render order details */}
          <p>{order.id}</p>
        </div>
      ))}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div>Loading orders...</div>}>
      <OrdersList />
    </Suspense>
  );
} 