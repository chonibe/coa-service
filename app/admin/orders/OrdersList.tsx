"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Table, TableHeader, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';
import { ArrowLeft, ExternalLink, AlertCircle } from "lucide-react";

interface Order {
  id: string;
  order_number: string;
  processed_at: string;
  financial_status: string;
  fulfillment_status: string;
  total_price: number;
  currency_code: string;
  customer_email: string;
  line_items: Array<{
    id: string;
    product_id: string;
  }>;
  has_duplicates?: boolean;
}

interface OrdersListProps {
  orders: Order[];
  currentPage: number;
  totalPages: number;
}

export default function OrdersList({ orders, currentPage, totalPages }: OrdersListProps) {
  console.log('OrdersList received props:', { orders, currentPage, totalPages });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/orders');
        if (!res.ok) throw new Error('Failed to fetch orders');
        const data = await res.json();
        
        // Process orders to identify duplicates
        const ordersWithDuplicates = data.map((order: Order) => {
          const seen = new Set<string>();
          const hasDuplicates = order.line_items.some(item => {
            if (item.product_id) {
              if (seen.has(item.product_id)) return true;
              seen.add(item.product_id);
            }
            return false;
          });
          return { ...order, has_duplicates: hasDuplicates };
        });

        setOrders(ordersWithDuplicates);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (!orders || orders.length === 0) {
    console.log('No orders to display');
    return (
      <Card className="p-6">
        <div className="text-center text-muted-foreground">
          No orders found. Try syncing orders from Shopify.
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow 
                  key={order.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => window.location.href = `/admin/orders/${order.id}`}
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="hover:text-primary transition-colors">
                        #{order.order_number}
                      </span>
                      {order.has_duplicates && (
                        <AlertCircle className="h-4 w-4 text-yellow-500" title="This order has duplicate items" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{new Date(order.processed_at).toLocaleDateString()}</TableCell>
                  <TableCell>{order.customer_email}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(order.total_price, order.currency_code)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Badge 
                        variant={order.financial_status === 'paid' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {order.financial_status}
                      </Badge>
                      <Badge 
                        variant={order.fulfillment_status === 'fulfilled' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {order.fulfillment_status || 'pending'}
                      </Badge>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set('page', (currentPage - 1).toString());
              window.location.href = url.toString();
            }}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set('page', (currentPage + 1).toString());
              window.location.href = url.toString();
            }}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
} 