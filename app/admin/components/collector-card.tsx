"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Phone, ShoppingBag, Award, Clock, MapPin, ExternalLink } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface CollectorCardProps {
  profile: any;
  className?: string;
}

export function CollectorCard({ profile, className }: CollectorCardProps) {
  if (!profile) return null;

  const initials = profile.display_name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase() || "?";

  const pii = profile.pii_sources || {};
  const warehouseAddr = pii.warehouse?.address;
  const shopifyAddr = pii.shopify?.address;
  const address = warehouseAddr || shopifyAddr;

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border">
              <AvatarImage src={profile.avatar_url} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-lg">
                <Link 
                  href={`/admin/collectors/${profile.user_id || profile.user_email}`}
                  className="hover:underline flex items-center gap-1"
                >
                  {profile.display_name}
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </Link>
              </CardTitle>
              <CardDescription className="flex items-center gap-1">
                {profile.user_id ? (
                  <Badge variant="default" className="text-[10px] h-4">Registered</Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] h-4">Guest</Badge>
                )}
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="truncate">{profile.user_email}</span>
          </div>
          {profile.display_phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{profile.display_phone}</span>
            </div>
          )}
          {address && (
            <div className="flex items-start gap-2 text-muted-foreground">
              <MapPin className="h-4 w-4 mt-0.5" />
              <div className="text-xs">
                <p>{address.address1}</p>
                <p>{address.city}, {address.state || address.province_code} {address.zip}</p>
                <p>{address.country || address.country_code}</p>
                {pii.warehouse && <Badge variant="outline" className="mt-1 text-[9px] h-3">Source: Warehouse</Badge>}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 border-t pt-3">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-muted-foreground font-medium">Orders</span>
            <div className="flex items-center gap-1 font-semibold">
              <ShoppingBag className="h-3 w-3" />
              {profile.total_orders || 0}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-muted-foreground font-medium">Spent</span>
            <div className="font-semibold">
              {formatCurrency(profile.total_spent || 0, 'USD')}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-muted-foreground font-medium">Editions</span>
            <div className="flex items-center gap-1 font-semibold">
              <Award className="h-3 w-3" />
              {profile.total_editions || 0}
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase text-muted-foreground font-medium">Last Activity</span>
            <div className="flex items-center gap-1 text-[11px] font-medium">
              <Clock className="h-3 w-3" />
              {profile.last_purchase_date ? new Date(profile.last_purchase_date).toLocaleDateString() : 'Never'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

