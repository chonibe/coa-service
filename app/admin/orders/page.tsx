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
  order_name?: string | null;
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
  const [limit, setLimit] = useState(50);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);

  useEffect(() => {
    async function fetchOrders() {
      try {
        setIsLoading(true);
        const supabase = createClient<Database>();

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
          source: (order as any).shopify_id || (order as any).raw_shopify_order_data ? 'shopify' : 'warehouse'
        })) as Order[];

        // Deduplicate and prefer Shopify source (handle 1234 and 1234A)
        const orderMap = new Map<string, Order>();
        for (const order of ordersList) {
          // Use order_name (e.g. #1234) if available, otherwise fallback to order_number
          const platformName = order.order_name || (typeof order.order_number === 'number' ? `#${order.order_number}` : String(order.order_number));
          const numStr = platformName.replace('#', '');
          const baseNumStr = numStr.toUpperCase().endsWith('A') ? numStr.slice(0, -1) : numStr;
          
          const existing = orderMap.get(baseNumStr);
          // Prefer Shopify source, or the one without the 'A' if both are same source
          const isBetter = !existing || 
            (order.source === 'shopify' && existing.source !== 'shopify') ||
            (order.source === existing.source && !numStr.toUpperCase().endsWith('A') && (String(existing.order_name || existing.order_number)).toUpperCase().endsWith('A'));
          
          if (isBetter) {
            orderMap.set(baseNumStr, order);
          }
        }
        ordersList = Array.from(orderMap.values());
        
        // Try to fetch warehouse-only orders that aren't in the orders table
        try {
          // We fetch a larger batch of warehouse orders to ensure we have enough after filtering
          const { data: warehouseOnly } = await supabase
            .from('warehouse_orders')
            .select('*')
            .is('shopify_order_id', null)
            .order('created_at', { ascending: false })
            .limit(limit * 2);

          if (warehouseOnly && warehouseOnly.length > 0) {
            // Deduplicate warehouse-only orders (e.g. if we have both 1234 and 1234A)
            const uniqueWarehouseOrders: any[] = [];
            const seenBaseNumbers = new Set<string>();

            // Sort by creation date so we process newest first if there are multiple
            const sortedWO = [...warehouseOnly].sort((a, b) => 
              new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            for (const wo of sortedWO) {
              const numStr = String(wo.order_id).replace('#', '');
              const baseNumStr = numStr.toUpperCase().endsWith('A') ? numStr.slice(0, -1) : numStr;
              
              if (!seenBaseNumbers.has(baseNumStr)) {
                uniqueWarehouseOrders.push(wo);
                seenBaseNumbers.add(baseNumStr);
              }
            }

            const mappedWarehouse: Order[] = uniqueWarehouseOrders.map(wo => ({
              id: wo.id,
              order_number: wo.order_id,
              order_name: wo.order_id, // Warehouse order_id is usually the platform name like #1234
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
              const rawOrderName = String(wo.order_name || wo.order_number);
              const rawOrderNumStr = rawOrderName.replace('#', '');
              const baseOrderNumStr = rawOrderNumStr.toUpperCase().endsWith('A') ? rawOrderNumStr.slice(0, -1) : rawOrderNumStr;
              const baseOrderName = `#${baseOrderNumStr}`;
              
              const existsInPage = ordersList.some(o => {
                const oName = String(o.order_name || o.order_number);
                const oNumStr = oName.replace('#', '');
                const oBaseNumStr = oNumStr.toUpperCase().endsWith('A') ? oNumStr.slice(0, -1) : oNumStr;
                return oBaseNumStr === baseOrderNumStr;
              });
              
              if (!existsInPage) {
                // Check if the base order number or name exists in the orders table at all
                // Following the Hybrid Bridge mechanism: check order_name first
                const { count: inDbByName } = await supabase
                  .from('orders')
                  .select('id', { count: 'exact', head: true })
                  .or(`order_name.eq.${baseOrderName},order_name.eq.#${rawOrderNumStr},order_name.eq.${baseOrderNumStr},order_name.eq.${rawOrderNumStr}`);
                
                if (!inDbByName || inDbByName === 0) {
                  // Fallback to numeric order_number if name match fails
                  const baseNum = parseInt(baseOrderNumStr);
                  if (!isNaN(baseNum)) {
                    const { count: inDbByNum } = await supabase
                      .from('orders')
                      .select('id', { count: 'exact', head: true })
                      .eq('order_number', baseNum);
                    
                    if (!inDbByNum || inDbByNum === 0) {
                      ordersList.push(wo);
                    }
                  } else {
                    ordersList.push(wo);
                  }
                }
              }
            }
            
            // Re-sort everything by date
            ordersList.sort((a, b) => new Date(b.processed_at).getTime() - new Date(a.processed_at).getTime());
            
            // Keep the total list size to the limit
            if (ordersList.length > limit) {
              ordersList = ordersList.slice(0, limit);
            }
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
        setTotalPages(Math.ceil(((count || 0) + 50) / limit)); // Estimate total pages including warehouse
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders');
        setIsLoading(false);
      }
    }

    fetchOrders();
  }, [currentPage, limit, refreshKey]);

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
          <select 
            className="px-3 py-1 border rounded-md bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={limit}
            onChange={(e) => {
              setLimit(parseInt(e.target.value));
              setCurrentPage(1); // Reset to page 1 when limit changes
            }}
          >
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
            <option value={200}>200 per page</option>
          </select>
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