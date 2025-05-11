"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { formatCurrency } from '@/lib/utils';

interface OrderLineItem {
  id: string;
  title: string;
  quantity: number;
  price: number;
  sku: string;
  vendor: string;
  product_id: string | null;
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
}

interface OrderDetailsProps {
  order: Order;
}

export default function OrderDetails({ order }: OrderDetailsProps) {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <Link href="/admin/orders">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">Order #{order.order_number}</h1>
        <div className="text-gray-500">
          Processed on {new Date(order.processed_at).toLocaleDateString()}
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
            <CardDescription>Customer and payment information</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-500 mb-2">Status</div>
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
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-2">Customer</div>
                <div className="font-medium">{order.customer_email}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-2">Total</div>
                <div className="text-xl font-semibold">
                  {formatCurrency(order.total_price, order.currency_code)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Line Items</CardTitle>
            <CardDescription>Products in this order</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Price</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.line_items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="font-medium">{item.title}</div>
                        {item.vendor && (
                          <div className="text-sm text-gray-500">{item.vendor}</div>
                        )}
                      </TableCell>
                      <TableCell>{item.sku}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.price, order.currency_code)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.price * item.quantity, order.currency_code)}
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