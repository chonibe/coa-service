'use client';

import React from 'react';
import { Toaster } from '@/components/ui/toaster';

export default function VendorDashboardLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  return (
    <div className="min-h-screen">
      <main className="p-8">
        {children}
      </main>
      <Toaster />
    </div>
  );
} 