"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { formatCurrency } from '@/lib/utils';
import { useState } from 'react';
import DuplicateItemsBox from './DuplicateItemsBox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface OrderLineItem {
  id: string;
  title: string;
  quantity: number;
  price: number;
  sku: string | null;
  vendor_name: string | null;
  product_id: string;
  variant_id: string | null;
  fulfillment_status: string;
  status: "active" | "inactive" | "removed";
}

interface Order {
  id: string;
  order_number: string;
  processed_at: string;
  financial_status: string;
  fulfillment_status: string;
  total_price: number;
  currency_code: string;
  customer_email: string;
  line_items: OrderLineItem[];
  total_discounts: number;
  subtotal_price: number;
  total_tax: number;
  discount_codes: Array<{
    code: string;
    amount: number;
    type: string;
  }>;
}

interface OrderDetailsProps {
  order: Order;
}

export default function OrderDetails({ order }: OrderDetailsProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lineItems, setLineItems] = useState(order.line_items);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const handleStatusChange = async (lineItemId: string, newStatus: "active" | "inactive" | "removed") => {
    setUpdatingStatus(lineItemId);
    try {
      const res = await fetch(`/api/update-line-item-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lineItemId,
          orderId: order.id,
          status: newStatus,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update line item status');
      }

      // Update local state
      setLineItems(prev => prev.map(item => 
        item.id === lineItemId 
          ? { ...item, status: newStatus }
          : item
      ));

      toast.success('Status updated successfully');
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
      setError(err.message || 'Failed to update line item status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDuplicateStatusChange = async (itemIds: string[], status: 'approved' | 'declined') => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/line-items/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemIds,
          status: status === 'approved' ? 'active' : 'cancelled'
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update line item status');
      }

      // Update local state
      setLineItems(prev => prev.map(item => 
        itemIds.includes(item.id) 
          ? { ...item, fulfillment_status: status === 'approved' ? 'active' : 'cancelled' }
          : item
      ));
    } catch (err: any) {
      setError(err.message || 'Failed to update line item status');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}/refresh`, { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to refresh order');
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      setError(err.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/orders">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Button>
        </Link>
        <Button onClick={handleRefresh} disabled={loading} variant="outline">
          {loading ? 'Refreshing...' : 'Refresh from Shopify'}
        </Button>
        {error && <span className="text-red-500 ml-4">{error}</span>}
      </div>

      <div className="grid gap-6">
        {/* Order Header */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div>
                <CardTitle className="text-2xl">Order #{order.order_number}</CardTitle>
                <CardDescription className="mt-1">
                  Processed on {new Date(order.processed_at).toLocaleDateString()}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge 
                  variant={order.financial_status === 'paid' ? 'default' : 'secondary'}
                  className="text-sm px-3 py-1"
                >
                  {order.financial_status}
                </Badge>
                <Badge 
                  variant={order.fulfillment_status === 'fulfilled' ? 'default' : 'secondary'}
                  className="text-sm px-3 py-1"
                >
                  {order.fulfillment_status || 'pending'}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Customer</h3>
                <p className="text-base">{order.customer_email}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Total</h3>
                <p className="text-2xl font-bold">
                  {formatCurrency(order.total_price, order.currency_code)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(order.subtotal_price, order.currency_code)}</span>
              </div>
              {order.discount_codes.length > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discounts</span>
                  <div className="text-right">
                    {order.discount_codes.map((discount, index) => (
                      <div key={index} className="text-sm">
                        {discount.code} ({discount.type === 'percentage' ? `${discount.amount}%` : formatCurrency(discount.amount, order.currency_code)})
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(order.total_tax, order.currency_code)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t">
                <span>Total</span>
                <span>{formatCurrency(order.total_price, order.currency_code)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Duplicate Items Box */}
        <DuplicateItemsBox 
          lineItems={lineItems}
          onStatusChange={handleDuplicateStatusChange}
        />

        {/* Line Items */}
        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[35%]">Product</TableHead>
                    <TableHead className="w-[15%]">SKU</TableHead>
                    <TableHead className="w-[15%]">Vendor</TableHead>
                    <TableHead className="w-[10%] text-right">Quantity</TableHead>
                    <TableHead className="w-[10%] text-right">Price</TableHead>
                    <TableHead className="w-[10%] text-right">Total</TableHead>
                    <TableHead className="w-[5%] text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.product_id ? (
                          <Link 
                            href={`/admin/product-editions/${item.product_id}`}
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                          >
                            {item.title}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        ) : (
                          item.title
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.sku || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{item.vendor_name || '-'}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.price, order.currency_code)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.price * item.quantity, order.currency_code)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.product_id ? (
                          <Select
                            value={item.status || 'active'}
                            onValueChange={(value: "active" | "inactive" | "removed") => handleStatusChange(item.id, value)}
                            disabled={updatingStatus === item.id}
                          >
                            <SelectTrigger className="w-[100px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                              <SelectItem value="removed">Removed</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            item.fulfillment_status === 'fulfilled' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {item.fulfillment_status || 'pending'}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 