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
  sku: string | null;
  vendor_name: string | null;
  product_id: string;
  variant_id: string | null;
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

export default function OrderDetails({ order }: { order: Order }) {
  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-6">
        <Link href="/admin/orders">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Button>
        </Link>
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
                    <TableHead className="w-[40%]">Product</TableHead>
                    <TableHead className="w-[15%]">SKU</TableHead>
                    <TableHead className="w-[15%]">Vendor</TableHead>
                    <TableHead className="w-[10%] text-right">Quantity</TableHead>
                    <TableHead className="w-[10%] text-right">Price</TableHead>
                    <TableHead className="w-[10%] text-right">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {order.line_items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell className="text-muted-foreground">{item.sku || '-'}</TableCell>
                      <TableCell className="text-muted-foreground">{item.vendor_name || '-'}</TableCell>
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