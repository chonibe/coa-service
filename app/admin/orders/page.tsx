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
  order_number: number;
  processed_at: string;
  financial_status: string;
  fulfillment_status: string | null;
  total_price: number;
  currency_code: string;
  customer_email: string;
  line_items?: any[];
  raw_shopify_order_data?: any;
  cancelled_at?: string | null;
  archived?: boolean;
  shopify_order_status?: string | null;
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

        setOrders(fetchedOrders as Order[]);
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