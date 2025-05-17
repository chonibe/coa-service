import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { formatCurrency } from '@/lib/utils';
import type { Database } from '@/types/supabase';
import OrdersList from './OrdersList';
import SyncAllOrdersButton from './SyncAllOrdersButton';
import { ArrowLeft, ExternalLink, AlertCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import Link from "next/link";

interface Order {
  id: string;
  orderId: string;
  order_number: string;
  processed_at: string;
  customer_email: string;
  total_price: number;
  currency_code: string;
  financial_status: string;
  fulfillment_status: string;
  line_items: Array<{
    id: string;
    title: string;
    quantity: number;
    price: number;
  }>;
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

    const hasDuplicates = (order: any) => {
      const titles = order.line_items.map((item: any) => item.title);
      return titles.some((title: string) => 
        titles.filter((t: string) => t === title).length > 1
      );
    };

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
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Link 
                        href={`/admin/orders/${order.id}`}
                        className="hover:text-primary transition-colors"
                      >
                        #{order.order_number}
                      </Link>
                      {hasDuplicates(order) && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <AlertCircle className="h-4 w-4 text-yellow-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>This order contains duplicate items</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                  {/* ... rest of the row ... */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
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