import { createServerClient } from '@supabase/ssr';
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
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            // Server components can't set cookies
          },
          remove(name: string, options: any) {
            // Server components can't remove cookies
          },
        },
      }
    );

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

export default async function OrdersPage({ searchParams }: PageProps) {
  try {
    console.log('OrdersPage searchParams:', searchParams);
    
    const page = typeof searchParams.page === 'string' ? parseInt(searchParams.page) : 1;
    const limit = typeof searchParams.limit === 'string' ? parseInt(searchParams.limit) : 10;
    
    console.log('Parsed page and limit:', { page, limit });
    
    const { orders, totalPages } = await getOrders({ page, limit });
    
    console.log('Orders page data:', { orders, totalPages });

    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Orders</h1>
          <SyncAllOrdersButton />
        </div>
        <OrdersList 
          orders={orders} 
          currentPage={page} 
          totalPages={totalPages} 
        />
      </div>
    );
  } catch (error) {
    console.error('Error in OrdersPage:', error);
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Orders</h1>
          <SyncAllOrdersButton />
        </div>
        <div className="text-red-500">
          Error loading orders. Please try again.
        </div>
      </div>
    );
  }
} 