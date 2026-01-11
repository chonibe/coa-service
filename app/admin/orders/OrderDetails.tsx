"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, AlertCircle, Award, User } from "lucide-react";
import { formatCurrency } from '@/lib/utils';
import { useState, useEffect } from 'react';
import DuplicateItemsBox from './DuplicateItemsBox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from 'next/navigation';

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
  image_url?: string;
  is_duplicate?: boolean;
  duplicate_of?: string[];
  edition_number?: number;
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
  customer_profile?: any;
  line_items: OrderLineItem[];
  total_discounts: number;
  subtotal_price: number;
  total_tax: number;
  kickstarter_backing_amount_gbp?: number | null;
  kickstarter_backing_amount_usd?: number | null;
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
  const [lineItems, setLineItems] = useState<OrderLineItem[]>(() => {
    // Initialize with default status if not present
    return order.line_items.map(item => ({
      ...item,
      status: item.status || 'active'
    }));
  });
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [navigation, setNavigation] = useState<{ prevOrderId: string | null; nextOrderId: string | null }>({
    prevOrderId: null,
    nextOrderId: null
  });
  const [duplicateItems, setDuplicateItems] = useState<Map<string, string[]>>(new Map());
  const router = useRouter();

  useEffect(() => {
    const fetchNavigation = async () => {
      try {
        const res = await fetch(`/api/orders/navigation?orderId=${order.id}`);
        if (!res.ok) throw new Error('Failed to fetch navigation');
        const data = await res.json();
        setNavigation(data);
      } catch (err) {
        console.error('Error fetching navigation:', err);
      }
    };

    fetchNavigation();
  }, [order.id]);

  useEffect(() => {
    // Find duplicate items (only among active items)
    const duplicates = new Map<string, string[]>();
    const seen = new Map<string, string[]>();

    lineItems
      .filter(item => item.status === 'active') // Only consider active items for duplicates
      .forEach(item => {
        if (item.product_id) {
          if (seen.has(item.product_id)) {
            const existing = seen.get(item.product_id) || [];
            existing.push(item.id);
            seen.set(item.product_id, existing);
            // Add all items with this product_id to duplicates
            existing.forEach(id => {
              const current = duplicates.get(id) || [];
              duplicates.set(id, [...current, ...existing.filter(i => i !== id)]);
            });
          } else {
            seen.set(item.product_id, [item.id]);
          }
        }
      });

    setDuplicateItems(duplicates);
  }, [lineItems]);

  // Separate active and inactive/removed items
  const activeItems = lineItems.filter(item => item.status === 'active');
  const inactiveItems = lineItems.filter(item => item.status === 'inactive' || item.status === 'removed');

  const handleNavigation = (orderId: string) => {
    router.push(`/admin/orders/${orderId}`);
  };

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
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update line item status');
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
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
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
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigation.nextOrderId && handleNavigation(navigation.nextOrderId)}
            disabled={!navigation.nextOrderId}
            title="Previous Order (Higher Number)"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigation.prevOrderId && handleNavigation(navigation.prevOrderId)}
            disabled={!navigation.prevOrderId}
            title="Next Order (Lower Number)"
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Order Header */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
              <div>
                <CardTitle className="text-2xl">
                  <a 
                    href={`https://admin.shopify.com/store/thestreetlamp-9103/orders/${order.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    Order #{order.order_number}
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </CardTitle>
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
                <div className="flex flex-col gap-1">
                  {order.customer_profile ? (
                    <Link 
                      href={`/admin/collectors/${order.customer_email}`}
                      className="group inline-flex items-center gap-2"
                    >
                      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 group-hover:bg-slate-200 transition-colors">
                        <User className="h-5 w-5 text-slate-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-base font-bold text-slate-900 group-hover:text-primary transition-colors">
                          {order.customer_profile.display_name || 'Guest Collector'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {order.customer_email}
                        </span>
                      </div>
                    </Link>
                  ) : (
                    <div className="flex flex-col">
                      <p className="text-base font-medium">{order.customer_email}</p>
                      <span className="text-xs text-muted-foreground italic">No CRM profile found</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">Total</h3>
                <div className="flex flex-col">
                  <p className="text-2xl font-bold">
                    {formatCurrency(order.total_price, order.currency_code)}
                  </p>
                  {order.kickstarter_backing_amount_gbp && (
                    <div className="mt-2 p-2 bg-amber-50 border border-amber-100 rounded-lg">
                      <div className="flex items-center gap-1.5 text-xs font-black text-amber-700 uppercase tracking-tight mb-1">
                        <Award className="h-3 w-3" /> Kickstarter Backer
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-bold text-slate-900">
                          {formatCurrency(order.kickstarter_backing_amount_gbp, 'GBP')}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          ({formatCurrency(order.kickstarter_backing_amount_usd || 0, 'USD')})
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Duplicate Items Box */}
        <DuplicateItemsBox 
          lineItems={lineItems}
          onStatusChange={handleDuplicateStatusChange}
        />

        {/* Active Line Items */}
        <Card>
          <CardHeader>
            <CardTitle>Active Line Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[5%]">Image</TableHead>
                    <TableHead className="w-[25%]">Product</TableHead>
                    <TableHead className="w-[10%]">Edition</TableHead>
                    <TableHead className="w-[15%]">SKU</TableHead>
                    <TableHead className="w-[15%]">Vendor</TableHead>
                    <TableHead className="w-[10%] text-right">Quantity</TableHead>
                    <TableHead className="w-[10%] text-right">Price</TableHead>
                    <TableHead className="w-[10%] text-right">Total</TableHead>
                    <TableHead className="w-[5%] text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {(item.image_url || item.img_url) ? (
                          <img 
                            src={item.image_url || item.img_url} 
                            alt={item.title}
                            className="w-12 h-12 object-cover rounded-md"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                            <span className="text-gray-400 text-xs">No image</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {item.product_id ? (
                            <Link 
                              href={`/admin/product-editions/${item.product_id}`}
                              className={`flex items-center gap-1 hover:text-primary transition-colors ${
                                item.status === 'removed' || item.status === 'inactive' ? 'line-through text-muted-foreground' : ''
                              }`}
                            >
                              {item.title}
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          ) : (
                            <span className={item.status === 'removed' || item.status === 'inactive' ? 'line-through text-muted-foreground' : ''}>
                              {item.title}
                            </span>
                          )}
                          {duplicateItems.has(item.id) && (
                            <div className="flex items-center gap-1">
                              <AlertCircle className="h-4 w-4 text-yellow-500" title={`This item has ${duplicateItems.get(item.id)?.length} duplicate(s)`} />
                              <span className="text-xs text-muted-foreground">
                                ({duplicateItems.get(item.id)?.length})
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.edition_number ? (
                          <span className="font-medium">#{item.edition_number}</span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className={`text-muted-foreground ${item.status === 'removed' || item.status === 'inactive' ? 'line-through' : ''}`}>
                        {item.sku || '-'}
                      </TableCell>
                      <TableCell className={`text-muted-foreground ${item.status === 'removed' || item.status === 'inactive' ? 'line-through' : ''}`}>
                        {item.vendor_name || '-'}
                      </TableCell>
                      <TableCell className={`text-right ${item.status === 'removed' || item.status === 'inactive' ? 'line-through text-muted-foreground' : ''}`}>
                        {item.quantity}
                      </TableCell>
                      <TableCell className={`text-right ${item.status === 'removed' || item.status === 'inactive' ? 'line-through text-muted-foreground' : ''}`}>
                        {formatCurrency(item.price, order.currency_code)}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${item.status === 'removed' || item.status === 'inactive' ? 'line-through text-muted-foreground' : ''}`}>
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

        {/* Inactive/Removed Line Items */}
        {inactiveItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Inactive/Removed Items</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[5%]">Image</TableHead>
                      <TableHead className="w-[25%]">Product</TableHead>
                      <TableHead className="w-[10%]">Edition</TableHead>
                      <TableHead className="w-[15%]">SKU</TableHead>
                      <TableHead className="w-[15%]">Vendor</TableHead>
                      <TableHead className="w-[10%] text-right">Quantity</TableHead>
                      <TableHead className="w-[10%] text-right">Price</TableHead>
                      <TableHead className="w-[10%] text-right">Total</TableHead>
                      <TableHead className="w-[5%] text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inactiveItems.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {(item.image_url || item.img_url) ? (
                            <img 
                              src={item.image_url || item.img_url} 
                              alt={item.title}
                              className="w-12 h-12 object-cover rounded-md opacity-50"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center opacity-50">
                              <span className="text-gray-400 text-xs">No image</span>
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {item.product_id ? (
                              <Link 
                                href={`/admin/product-editions/${item.product_id}`}
                                className="flex items-center gap-1 hover:text-primary transition-colors line-through text-muted-foreground"
                              >
                                {item.title}
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            ) : (
                              <span className="line-through text-muted-foreground">
                                {item.title}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {item.edition_number ? (
                            <span className="font-medium line-through text-muted-foreground">#{item.edition_number}</span>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground line-through">
                          {item.sku || '-'}
                        </TableCell>
                        <TableCell className="text-muted-foreground line-through">
                          {item.vendor_name || '-'}
                        </TableCell>
                        <TableCell className="text-right line-through text-muted-foreground">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right line-through text-muted-foreground">
                          {formatCurrency(item.price, order.currency_code)}
                        </TableCell>
                        <TableCell className="text-right font-medium line-through text-muted-foreground">
                          {formatCurrency(item.price * item.quantity, order.currency_code)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Select
                            value={item.status}
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
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

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
      </div>
    </div>
  );
} 