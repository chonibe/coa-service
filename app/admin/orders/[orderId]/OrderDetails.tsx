"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, AlertCircle } from "lucide-react";
import { formatCurrency } from '@/lib/utils';
import { useState, useEffect } from 'react';
import DuplicateItemsBox from '../DuplicateItemsBox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from 'next/navigation';
import Image from "next/image"

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
  status: "active" | "inactive";
  image_url?: string;
  is_duplicate?: boolean;
  duplicate_of?: string[];
  edition_number?: number;
  edition_size?: number;
  edition_total?: number;
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
  const [lineItems, setLineItems] = useState<OrderLineItem[]>(() => {
    // Initialize with line items from Supabase (order.line_items)
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

  // Separate active and inactive items
  const activeItems = lineItems.filter(item => item.status === 'active');
  const inactiveItems = lineItems.filter(item => item.status === 'inactive');

  const handleNavigation = (orderId: string) => {
    router.push(`/admin/orders/${orderId}`);
  };

  const handleStatusChange = async (lineItemId: string, newStatus: "active" | "inactive") => {
    setUpdatingStatus(lineItemId);
    try {
      const res = await fetch(`/api/editions/update-status`, {
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

      // Update local state with the new status
      setLineItems(prevItems => 
        prevItems.map(item => 
          item.id === lineItemId 
            ? { ...item, status: newStatus }
            : item
        )
      );

      toast.success('Status updated successfully');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
      setError(err.message || 'Failed to update line item status');
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleDuplicateStatusChange = async (itemIds: string[], status: 'active' | 'inactive') => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/editions/update-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemIds,
          orderId: order.id,
          status
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update line item status');
      }

      // Update local state with the new status
      setLineItems(prevItems => 
        prevItems.map(item => 
          itemIds.includes(item.id)
            ? { ...item, status }
            : item
        )
      );

      toast.success('Status updated successfully');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to update line item status');
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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'inactive':
        return 'secondary';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="container max-w-7xl mx-auto py-4 sm:py-8 px-2 sm:px-6 lg:px-8">
      {/* Navigation and Actions */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
        <Link href="/admin/orders">
            <Button variant="ghost" className="gap-2 w-full sm:w-auto">
              <ArrowLeft className="h-4 w-4" />
            Back to Orders
          </Button>
        </Link>
          <Button onClick={handleRefresh} disabled={loading} variant="outline" className="w-full sm:w-auto">
            {loading ? 'Refreshing...' : 'Refresh from Shopify'}
          </Button>
          {error && <span className="text-red-500 text-sm">{error}</span>}
        </div>
        <div className="flex items-center justify-center gap-4 sm:gap-2 w-full sm:w-auto mt-2 sm:mt-0">
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigation.nextOrderId && handleNavigation(navigation.nextOrderId)}
            disabled={!navigation.nextOrderId}
            title="Previous Order (Higher Number)"
            className="flex-1 sm:flex-none h-12 w-full sm:w-12 relative"
          >
            <ChevronUp className="h-6 w-6" />
            <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground sm:hidden">
              Previous
            </span>
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigation.prevOrderId && handleNavigation(navigation.prevOrderId)}
            disabled={!navigation.prevOrderId}
            title="Next Order (Lower Number)"
            className="flex-1 sm:flex-none h-12 w-full sm:w-12 relative"
          >
            <ChevronDown className="h-6 w-6" />
            <span className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-muted-foreground sm:hidden">
              Next
            </span>
          </Button>
        </div>
      </div>

      {/* Order Header */}
      <Card className="mb-4 sm:mb-6">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div>
              <CardTitle className="text-xl sm:text-2xl">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Customer</h3>
              <p className="text-base break-all">{order.customer_email}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">Total</h3>
              <p className="text-xl sm:text-2xl font-bold">
                {formatCurrency(order.total_price, order.currency_code)}
              </p>
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
      <Card className="mb-4 sm:mb-6">
          <CardHeader>
          <CardTitle>Active Line Items</CardTitle>
          </CardHeader>
          <CardContent>
          {/* Desktop Table View */}
          <div className="hidden sm:block rounded-md border">
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      {item.image_url ? (
                        <div className="relative w-12 h-12">
                          <Image 
                            src={item.image_url} 
                            alt={item.title}
                            fill
                            className="object-cover rounded-md"
                          />
                        </div>
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
                            className="flex items-center gap-1 hover:text-primary transition-colors"
                          >
                            {item.title}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        ) : (
                          <span>{item.title}</span>
                        )}
                        {duplicateItems.has(item.id) && (
                          <div className="flex items-center gap-1">
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                            <span className="text-xs text-muted-foreground">
                              ({duplicateItems.get(item.id)?.length})
                            </span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.edition_number && item.edition_total ? (
                        <span className="font-medium">{item.edition_number}/{item.edition_total}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.sku || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.vendor_name || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {typeof item.quantity === 'number' ? item.quantity : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.price, order.currency_code)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {typeof item.price === 'number' && typeof item.quantity === 'number'
                        ? formatCurrency(item.price * item.quantity, order.currency_code)
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {typeof item.edition_total === 'number' ? item.edition_total : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="sm:hidden space-y-4">
            {activeItems.map((item) => (
              <div key={item.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex gap-3">
                  <div className="flex-shrink-0">
                    {item.image_url ? (
                      <div className="relative w-16 h-16">
                        <Image 
                          src={item.image_url} 
                          alt={item.title}
                          fill
                          className="object-cover rounded-md"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No image</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        {item.product_id ? (
                          <Link 
                            href={`/admin/product-editions/${item.product_id}`}
                            className="flex items-center gap-1 hover:text-primary transition-colors font-medium"
                          >
                            {item.title}
                            <ExternalLink className="h-3 w-3 flex-shrink-0" />
                          </Link>
                        ) : (
                          <span className="font-medium">{item.title}</span>
                        )}
                        {duplicateItems.has(item.id) && (
                          <div className="flex items-center gap-1 mt-1">
                            <AlertCircle className="h-4 w-4 text-yellow-500" />
                            <span className="text-xs text-muted-foreground">
                              ({duplicateItems.get(item.id)?.length} duplicate{item.duplicate_of?.length === 1 ? '' : 's'})
                            </span>
                          </div>
                        )}
                      </div>
                      {item.edition_number && (
                        <Badge variant="outline" className="flex-shrink-0">
                          #{item.edition_number}
                    </Badge>
                  )}
                    </div>
                    <div className="mt-2 text-sm text-muted-foreground">
                      <div>SKU: {item.sku || '-'}</div>
                      <div>Vendor: {item.vendor_name || '-'}</div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div>
                    <div className="text-muted-foreground">Quantity</div>
                    <div className="font-medium">{typeof item.quantity === 'number' ? item.quantity : '-'}</div>
              </div>
              <div>
                    <div className="text-muted-foreground">Price</div>
                    <div className="font-medium">{formatCurrency(item.price, order.currency_code)}</div>
              </div>
              <div>
                    <div className="text-muted-foreground">Total</div>
                    <div className="font-medium">{typeof item.price === 'number' && typeof item.quantity === 'number'
                      ? formatCurrency(item.price * item.quantity, order.currency_code)
                      : '-'}</div>
                  </div>
                </div>
                <div className="text-right font-medium">
                  {typeof item.edition_total === 'number' ? item.edition_total : '-'}
                </div>
              </div>
            ))}
            </div>
          </CardContent>
        </Card>

      {/* Inactive Items */}
      {inactiveItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Inactive Items</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Desktop Table View */}
            <div className="hidden sm:block rounded-md border">
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inactiveItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {item.image_url ? (
                          <div className="relative w-12 h-12">
                            <Image 
                              src={item.image_url} 
                              alt={item.title}
                              fill
                              className="object-cover rounded-md opacity-50"
                            />
                          </div>
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
                        {item.edition_number && item.edition_total ? (
                          <span className="font-medium line-through text-muted-foreground">{item.edition_number}/{item.edition_total}</span>
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
                        {typeof item.quantity === 'number' ? item.quantity : '-'}
                      </TableCell>
                      <TableCell className="text-right line-through text-muted-foreground">
                        {formatCurrency(item.price, order.currency_code)}
                      </TableCell>
                      <TableCell className="text-right font-medium line-through text-muted-foreground">
                        {typeof item.price === 'number' && typeof item.quantity === 'number'
                          ? formatCurrency(item.price * item.quantity, order.currency_code)
                          : '-'}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {typeof item.edition_total === 'number' ? item.edition_total : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="sm:hidden space-y-4">
              {inactiveItems.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 space-y-3 opacity-50">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      {item.image_url ? (
                        <div className="relative w-16 h-16">
                          <Image 
                            src={item.image_url} 
                            alt={item.title}
                            fill
                            className="object-cover rounded-md"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-md flex items-center justify-center">
                          <span className="text-gray-400 text-xs">No image</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          {item.product_id ? (
                            <Link 
                              href={`/admin/product-editions/${item.product_id}`}
                              className="flex items-center gap-1 hover:text-primary transition-colors font-medium line-through text-muted-foreground"
                            >
                              {item.title}
                              <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            </Link>
                          ) : (
                            <span className="font-medium line-through text-muted-foreground">{item.title}</span>
                          )}
                        </div>
                        {item.edition_number && (
                          <Badge variant="outline" className="flex-shrink-0">
                            #{item.edition_number}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        <div>SKU: {item.sku || '-'}</div>
                        <div>Vendor: {item.vendor_name || '-'}</div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">Quantity</div>
                      <div className="font-medium line-through text-muted-foreground">{typeof item.quantity === 'number' ? item.quantity : '-'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Price</div>
                      <div className="font-medium line-through text-muted-foreground">{formatCurrency(item.price, order.currency_code)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Total</div>
                      <div className="font-medium line-through text-muted-foreground">{typeof item.price === 'number' && typeof item.quantity === 'number'
                        ? formatCurrency(item.price * item.quantity, order.currency_code)
                        : '-'}</div>
                    </div>
                  </div>
                  <div className="text-right font-medium">
                    {typeof item.edition_total === 'number' ? item.edition_total : '-'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Order Summary */}
      <Card className="mt-4 sm:mt-6">
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
  );
} 