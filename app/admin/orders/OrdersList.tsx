"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('processed_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const url = new URL(window.location.href);
    url.searchParams.set('search', searchQuery);
    url.searchParams.set('page', '1');
    window.location.href = url.toString();
  };

  const handleFilterChange = (value: string) => {
    setStatusFilter(value);
    const url = new URL(window.location.href);
    if (value === 'all') {
      url.searchParams.delete('status');
    } else {
      url.searchParams.set('status', value);
    }
    url.searchParams.set('page', '1');
    window.location.href = url.toString();
  };

  if (!orders || orders.length === 0) {
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
      <form onSubmit={handleSearch} className="flex gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Search by order number or customer email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={statusFilter || 'all'} onValueChange={handleFilterChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
        <Button type="submit">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
      </form>

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
                <th className="text-right p-4">Product Editions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-muted/50">
                  <td className="p-4">
                    <Link href={`/admin/orders/${order.id}`} className="font-medium text-blue-600 hover:underline">
                      #{order.order_number}
                    </Link>
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
                  <td className="p-4 text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/admin/product-editions/${order.id}`}>
                        Product Editions
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
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>
          <span className="flex items-center text-sm">
            Page {currentPage} of {totalPages}
          </span>
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
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
} 