"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from '@/lib/utils';

interface LineItem {
  id: string;
  title: string;
  quantity: number;
  price: number;
  sku: string | null;
  vendor_name: string | null;
  product_id: string;
  variant_id: string | null;
  fulfillment_status: string;
}

interface DuplicateGroup {
  items: LineItem[];
  reasons: Array<{
    type: 'same_sku' | 'same_title';
    value: string;
  }>;
}

interface DuplicateItemsBoxProps {
  lineItems: LineItem[];
  onStatusChange: (itemIds: string[], status: 'approved' | 'declined') => void;
}

export default function DuplicateItemsBox({ lineItems, onStatusChange }: DuplicateItemsBoxProps) {
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>(() => {
    // Find duplicates based on SKU (case-insensitive) or title
    const skuMap = new Map<string, LineItem[]>();
    const titleMap = new Map<string, LineItem[]>();

    lineItems.forEach(item => {
      if (item.sku) {
        const normalizedSku = item.sku.toLowerCase();
        const existing = skuMap.get(normalizedSku) || [];
        skuMap.set(normalizedSku, [...existing, item]);
      }
      
      const normalizedTitle = item.title.toLowerCase();
      const existing = titleMap.get(normalizedTitle) || [];
      titleMap.set(normalizedTitle, [...existing, item]);
    });

    // Create a map to store unique groups by item IDs
    const uniqueGroups = new Map<string, DuplicateGroup>();

    // Process SKU duplicates
    skuMap.forEach((items, sku) => {
      if (items.length > 1) {
        const itemIds = items.map(item => item.id).sort().join(',');
        if (!uniqueGroups.has(itemIds)) {
          uniqueGroups.set(itemIds, {
            items,
            reasons: [{ type: 'same_sku', value: sku }]
          });
        } else {
          const group = uniqueGroups.get(itemIds)!;
          group.reasons.push({ type: 'same_sku', value: sku });
        }
      }
    });

    // Process title duplicates
    titleMap.forEach((items, title) => {
      if (items.length > 1) {
        const itemIds = items.map(item => item.id).sort().join(',');
        if (!uniqueGroups.has(itemIds)) {
          uniqueGroups.set(itemIds, {
            items,
            reasons: [{ type: 'same_title', value: title }]
          });
        } else {
          const group = uniqueGroups.get(itemIds)!;
          group.reasons.push({ type: 'same_title', value: title });
        }
      }
    });

    return Array.from(uniqueGroups.values());
  });

  const handleStatusChange = (itemId: string, status: 'approved' | 'declined') => {
    onStatusChange([itemId], status);
  };

  if (duplicateGroups.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Duplicate Items
          <Badge variant="secondary">{duplicateGroups.length} groups</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {duplicateGroups.map((group) => (
            <div key={group.items.map(item => item.id).join('-')} className="border rounded-lg p-4">
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {group.reasons.map((reason, index) => (
                  <Badge key={`${reason.type}-${reason.value}`} variant="outline">
                    {reason.type === 'same_sku' ? 'Same SKU' : 'Same Title'}: {reason.value}
                  </Badge>
                ))}
              </div>
              <div className="space-y-4">
                {group.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{item.title}</div>
                      {item.sku && (
                        <div className="text-sm text-muted-foreground">SKU: {item.sku}</div>
                      )}
                      <div className="flex items-center gap-4 mt-1 text-sm">
                        <span>Qty: {item.quantity}</span>
                        <span>{formatCurrency(item.price, 'USD')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.fulfillment_status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(item.id, 'approved')}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleStatusChange(item.id, 'declined')}
                          >
                            Decline
                          </Button>
                        </>
                      )}
                      {item.fulfillment_status !== 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStatusChange(item.id, 'approved')}
                        >
                          Reset
                        </Button>
                      )}
                      <Badge 
                        variant={
                          item.fulfillment_status === 'approved' 
                            ? 'default' 
                            : item.fulfillment_status === 'declined' 
                            ? 'destructive' 
                            : 'secondary'
                        }
                      >
                        {item.fulfillment_status || 'pending'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 