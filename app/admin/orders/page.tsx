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
  source?: 'shopify' | 'warehouse' | 'warehouse_made';
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
          .select('*, line_items:order_line_items_v2(*)')
          .order('processed_at', { ascending: false })
          .range(offset, offset + limit - 1);

        if (error) {
          throw error;
        }

        const getFingerprint = (items: any[]) => {
          if (!items || items.length === 0) return null;
          return items
            .map(item => `${(item.sku || item.sku_code || '').toLowerCase()}:${item.quantity}`)
            .sort()
            .join('|');
        };

        let ordersList = (fetchedOrders || []).map(order => {
          // Rule 1: Shopify is top level of truth.
          // If it has shopify_id, it's a Shopify order.
          const isShopifyOrder = !!(order as any).shopify_id;
          
          return {
            ...order,
            source: isShopifyOrder ? 'shopify' : 'warehouse'
          };
        }) as Order[];

        // Deduplicate and pair (Bridge Mechanism)
        const orderMap = new Map<string, Order>(); // key is base platform name (e.g. 1234)
        const customerFingerprintMap = new Map<string, string>(); // customerEmail:fingerprint -> baseNumStr

        for (const order of ordersList) {
          const platformName = order.order_name || (typeof order.order_number === 'number' ? `#${order.order_number}` : String(order.order_number));
          const numStr = platformName.replace('#', '');
          // Handle 'A' suffix: #1234A is paired with #1234
          const baseNumStr = numStr.toUpperCase().endsWith('A') ? numStr.slice(0, -1) : numStr;
          
          const fingerprint = getFingerprint(order.line_items || []);
          const customerKey = order.customer_email ? `${order.customer_email.toLowerCase()}:${fingerprint}` : null;
          
          const existingByNum = orderMap.get(baseNumStr);
          const existingByFingerprintKey = customerKey ? customerFingerprintMap.get(customerKey) : null;
          const existing = existingByNum || (existingByFingerprintKey ? orderMap.get(existingByFingerprintKey) : null);

          // Priority: 
          // 1. Shopify source takes absolute precedence
          // 2. Original order number (no 'A') takes precedence if same source
          const isBetter = !existing || 
            (order.source === 'shopify' && existing.source !== 'shopify') ||
            (order.source === existing.source && !numStr.toUpperCase().endsWith('A') && (String(existing.order_name || existing.order_number)).toUpperCase().endsWith('A'));
          
          if (isBetter) {
            if (existing && existingByFingerprintKey && existingByFingerprintKey !== baseNumStr) {
              orderMap.delete(existingByFingerprintKey);
            }
            orderMap.set(baseNumStr, order);
            if (customerKey) customerFingerprintMap.set(customerKey, baseNumStr);
          }
        }
        ordersList = Array.from(orderMap.values());
        
        // Try to fetch warehouse-only orders (Gifts / Off-Shopify)
        try {
          const { data: warehouseOnly } = await supabase
            .from('warehouse_orders')
            .select('*')
            .is('shopify_order_id', null)
            .order('created_at', { ascending: false })
            .limit(limit * 2);

          if (warehouseOnly && warehouseOnly.length > 0) {
            // Filter and label as "Warehouse Made"
            const uniqueWarehouseOrders: any[] = [];
            
            for (const wo of warehouseOnly) {
              const rawNumStr = String(wo.order_id).replace('#', '');
              const baseNumStr = rawNumStr.toUpperCase().endsWith('A') ? rawNumStr.slice(0, -1) : rawNumStr;
              const fingerprint = getFingerprint(wo.raw_data?.info || []);
              const customerKey = wo.ship_email ? `${wo.ship_email.toLowerCase()}:${fingerprint}` : null;

              // Check if it already exists in our matched ordersList
              const existsInPage = ordersList.some(o => {
                const oNumStr = String(o.order_name || o.order_number).replace('#', '');
                const oBaseNumStr = oNumStr.toUpperCase().endsWith('A') ? oNumStr.slice(0, -1) : oNumStr;
                if (oBaseNumStr === baseNumStr) return true;
                
                if (customerKey && o.customer_email) {
                  const oFingerprint = getFingerprint(o.line_items || []);
                  return customerKey === `${o.customer_email.toLowerCase()}:${oFingerprint}`;
                }
                return false;
              });

              if (!existsInPage) {
                // Check database for existing Shopify order with same name or base name
                const { count: inDb } = await supabase
                  .from('orders')
                  .select('id', { count: 'exact', head: true })
                  .or(`order_name.eq.#${baseNumStr},order_name.eq.#${rawNumStr},order_number.eq.${parseInt(baseNumStr) || -1}`);

                if (!inDb || inDb === 0) {
                  uniqueWarehouseOrders.push(wo);
                }
              }
            }

            const mappedWarehouseMade: Order[] = [];
            
            for (const wo of uniqueWarehouseOrders) {
              const email = wo.ship_email?.toLowerCase();
              let hasShopifyConnection = false;
              
              if (email) {
                // Check if this email is associated with any Shopify order
                const { count: shopifyCount } = await supabase
                  .from('orders')
                  .select('id', { count: 'exact', head: true })
                  .eq('customer_email', email)
                  .not('shopify_id', 'is', null);
                
                if (shopifyCount && shopifyCount > 0) {
                  hasShopifyConnection = true;
                }
              }

              mappedWarehouseMade.push({
                id: wo.id,
                order_number: wo.order_id,
                order_name: wo.order_id,
                processed_at: wo.created_at,
                financial_status: 'paid',
                fulfillment_status: wo.status_name?.toLowerCase().includes('shipped') ? 'fulfilled' : 'unfulfilled',
                total_price: 0,
                currency_code: 'USD',
                customer_email: wo.ship_email || '',
                source: hasShopifyConnection ? 'warehouse' : 'warehouse_made', // Rule 2: Mark gifts/off-shopify as warehouse made if no shopify connection
                line_items: wo.raw_data?.info || []
              });
            }

            ordersList = [...ordersList, ...mappedWarehouseMade];
            
            // Re-sort everything by date
            ordersList.sort((a, b) => new Date(b.processed_at).getTime() - new Date(a.processed_at).getTime());
            
            if (ordersList.length > limit) {
              ordersList = ordersList.slice(0, limit);
            }
          }
        } catch (wErr) {
          console.error('Error fetching warehouse-made orders:', wErr);
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