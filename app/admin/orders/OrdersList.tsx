"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { formatCurrency } from '@/lib/utils';
import { Table, TableHeader, TableBody, TableCell, TableHead, TableRow } from '@/components/ui/table';
import { AlertCircle, MoreVertical, X, CheckCircle2, Archive, ArchiveRestore, RefreshCw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

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
  customer_name?: string | null;
  customer_phone?: string | null;
  shipping_address?: any | null;
  customer_profile?: any;
  line_items?: any[];
  has_duplicates?: boolean;
  raw_shopify_order_data?: any;
  cancelled_at?: string | null;
  archived?: boolean;
  shopify_order_status?: string | null;
  source?: 'shopify' | 'warehouse' | 'warehouse_made';
  kickstarter_backing_amount_gbp?: number | null;
  kickstarter_backing_amount_usd?: number | null;
  is_gift?: boolean;
}

interface OrdersListProps {
  orders: Order[];
  currentPage: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
  onRefresh?: () => void;
  onSelectedOrdersChange?: (selectedIds: string[]) => void;
}

export default function OrdersList({ 
  orders, 
  currentPage, 
  totalPages, 
  onPageChange,
  onRefresh,
  onSelectedOrdersChange
}: OrdersListProps) {
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  // Notify parent of selection changes
  const updateSelection = (newSelection: Set<string>) => {
    setSelectedOrders(newSelection);
    if (onSelectedOrdersChange) {
      onSelectedOrdersChange(Array.from(newSelection));
    }
  };

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

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSelection = new Set(processedOrders.map(o => o.id));
      updateSelection(newSelection);
    } else {
      updateSelection(new Set());
    }
  };

  const handleSelectOrder = (orderId: string, checked: boolean) => {
    const newSelected = new Set(selectedOrders);
    if (checked) {
      newSelected.add(orderId);
    } else {
      newSelected.delete(orderId);
    }
    updateSelection(newSelected);
  };

  const handleBulkAction = async (action: 'cancel' | 'uncancel' | 'archive' | 'unarchive' | 'sync') => {
    if (selectedOrders.size === 0) {
      toast({
        title: "No orders selected",
        description: "Please select at least one order to perform this action.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdating(true);
    try {
      const orderIds = Array.from(selectedOrders);
      
      if (action === 'sync') {
        // Sync selected orders with Shopify
        const response = await fetch("/api/admin/orders/sync-shopify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderIds,
            limit: orderIds.length,
            dryRun: false,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to sync orders");
        }

        toast({
          title: "Orders synced",
          description: `Successfully synced ${data.summary?.updated || 0} order(s) with Shopify.`,
        });
      } else {
        // Update order status
        const updates: any = {};
        if (action === 'cancel') {
          updates.cancelled = true;
        } else if (action === 'uncancel') {
          updates.cancelled = false;
        } else if (action === 'archive') {
          updates.archived = true;
        } else if (action === 'unarchive') {
          updates.archived = false;
        }

        const response = await fetch("/api/admin/orders/update-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderIds,
            ...updates,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to update orders");
        }

        toast({
          title: "Orders updated",
          description: `Successfully updated ${data.updated || 0} order(s).`,
        });
      }

      // Clear selection and refresh
      updateSelection(new Set());
      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSingleAction = async (orderId: string, action: 'cancel' | 'uncancel' | 'archive' | 'unarchive' | 'sync', e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click
    
    setIsUpdating(true);
    try {
      if (action === 'sync') {
        const response = await fetch("/api/admin/orders/sync-shopify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId,
            limit: 1,
            dryRun: false,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to sync order");
        }

        toast({
          title: "Order synced",
          description: "Successfully synced order with Shopify.",
        });
      } else {
        const updates: any = {};
        if (action === 'cancel') {
          updates.cancelled = true;
        } else if (action === 'uncancel') {
          updates.cancelled = false;
        } else if (action === 'archive') {
          updates.archived = true;
        } else if (action === 'unarchive') {
          updates.archived = false;
        }

        const response = await fetch("/api/admin/orders/update-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderIds: [orderId],
            ...updates,
          }),
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.message || "Failed to update order");
        }

        toast({
          title: "Order updated",
          description: "Successfully updated order.",
        });
      }

      if (onRefresh) {
        onRefresh();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "An error occurred",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const allSelected = processedOrders.length > 0 && selectedOrders.size === processedOrders.length;
  const someSelected = selectedOrders.size > 0 && selectedOrders.size < processedOrders.length;

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
      {/* Bulk Actions Toolbar */}
      {selectedOrders.size > 0 && (
        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">
                {selectedOrders.size} order{selectedOrders.size !== 1 ? 's' : ''} selected
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('sync')}
                  disabled={isUpdating}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync with Shopify
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('cancel')}
                  disabled={isUpdating}
                >
                  <X className="h-4 w-4 mr-2" />
                  Mark Cancelled
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('uncancel')}
                  disabled={isUpdating}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Mark Not Cancelled
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('archive')}
                  disabled={isUpdating}
                >
                  <Archive className="h-4 w-4 mr-2" />
                  Archive
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('unarchive')}
                  disabled={isUpdating}
                >
                  <ArchiveRestore className="h-4 w-4 mr-2" />
                  Unarchive
                </Button>
              </div>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => updateSelection(new Set())}
            >
              Clear Selection
            </Button>
          </div>
        </Card>
      )}

      <Card className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-0 shadow-xl">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all orders"
                  />
                </TableHead>
                <TableHead>Order</TableHead>
                <TableHead>Source</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedOrders.map((order) => (
                <TableRow 
                  key={order.id}
                  className={`hover:bg-white/50 dark:hover:bg-slate-900/50 backdrop-blur-sm transition-colors ${
                    selectedOrders.has(order.id) ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                  }`}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedOrders.has(order.id)}
                      onCheckedChange={(checked) => handleSelectOrder(order.id, checked as boolean)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select order ${order.order_number}`}
                    />
                  </TableCell>
                  <TableCell 
                    className="font-medium cursor-pointer"
                    onClick={() => window.location.href = `/admin/orders/${order.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="hover:text-primary transition-colors">
                        {order.order_name || (String(order.order_number).startsWith('#') ? order.order_number : `#${order.order_number}`)}
                      </span>
                      {(order.kickstarter_backing_amount_gbp || order.customer_profile?.is_kickstarter_backer) && (
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] h-5 px-1.5 font-black uppercase tracking-tight">
                          Kickstarter
                        </Badge>
                      )}
                      {order.is_gift && (
                        <Badge variant="outline" className="bg-pink-50 text-pink-700 border-pink-200 text-[10px] h-5 px-1.5 font-black uppercase tracking-tight">
                          Simply Gift
                        </Badge>
                      )}
                      {order.has_duplicates && (
                        <AlertCircle className="h-4 w-4 text-yellow-500" title="This order has duplicate items" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell
                    className="cursor-pointer"
                    onClick={() => window.location.href = `/admin/orders/${order.id}`}
                  >
                    <Badge 
                      variant={order.source === 'shopify' ? 'outline' : 'secondary'}
                      className={
                        order.source === 'shopify' ? 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100' :
                        order.source === 'warehouse' ? 'bg-orange-100 text-orange-800 border-orange-200 hover:bg-orange-100' :
                        'bg-purple-100 text-purple-800 border-purple-200 hover:bg-purple-100'
                      }
                    >
                      {order.source === 'shopify' ? 'Shopify' : 
                       order.source === 'warehouse' ? 'Warehouse' : 'Warehouse Made'}
                    </Badge>
                  </TableCell>
                  <TableCell 
                    onClick={() => window.location.href = `/admin/orders/${order.id}`}
                    className="cursor-pointer"
                  >
                    {new Date(order.processed_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell 
                    onClick={() => window.location.href = `/admin/orders/${order.id}`}
                    className="cursor-pointer"
                  >
                    <div className="flex flex-col">
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {order.customer_profile?.display_name || order.customer_name || 'Guest Customer'}
                      </span>
                      <span className="text-xs text-muted-foreground">{order.customer_email}</span>
                      {order.customer_phone && (
                        <span className="text-[10px] text-muted-foreground">{order.customer_phone}</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell 
                    className="text-right cursor-pointer"
                    onClick={() => window.location.href = `/admin/orders/${order.id}`}
                  >
                    {formatCurrency(order.total_price, order.currency_code)}
                  </TableCell>
                  <TableCell
                    onClick={() => window.location.href = `/admin/orders/${order.id}`}
                    className="cursor-pointer"
                  >
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
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => handleSingleAction(order.id, 'sync', e)}
                          disabled={isUpdating}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Sync with Shopify
                        </DropdownMenuItem>
                        {order.cancelled_at ? (
                          <DropdownMenuItem
                            onClick={(e) => handleSingleAction(order.id, 'uncancel', e)}
                            disabled={isUpdating}
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Mark Not Cancelled
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={(e) => handleSingleAction(order.id, 'cancel', e)}
                            disabled={isUpdating}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Mark Cancelled
                          </DropdownMenuItem>
                        )}
                        {order.archived ? (
                          <DropdownMenuItem
                            onClick={(e) => handleSingleAction(order.id, 'unarchive', e)}
                            disabled={isUpdating}
                          >
                            <ArchiveRestore className="h-4 w-4 mr-2" />
                            Unarchive
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={(e) => handleSingleAction(order.id, 'archive', e)}
                            disabled={isUpdating}
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
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