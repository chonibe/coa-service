'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import LogoutButton from '@/app/admin/logout-button';

const VENDOR_NAV_ITEMS = [
  { 
    href: '/vendor/dashboard/products', 
    label: 'Products',
    icon: '🎨'
  },
  { 
    href: '/vendor/dashboard/orders', 
    label: 'Orders',
    icon: '📦'
  },
  { 
    href: '/vendor/dashboard/content', 
    label: 'Content',
    icon: '📝'
  },
  { 
    href: '/vendor/dashboard/settings', 
    label: 'Settings',
    icon: '⚙️'
  }
];

export default function VendorDashboardLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      <nav className="w-64 bg-muted/50 p-4 border-r">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
        </div>
        
        <div className="space-y-2">
          {VENDOR_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                buttonVariants({ variant: pathname === item.href ? 'default' : 'ghost' }),
                'w-full justify-start',
                pathname === item.href && 'bg-primary text-primary-foreground hover:bg-primary/90'
              )}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>

        <div className="mt-auto pt-4 border-t">
          <LogoutButton />
        </div>
      </nav>
      
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
} 