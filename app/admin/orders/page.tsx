'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Database } from '@/types/supabase';
import OrdersList from './OrdersList';
import SyncAllOrdersButton from './SyncAllOrdersButton';
import SyncOrderStatusesButton from './SyncOrderStatusesButton';
import CompareOrdersButton from './CompareOrdersButton';
import SyncOrdersButton from './SyncOrdersButton';

interface Order {
  id: string;
  order_number: number | string;
  processed_at: string;
  financial_status: string;
  fulfillment_status: string | null;
  total_price: number;
  currency_code: string;
  customer_email: string;
  customer_profile?: any;
  line_items?: any[];
  raw_shopify_order_data?: any;
  cancelled_at?: string | null;
  archived?: boolean;
  shopify_order_status?: string | null;
  source?: 'shopify' | 'warehouse';
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  useEffect(() => {
    async function fetchOrders() {
      try {
        setIsLoading(true);
        const supabase = createClient<Database>();

        const limit = 10;
        const offset = (currentPage - 1) * limit;

        // Get total count
        const { count, error: countError } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true });

        if (countError) {
          throw countError;
        }

        // Get paginated orders
        const { data: fetchedOrders, error } = await supabase
          .from('orders')
          .select('*')
          .order('processed_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) {
          throw error;
        }

        let ordersList = (fetchedOrders || []).map(order => ({
          ...order,
          source: (order as any).raw_shopify_order_data ? 'shopify' : 'warehouse'
        })) as Order[];
        
        // Try to fetch warehouse-only orders that aren't in the orders table
        try {
          const { data: warehouseOnly } = await supabase
            .from('warehouse_orders')
            .select('*')
            .is('shopify_order_id', null)
            .order('created_at', { ascending: false })
            .limit(10);

          if (warehouseOnly && warehouseOnly.length > 0) {
            const mappedWarehouse: Order[] = warehouseOnly.map(wo => ({
              id: wo.id,
              order_number: wo.order_id,
              processed_at: wo.created_at,
              financial_status: 'paid',
              fulfillment_status: wo.status_name?.toLowerCase().includes('shipped') ? 'fulfilled' : 'unfulfilled',
              total_price: 0,
              currency_code: 'USD',
              customer_email: wo.ship_email || '',
              source: 'warehouse'
            }));

            // Only add if not already in the list and doesn't exist in the orders table
            for (const wo of mappedWarehouse) {
              const orderNum = String(wo.order_number).replace('#', '');
              const existsInPage = ordersList.some(o => String(o.order_number) === orderNum);
              
              if (!existsInPage) {
                // Check if it exists in the orders table at all
                const { count: inDb } = await supabase
                  .from('orders')
                  .select('id', { count: 'exact', head: true })
                  .eq('order_number', orderNum);
                
                if (!inDb || inDb === 0) {
                  ordersList.push(wo);
                }
              }
            }
            
            // Re-sort and take the top ones for the current page
            ordersList.sort((a, b) => new Date(b.processed_at).getTime() - new Date(a.processed_at).getTime());
            ordersList = ordersList.slice(0, limit);
          }
        } catch (wErr) {
          console.error('Error fetching warehouse orders:', wErr);
          // Continue with what we have
        }

        // Fetch profiles for these orders
        const emails = ordersList.map(o => o.customer_email).filter(Boolean);
        if (emails.length > 0) {
          const { data: profiles } = await supabase
            .from('collector_profile_comprehensive')
            .select('*')
            .in('user_email', emails);
          
          if (profiles) {
            ordersList.forEach(order => {
              order.customer_profile = profiles.find(p => 
                p.user_email?.toLowerCase() === order.customer_email?.toLowerCase()
              );
            });
          }
        }

        setOrders(ordersList);
        setTotalPages(Math.ceil((count || 0) / limit));
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders');
        setIsLoading(false);
      }
    }

    fetchOrders();
  }, [currentPage, refreshKey]);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Orders</h1>
          <div className="flex gap-2">
            <CompareOrdersButton 
              selectedOrderIds={selectedOrderIds}
              onSyncComplete={handleRefresh}
            />
            <SyncOrdersButton />
            <SyncOrderStatusesButton />
            <SyncAllOrdersButton />
          </div>
        </div>
        <div className="text-center">Loading orders...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Orders</h1>
          <div className="flex gap-2">
            <CompareOrdersButton 
              selectedOrderIds={selectedOrderIds}
              onSyncComplete={handleRefresh}
            />
            <SyncOrdersButton />
            <SyncOrderStatusesButton />
            <SyncAllOrdersButton />
          </div>
        </div>
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Orders</h1>
        <div className="flex gap-2">
          <CompareOrdersButton 
            selectedOrderIds={selectedOrderIds}
            onSyncComplete={handleRefresh}
          />
          <SyncOrdersButton />
          <SyncAllOrdersButton />
        </div>
      </div>
      <OrdersList 
        orders={orders} 
        currentPage={currentPage} 
        totalPages={totalPages} 
        onPageChange={setCurrentPage}
        onRefresh={handleRefresh}
        onSelectedOrdersChange={setSelectedOrderIds}
      />
    </div>
  );
} 