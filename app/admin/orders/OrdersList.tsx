"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Table, TableHeader, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';
import { AlertCircle } from "lucide-react";

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
  has_duplicates?: boolean;
  raw_shopify_order_data?: any;
  cancelled_at?: string | null;
  archived?: boolean;
  shopify_order_status?: string | null;
}

interface OrdersListProps {
  orders: Order[];
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
}

export default function OrdersList({ 
  orders, 
  currentPage, 
  totalPages, 
  onPageChange 
}: OrdersListProps) {
  const processOrderDuplicates = (orders: Order[]) => {
    return orders.map((order) => {
      const seen = new Set<string>();
      const hasDuplicates = order.line_items?.some(item => {
        if (item.product_id) {
          if (seen.has(item.product_id)) return true;
          seen.add(item.product_id);
        }
        return false;
      }) || false;
      return { ...order, has_duplicates: hasDuplicates };
    });
  };

  const processedOrders = processOrderDuplicates(orders);

  if (!orders || orders.length === 0) {
    return (
      <Card className="p-6 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
        <div className="text-center text-muted-foreground">
          No orders found. Try syncing orders from Shopify.
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
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
              {processedOrders.map((order) => (
                <TableRow 
                  key={order.id}
                  className="cursor-pointer hover:bg-white/50 dark:hover:bg-slate-900/50 backdrop-blur-sm transition-colors"
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
                    <div className="flex flex-wrap gap-2">
                      {/* Financial Status */}
                      <Badge 
                        variant={
                          order.financial_status === 'paid' ? 'default' : 
                          order.financial_status === 'voided' || order.financial_status === 'refunded' ? 'destructive' : 
                          'secondary'
                        }
                        className="text-xs"
                      >
                        {order.financial_status || 'unknown'}
                      </Badge>
                      
                      {/* Fulfillment Status */}
                      <Badge 
                        variant={
                          order.fulfillment_status === 'fulfilled' ? 'default' : 
                          order.fulfillment_status === 'partial' ? 'secondary' : 
                          'outline'
                        }
                        className="text-xs"
                      >
                        {order.fulfillment_status || 'unfulfilled'}
                      </Badge>
                      
                      {/* Cancelled Status */}
                      {order.cancelled_at && (
                        <Badge 
                          variant="destructive"
                          className="text-xs"
                        >
                          Cancelled
                        </Badge>
                      )}
                      
                      {/* Archived Status */}
                      {order.archived && (
                        <Badge 
                          variant="outline"
                          className="text-xs"
                        >
                          Archived
                        </Badge>
                      )}
                      
                      {/* Shopify Order Status */}
                      {order.shopify_order_status && 
                       order.shopify_order_status !== 'open' && (
                        <Badge 
                          variant="outline"
                          className="text-xs"
                        >
                          {order.shopify_order_status}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {totalPages > 1 && onPageChange && (
        <div className="flex justify-center gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
          >
            Previous
          </Button>
          <div className="flex items-center gap-2">
            <span>Page</span>
            <span className="font-bold">{currentPage}</span>
            <span>of</span>
            <span className="font-bold">{totalPages}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
} 