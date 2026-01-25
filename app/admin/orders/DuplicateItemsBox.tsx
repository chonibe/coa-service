"use client";

import { useState } from 'react';
;
;
;
import { formatCurrency } from '@/lib/utils';
import { AlertCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from "@/components/ui"
interface OrderLineItem {
  id: string;
  title: string;
  product_id: string;
  status: 'active' | 'inactive';
}

interface DuplicateItemsBoxProps {
  lineItems: OrderLineItem[];
  onStatusChange: (itemIds: string[], status: 'active' | 'inactive') => void;
}

export default function DuplicateItemsBox({ lineItems, onStatusChange }: DuplicateItemsBoxProps) {
  // Find duplicate items (same product_id) that are active
  const activeItems = lineItems.filter(item => item.status === 'active');
  const seen = new Map<string, string[]>();
  
  activeItems.forEach(item => {
    if (!seen.has(item.product_id)) {
      seen.set(item.product_id, [item.id]);
    } else {
      seen.get(item.product_id)?.push(item.id);
    }
  });

  const duplicates = Array.from(seen.entries())
    .filter(([_, ids]) => ids.length > 1)
    .map(([productId, ids]) => ({
      productId,
      itemIds: ids
    }));

  if (duplicates.length === 0) return null;

  return (
    <Card className="border-yellow-200 bg-yellow-50 mb-4 sm:mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2 text-yellow-800">
          <AlertCircle className="h-5 w-5" />
          Duplicate Items Detected
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {duplicates.map(({ productId, itemIds }) => {
            const item = lineItems.find(i => i.product_id === productId);
            if (!item) return null;

            return (
              <div key={productId} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-yellow-700">
                    {itemIds.length} duplicate{itemIds.length > 1 ? 's' : ''} found
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onStatusChange(itemIds.slice(1), 'inactive')}
                    className="w-full sm:w-auto"
                  >
                    Mark All But First as Inactive
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
} 