"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Loader2, ArrowLeft, Mail, Phone, ShoppingBag, 
  Award, Clock, MapPin, ExternalLink, ShieldCheck,
  History, User, Database, Globe
} from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";

export default function CollectorDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [editions, setEditions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const profileRes = await fetch(`/api/admin/collectors/${id}`);
        if (!profileRes.ok) throw new Error("Collector not found");
        const profileData = await profileRes.json();
        setProfile(profileData);

        // Fetch collector's orders and editions from specific APIs
        // Since we don't have a direct admin/collector/[id]/activity API yet,
        // we'll simulate fetching them if the view doesn't already have them.
        // Actually, the view has counts, but for full lists we might need more APIs.
        // For now, let's use the email to fetch orders from existing APIs.
        
        const ordersRes = await fetch(`/api/admin/collectors/${id}/activity`);
        if (ordersRes.ok) {
          const activityData = await ordersRes.json();
          setOrders(activityData.orders || []);
        }

        // Keep editions fetch as is for now, or use the orders data to derive it
        const editionsRes = await fetch(`/api/collector/editions?email=${profileData.user_email}`);
        if (editionsRes.ok) {
          const editionsData = await editionsRes.json();
          setEditions(editionsData.editions || []);
        }

      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-40">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground font-medium text-lg">Retrieving collector profile...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto py-20 text-center">
        <h2 className="text-2xl font-bold mb-4 text-destructive">Error</h2>
        <p className="text-muted-foreground mb-8">{error || "Profile not found"}</p>
        <Button onClick={() => router.push("/admin/collectors")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Directory
        </Button>
      </div>
    );
  }

  const pii = profile.pii_sources || {};
  const sources = [
    { key: 'profile', name: 'Manual Profile', data: pii.profile, icon: User },
    { key: 'warehouse', name: 'Warehouse Data', data: pii.warehouse, icon: Database },
    { key: 'shopify', name: 'Shopify Data', data: pii.shopify, icon: Globe },
  ].filter(s => s.data);

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/admin/collectors")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Directory
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="shadow-sm border-slate-200/60 overflow-hidden">
            <div className="h-32 bg-gradient-to-br from-blue-600/10 to-indigo-600/10 relative" />
            <div className="px-6 pb-6 relative">
              <Avatar className="h-24 w-24 border-4 border-background absolute -top-12 shadow-md">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="bg-primary/5 text-primary text-2xl font-bold">
                  {profile.display_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              
              <div className="mt-14 space-y-4">
                <div>
                  <h1 className="text-2xl font-bold">{profile.display_name}</h1>
                  <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
                    <Mail className="h-3.5 w-3.5" />
                    {profile.user_email}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {profile.user_id ? (
                    <Badge variant="default" className="gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      Registered Member
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Guest Customer</Badge>
                  )}
                  {profile.display_phone && (
                    <Badge variant="outline" className="gap-1">
                      <Phone className="h-3 w-3" />
                      {profile.display_phone}
                    </Badge>
                  )}
                </div>

                {profile.bio && (
                  <p className="text-sm text-muted-foreground italic border-l-2 pl-3 py-1">
                    "{profile.bio}"
                  </p>
                )}

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Total Spent</p>
                    <p className="text-xl font-bold">{formatCurrency(profile.total_spent, 'USD')}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase font-bold text-muted-foreground">Active Editions</p>
                    <p className="text-xl font-bold">{profile.total_editions}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <Card className="shadow-sm border-slate-200/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                <Database className="h-4 w-4 text-primary" />
                PII Data Sources
              </CardTitle>
              <CardDescription className="text-xs">
                Data hierarchy for the Enrichment Protocol
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sources.map((source, idx) => {
                const Icon = source.icon;
                const addr = source.data.address;
                return (
                  <div key={source.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-medium text-sm">
                        <div className="p-1 rounded bg-primary/10">
                          <Icon className="h-3.5 w-3.5 text-primary" />
                        </div>
                        {source.name}
                      </div>
                      {idx === 0 && <Badge className="text-[9px] h-4">Authoritative</Badge>}
                    </div>
                    {source.data.first_name && (
                      <p className="text-xs ml-7 text-muted-foreground">
                        Name: {source.data.first_name} {source.data.last_name || ''}
                      </p>
                    )}
                    {addr && (
                      <div className="text-xs ml-7 text-muted-foreground bg-slate-50 p-2 rounded border border-slate-100">
                        <p>{addr.address1 || addr.ship_address1}</p>
                        <p>{addr.city}, {addr.state || addr.province || addr.province_code} {addr.zip || addr.ship_zip}</p>
                        <p>{addr.country || addr.country_name || addr.country_code}</p>
                      </div>
                    )}
                    {idx < sources.length - 1 && <Separator className="mt-2" />}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Activity Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <Tabs defaultValue="orders" className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
              <TabsTrigger value="orders" className="gap-2">
                <ShoppingBag className="h-4 w-4" />
                Orders
                <Badge variant="secondary" className="ml-1 px-1 h-4">{orders.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="editions" className="gap-2">
                <Award className="h-4 w-4" />
                Editions
                <Badge variant="secondary" className="ml-1 px-1 h-4">{editions.length}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="orders" className="mt-6 space-y-4">
              {orders.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No orders found for this collector.</p>
                </div>
              ) : (
                orders.map((order) => (
                  <Card key={order.id} className="hover:border-primary/20 transition-colors shadow-none overflow-hidden">
                    <CardHeader className="p-4 bg-slate-50/50 border-b">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="bg-blue-50 p-2 rounded-lg border border-blue-100">
                            <ShoppingBag className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm">Order #{order.order_number || order.order_name}</h4>
                              <Badge variant={order.financial_status === 'paid' ? 'default' : 'secondary'} className="text-[10px] h-4">
                                {order.financial_status}
                              </Badge>
                              {order.fulfillment_status && (
                                <Badge variant="outline" className="text-[10px] h-4 uppercase">
                                  {order.fulfillment_status}
                                </Badge>
                              )}
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {new Date(order.processed_at).toLocaleDateString()} at {new Date(order.processed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex items-center gap-4">
                          <div>
                            <p className="font-bold text-sm">{formatCurrency(order.total_price, order.currency_code)}</p>
                          </div>
                          <Link href={`/admin/orders/${order.id}`}>
                            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      <div className="divide-y">
                        {(order.order_line_items_v2 || []).map((item: any) => (
                          <div key={item.id} className="p-3 flex items-center gap-3 hover:bg-slate-50/30 transition-colors">
                            <div className="h-10 w-10 bg-slate-100 rounded overflow-hidden flex-shrink-0 border border-slate-200">
                              {item.img_url ? (
                                <img src={item.img_url} alt={item.name} className="h-full w-full object-cover" />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center">
                                  <Award className="h-5 w-5 text-slate-300" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-medium truncate">{item.name}</p>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  {item.edition_number ? (
                                    <Badge variant="secondary" className="text-[10px] h-4 font-bold bg-amber-50 text-amber-700 border-amber-200">
                                      Edition #{item.edition_number}{item.edition_total ? ` / ${item.edition_total}` : ''}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-[10px] h-4 text-muted-foreground border-slate-200 uppercase font-semibold">
                                      {item.vendor_name === 'Street Collector' || !item.vendor_name ? 'Accessory' : 'No Edition'}
                                    </Badge>
                                  )}
                                  {item.nfc_claimed_at && (
                                    <ShieldCheck className="h-3.5 w-3.5 text-green-600" title="Authenticated" />
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center justify-between mt-0.5">
                                <p className="text-[10px] text-muted-foreground uppercase tracking-tight">
                                  {item.vendor_name || 'Street Collector'} • Qty: {item.quantity}
                                </p>
                                <p className="text-xs font-semibold">{formatCurrency(item.price, order.currency_code)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="editions" className="mt-6 space-y-4">
              {editions.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg border border-dashed">
                  <Award className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No editions found in this collection.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {editions.map((edition) => (
                    <Card key={edition.id} className="shadow-none group overflow-hidden border-slate-200/60 hover:border-primary/30 transition-all">
                      <div className="flex">
                        <div className="w-24 h-24 bg-slate-50 relative overflow-hidden flex-shrink-0 border-r border-slate-100">
                          {edition.imgUrl ? (
                            <img src={edition.imgUrl} alt={edition.name} className="object-cover w-full h-full" />
                          ) : (
                            <div className="flex items-center justify-center h-full text-slate-200">
                              <Award className="h-10 w-10" />
                            </div>
                          )}
                        </div>
                        <div className="p-3 flex-1 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-bold text-xs truncate group-hover:text-primary transition-colors">{edition.name}</h4>
                              {edition.editionNumber ? (
                                <Badge variant="secondary" className="text-[9px] h-3.5 px-1.5 bg-amber-50 text-amber-700 border-amber-200 whitespace-nowrap">
                                  #{edition.editionNumber}{edition.editionTotal ? ` / ${edition.editionTotal}` : ''}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[9px] h-3.5 px-1.5 text-muted-foreground border-slate-200 whitespace-nowrap">
                                  Accessory
                                </Badge>
                              )}
                            </div>
                            <p className="text-[9px] text-muted-foreground uppercase font-semibold mt-0.5 tracking-tight">
                              {edition.vendorName || 'Street Collector'}
                            </p>
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1.5">
                              {edition.nfc_claimed_at || edition.verificationSource === 'supabase' ? (
                                <Badge variant="default" className="text-[8px] h-3.5 px-1 bg-green-600 hover:bg-green-600 gap-0.5">
                                  <ShieldCheck className="h-2 w-2" />
                                  Verified
                                </Badge>
                              ) : (
                                <Badge variant="secondary" className="text-[8px] h-3.5 px-1">Unclaimed</Badge>
                              )}
                              {edition.editionType && (
                                <Badge variant="outline" className="text-[8px] h-3.5 px-1 capitalize">
                                  {edition.editionType}
                                </Badge>
                              )}
                            </div>
                            <span className="text-[8px] text-muted-foreground font-medium">
                              {new Date(edition.purchaseDate || edition.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

