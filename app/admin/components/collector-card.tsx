"use client";

;
;
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Mail, Phone, ShoppingBag, Award, Clock, MapPin, ChevronRight, ShieldCheck, User } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui";

import { Card, CardContent, Badge } from "@/components/ui"
interface CollectorCardProps {
  profile: any;
  className?: string;
  showLink?: boolean;
}

const CardWrapper = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <Card className={`overflow-hidden border-slate-200/60 shadow-sm hover:shadow-md transition-all duration-200 ${className}`}>
    {children}
  </Card>
);

const ProfileContent = ({ profile, initials, address, pii, showLink }: any) => (
  <div className="flex flex-col gap-4">
    <div className="flex items-center gap-4">
      <Avatar className="h-16 w-16 border-2 border-background shadow-sm">
        <AvatarImage src={profile.avatar_url} />
        <AvatarFallback className="bg-primary/5 text-primary text-xl font-bold">
          {initials}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <h3 className="text-xl font-bold truncate">{profile.display_name}</h3>
        <div className="flex items-center gap-2 mt-1">
          {profile.user_id ? (
            <Badge variant="default" className="text-[10px] h-5 bg-blue-600 hover:bg-blue-600">
              <ShieldCheck className="h-3 w-3 mr-1" /> Registered
            </Badge>
          ) : (
            <Badge variant="secondary" className="text-[10px] h-5">Guest Customer</Badge>
          )}
        </div>
      </div>
    </div>

    <Separator />

    <div className="grid gap-3 text-sm">
      <div className="flex items-center gap-3 text-muted-foreground bg-slate-50/50 p-2 rounded-lg border border-slate-100">
        <Mail className="h-4 w-4 text-primary/60" />
        <span className="truncate font-medium text-slate-700">{profile.user_email}</span>
      </div>
      
      {profile.display_phone && (
        <div className="flex items-center gap-3 text-muted-foreground bg-slate-50/50 p-2 rounded-lg border border-slate-100">
          <Phone className="h-4 w-4 text-primary/60" />
          <span className="font-medium text-slate-700">{profile.display_phone}</span>
        </div>
      )}

      {address && (
        <div className="flex items-start gap-3 text-muted-foreground bg-slate-50/50 p-3 rounded-lg border border-slate-100">
          <MapPin className="h-4 w-4 mt-0.5 text-primary/60" />
          <div className="text-xs space-y-0.5">
            <p className="font-semibold text-slate-800">{address.address1}</p>
            {address.address2 && <p className="text-slate-600">{address.address2}</p>}
            <p className="text-slate-600">{address.city}, {address.state || address.province_code} {address.zip}</p>
            <p className="text-slate-600 font-medium">{address.country || address.country_code}</p>
            {pii.warehouse && <Badge variant="outline" className="mt-2 text-[9px] h-4 border-primary/20 text-primary bg-primary/5">Verified Shipping Address</Badge>}
          </div>
        </div>
      )}
    </div>

    <div className="grid grid-cols-2 gap-3 mt-2">
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col items-center justify-center text-center">
        <span className="text-[10px] uppercase text-muted-foreground font-bold mb-1 tracking-tight">Active Editions</span>
        <div className="flex items-center gap-1.5 font-black text-lg text-amber-600">
          <Award className="h-4 w-4" />
          {profile.total_editions || 0}
        </div>
      </div>
      <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col items-center justify-center text-center">
        <span className="text-[10px] uppercase text-muted-foreground font-bold mb-1 tracking-tight">Total Orders</span>
        <div className="flex items-center gap-1.5 font-black text-lg text-blue-600">
          <ShoppingBag className="h-4 w-4" />
          {profile.total_orders || 0}
        </div>
      </div>
    </div>

    {showLink && (
      <Link 
        href={`/admin/collectors/${profile.user_id || profile.user_email}`}
        className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all shadow-sm"
      >
        View Full Collector Profile
        <ChevronRight className="h-4 w-4" />
      </Link>
    )}
  </div>
);

export function CollectorCard({ profile, className, showLink = true }: CollectorCardProps) {
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
    <Sheet>
      <CardWrapper className={className}>
        <CardContent className="p-5">
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14 border-2 border-slate-100 group-hover:border-primary/20 transition-colors">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="bg-primary/5 text-primary text-lg font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg text-slate-900 leading-tight">{profile.display_name}</h3>
                  {profile.user_id ? (
                    <ShieldCheck className="h-4 w-4 text-blue-500" title="Registered User" />
                  ) : (
                    <User className="h-4 w-4 text-slate-400" title="Guest Customer" />
                  )}
                  {profile.is_kickstarter_backer && (
                    <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] h-4 py-0 font-bold uppercase">
                      Kickstarter
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground font-medium">{profile.user_email}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                    <ShoppingBag className="h-3 w-3 text-blue-500" />
                    {profile.total_orders || 0} Orders
                  </div>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                    <Award className="h-3 w-3 text-amber-500" />
                    {profile.total_editions || 0} Editions
                  </div>
                </div>
              </div>
            </div>
            
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-primary/5 hover:text-primary transition-all">
                <ChevronRight className="h-6 w-6" />
              </Button>
            </SheetTrigger>
          </div>
        </CardContent>
      </CardWrapper>

      <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-2xl font-black flex items-center gap-2">
            Collector Details
          </SheetTitle>
        </SheetHeader>
        <div className="py-2">
          <ProfileContent 
            profile={profile} 
            initials={initials} 
            address={address} 
            pii={pii} 
            showLink={showLink} 
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

