"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

interface Order {
  id: string;
  order_number: string;
  processed_at: string;
  financial_status: string;
  fulfillment_status: string;
  total_price: number;
  currency_code: string;
  customer_email: string;
  orderId: string;
}

interface OrdersListProps {
  orders: Order[];
  currentPage: number;
  totalPages: number;
}

export default function OrdersList({ orders, currentPage, totalPages }: OrdersListProps) {
  console.log('OrdersList received props:', { orders, currentPage, totalPages });

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
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4">Order</th>
                <th className="text-left p-4">Date</th>
                <th className="text-left p-4">Customer</th>
                <th className="text-left p-4">Status</th>
                <th className="text-right p-4">Total</th>
                <th className="text-right p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-muted/50">
                  <td className="p-4">
                    <div className="font-medium">#{order.order_number}</div>
                  </td>
                  <td className="p-4">
                    {new Date(order.processed_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="text-sm">{order.customer_email}</div>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Badge variant={order.financial_status === 'paid' ? 'default' : 'secondary'}>
                        {order.financial_status}
                      </Badge>
                      {order.fulfillment_status && (
                        <Badge variant={order.fulfillment_status === 'fulfilled' ? 'default' : 'secondary'}>
                          {order.fulfillment_status}
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    {formatCurrency(order.total_price, order.currency_code)}
                  </td>
                  <td className="p-4 text-right">
                    <Button asChild variant="ghost" size="sm">
                      <Link href={`/admin/orders/${order.id}`}>
                        View Details
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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