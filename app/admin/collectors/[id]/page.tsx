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
  User, Database, Globe, Calendar, DollarSign,
  Package, LayoutGrid, Heart, TrendingUp, Info,
  Map as MapIcon, Share2, MoreHorizontal, History as HistoryIcon,
  ChevronRight
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { InkOGatchi } from "@/app/collector/dashboard/components/ink-o-gatchi";
import { InkOGatchiWidget } from "@/app/collector/dashboard/components/inkogatchi-widget";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function CollectorDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [editions, setEditions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const profileRes = await fetch(`/api/admin/collectors/${id}`);
        if (!profileRes.ok) throw new Error("Collector not found");
        const profileData = await profileRes.json();
        setProfile(profileData);

        const ordersRes = await fetch(`/api/admin/collectors/${id}/activity`);
        if (ordersRes.ok) {
          const activityData = await ordersRes.json();
          setOrders(activityData.orders || []);
        }

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
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="relative">
          <div className="h-24 w-24 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <User className="h-8 w-8 text-primary/40" />
          </div>
        </div>
        <p className="mt-6 text-muted-foreground font-medium animate-pulse text-lg tracking-tight">Syncing Collector Data...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto py-20 text-center max-w-md">
        <div className="bg-destructive/10 p-6 rounded-3xl mb-8">
          <Info className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-black mb-2 text-destructive tracking-tight">Identity Mismatch</h2>
          <p className="text-muted-foreground font-medium">{error || "We couldn't locate this collector profile in our unified registry."}</p>
        </div>
        <Button 
          onClick={() => router.push("/admin/collectors")}
          className="rounded-full px-8 py-6 h-auto text-base font-bold shadow-xl hover:scale-105 transition-transform"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Return to Registry
        </Button>
      </div>
    );
  }

  const pii = profile.pii_sources || {};
  const sources = [
    { key: 'profile', name: 'Authorized Profile', data: pii.profile, icon: ShieldCheck, color: 'bg-blue-500' },
    { key: 'warehouse', name: 'Verified Shipping', data: pii.warehouse, icon: Package, color: 'bg-amber-500' },
    { key: 'shopify', name: 'Transactional Data', data: pii.shopify, icon: Globe, color: 'bg-green-500' },
  ].filter(s => s.data);

  const stats = [
    { label: 'Active Collection', value: profile.total_editions, icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Market Value', value: formatCurrency(profile.total_spent, 'USD'), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Acquisitions', value: orders.length, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Items Tracked', value: orders.reduce((sum, o) => sum + (o.order_line_items_v2?.length || 0), 0), icon: LayoutGrid, color: 'text-purple-600', bg: 'bg-purple-50' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc]/50">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => router.push("/admin/collectors")}
              className="rounded-full h-10 w-10 p-0 hover:bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest leading-none">Collector Profile</span>
              <h2 className="text-lg font-black text-slate-900 leading-tight tracking-tight">{profile.display_name}</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" className="rounded-full font-bold text-xs px-4 h-9">
              <Share2 className="h-3.5 w-3.5 mr-2" /> Share
            </Button>
            <Button variant="default" size="sm" className="rounded-full font-bold text-xs px-4 h-9 shadow-lg shadow-primary/20">
              Actions <MoreHorizontal className="h-3.5 w-3.5 ml-2" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT PANEL: Profile & Identity */}
          <div className="lg:col-span-4 space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="rounded-[2.5rem] overflow-hidden border-none shadow-2xl shadow-slate-200/50 bg-white">
                <div className="h-40 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-900 relative">
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                  <div className="absolute -bottom-16 left-8">
                    <div className="relative group">
                      <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:blur-2xl transition-all" />
                      {profile.avatar ? (
                        <div className="h-32 w-32 border-[6px] border-white shadow-2xl shadow-slate-900/10 rounded-full bg-white relative z-10 flex items-center justify-center overflow-hidden">
                          <InkOGatchi 
                            stage={profile.avatar.evolutionStage} 
                            equippedItems={{
                              hat: profile.avatar.equippedItems?.hat?.asset_url,
                              eyes: profile.avatar.equippedItems?.eyes?.asset_url,
                              body: profile.avatar.equippedItems?.body?.asset_url,
                              accessory: profile.avatar.equippedItems?.accessory?.asset_url,
                            }}
                            size={120} 
                          />
                        </div>
                      ) : (
                        <Avatar className="h-32 w-32 border-[6px] border-white shadow-2xl shadow-slate-900/10 rounded-full bg-white relative z-10">
                          <AvatarImage src={profile.avatar_url} className="object-cover" />
                          <AvatarFallback className="bg-slate-50 text-primary text-4xl font-black">
                            {profile.display_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?'}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="px-8 pt-20 pb-10">
                  <div className="flex flex-col gap-1 mb-6">
                    <div className="flex items-center gap-2">
                      <h1 className="text-3xl font-black tracking-tight text-slate-900">{profile.display_name}</h1>
                      {profile.avatar && (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-black px-3 py-1 rounded-full">
                          LVL {profile.avatar.level}
                        </Badge>
                      )}
                      {profile.user_id && (
                        <div className="h-6 w-6 bg-blue-100 rounded-full flex items-center justify-center border border-blue-200 shadow-sm" title="Verified User">
                          <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                        </div>
                      )}
                      {profile.is_kickstarter_backer && (
                        <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200 font-black text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Award className="h-3 w-3" /> Kickstarter Backer
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-1">
                      <div className="flex items-center gap-1.5 text-sm font-bold text-slate-500">
                        <Mail className="h-4 w-4 text-slate-400" />
                        {profile.user_email}
                      </div>
                      {profile.display_phone && (
                        <div className="flex items-center gap-1.5 text-sm font-bold text-slate-500">
                          <Phone className="h-4 w-4 text-slate-400" />
                          {profile.display_phone}
                        </div>
                      )}
                    </div>
                  </div>

                  {profile.bio && (
                    <div className="mb-8 p-5 bg-slate-50 rounded-3xl border border-slate-100 relative group">
                      <div className="absolute -top-3 left-6 px-3 bg-white border border-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400">
                        Collector Statement
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed font-medium italic">
                        "{profile.bio}"
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                        <Calendar className="h-5 w-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Member Since</p>
                        <p className="text-sm font-bold text-slate-700">
                          {profile.user_created_at ? new Date(profile.user_created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : 'Jan 2024'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <div className="h-10 w-10 rounded-xl bg-white border border-slate-100 flex items-center justify-center shadow-sm">
                        <TrendingUp className="h-5 w-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-wider">Acquisition Rate</p>
                        <p className="text-sm font-bold text-slate-700">High Tier</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <Card className="rounded-[2rem] overflow-hidden border-none shadow-xl shadow-slate-200/40 bg-white">
                <CardHeader className="px-8 pt-8 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                      <Database className="h-4 w-4" /> Enriched Identity
                    </CardTitle>
                    <Badge variant="outline" className="rounded-full bg-slate-50 text-[10px] px-3 font-bold border-slate-200 text-slate-500">Unified Source</Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-8 pb-8 space-y-6">
                  {sources.map((source, idx) => {
                    const Icon = source.icon;
                    const addr = source.data.address;
                    return (
                      <div key={source.key} className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`h-8 w-8 rounded-lg ${source.color} flex items-center justify-center shadow-lg shadow-${source.key === 'profile' ? 'blue' : source.key === 'warehouse' ? 'amber' : 'green'}-200/50`}>
                              <Icon className="h-4 w-4 text-white" />
                            </div>
                            <span className="text-sm font-black text-slate-700 tracking-tight">{source.name}</span>
                          </div>
                          {idx === 0 && (
                            <Badge className="bg-slate-900 text-white border-none rounded-full text-[9px] px-2 h-5 font-black uppercase tracking-widest">Master</Badge>
                          )}
                        </div>
                        {addr && (
                          <div className="ml-11 p-4 bg-slate-50 rounded-2xl border border-slate-100/80 group hover:border-slate-200 transition-colors">
                            <div className="flex items-start gap-3">
                              <MapIcon className="h-3.5 w-3.5 text-slate-400 mt-0.5" />
                              <div className="text-xs font-bold text-slate-600 space-y-0.5 leading-relaxed">
                                <p className="text-slate-900">{addr.address1 || addr.ship_address1}</p>
                                <p>{addr.city}, {addr.state || addr.province || addr.province_code} {addr.zip || addr.ship_zip}</p>
                                <p className="text-slate-400 uppercase tracking-widest mt-1 text-[10px]">{addr.country || addr.country_name || addr.country_code}</p>
                              </div>
                            </div>
                          </div>
                        )}
                        {idx < sources.length - 1 && <Separator className="bg-slate-100" />}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* RIGHT PANEL: Experience & Activity */}
          <div className="lg:col-span-8 space-y-8">
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {stats.map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                >
                  <Card className="rounded-3xl border-none shadow-xl shadow-slate-200/40 p-6 flex flex-col items-center text-center bg-white group hover:scale-105 transition-all">
                    <div className={`h-12 w-12 rounded-2xl ${stat.bg} flex items-center justify-center mb-4 group-hover:rotate-12 transition-transform`}>
                      <stat.icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{stat.label}</p>
                    <p className="text-2xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Interactive Activity Section */}
            <div className="space-y-6">
              <Tabs defaultValue="overview" className="w-full" onValueChange={setActiveTab}>
                <div className="flex items-center justify-between mb-2 px-2">
                  <TabsList className="bg-slate-100/80 p-1 rounded-full border border-slate-200/50">
                    <TabsTrigger value="overview" className="rounded-full px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary font-black text-xs uppercase tracking-widest transition-all">Overview</TabsTrigger>
                    <TabsTrigger value="orders" className="rounded-full px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary font-black text-xs uppercase tracking-widest transition-all">Acquisitions</TabsTrigger>
                    <TabsTrigger value="editions" className="rounded-full px-6 py-2.5 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-primary font-black text-xs uppercase tracking-widest transition-all">Artworks</TabsTrigger>
                  </TabsList>
                </div>

                <TabsContent value="overview" className="mt-0">
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-8"
                  >
                    <InkOGatchiWidget userId={profile.user_id} email={profile.user_email} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden p-8">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-black text-slate-900 tracking-tight">Recent Activity</h3>
                          <HistoryIcon className="h-5 w-5 text-slate-300" />
                        </div>
                        <div className="space-y-6">
                          {orders.slice(0, 3).map((order, idx) => (
                            <div key={order.id} className="flex gap-4 relative">
                              {idx < orders.slice(0, 3).length - 1 && (
                                <div className="absolute left-[19px] top-10 bottom-[-24px] w-[2px] bg-slate-100" />
                              )}
                              <div className="h-10 w-10 rounded-full bg-slate-100 border-4 border-white shadow-sm flex items-center justify-center flex-shrink-0 relative z-10">
                                <ShoppingBag className="h-4 w-4 text-slate-500" />
                              </div>
                              <div className="flex flex-col gap-1 flex-1 pb-6">
                                <p className="text-sm font-black text-slate-800">Acquired Order #{order.order_number}</p>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">{new Date(order.processed_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                                <div className="mt-2 flex -space-x-2">
                                  {order.order_line_items_v2?.slice(0, 4).map((item: any) => (
                                    <div key={item.id} className="h-8 w-8 rounded-lg border-2 border-white shadow-md overflow-hidden bg-slate-50">
                                      {(item.img_url || item.image_url) && <img src={item.img_url || item.image_url} alt="" className="h-full w-full object-cover" />}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </Card>

                      <Card className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden p-8">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-black text-slate-900 tracking-tight">Collector Stats</h3>
                          <Heart className="h-5 w-5 text-pink-300" />
                        </div>
                        <div className="space-y-6">
                          <div className="p-5 rounded-3xl bg-indigo-50 border border-indigo-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-2">Lifetime Value</p>
                            <div className="flex items-end justify-between">
                              <p className="text-3xl font-black text-indigo-900 tracking-tight">{formatCurrency(profile.total_spent, 'USD')}</p>
                              <Badge className="bg-indigo-600 border-none mb-1 shadow-lg shadow-indigo-200">Elite Status</Badge>
                            </div>
                          </div>
                          <div className="p-5 rounded-3xl bg-amber-50 border border-amber-100">
                            <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-2">Authenticated Editions</p>
                            <div className="flex items-center justify-between">
                              <p className="text-3xl font-black text-amber-900 tracking-tight">{profile.authenticated_editions}</p>
                              <div className="flex gap-1">
                                {[1,2,3].map(i => <ShieldCheck key={i} className={`h-5 w-5 ${i <= profile.authenticated_editions ? 'text-amber-500' : 'text-amber-200'}`} />)}
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </div>
                  </motion.div>
                </TabsContent>

                <TabsContent value="orders" className="mt-0">
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-4"
                  >
                    {orders.map((order) => (
                      <Card key={order.id} className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden hover:shadow-2xl transition-all group">
                        <div className="flex flex-col md:flex-row">
                          <div className="md:w-64 bg-slate-50 border-r border-slate-100 p-8 flex flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="text-xl font-black text-slate-900 tracking-tight">#{order.order_number}</h4>
                                <Badge className={`${order.financial_status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'} border-none text-[9px] font-black uppercase tracking-widest h-5`}>
                                  {order.financial_status}
                                </Badge>
                              </div>
                              <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{new Date(order.processed_at).toLocaleDateString()}</p>
                            </div>
                            <div className="mt-8">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total</p>
                              <p className="text-2xl font-black text-slate-900">{formatCurrency(order.total_price, order.currency_code)}</p>
                              <Link href={`/admin/orders/${order.id}`}>
                                <Button variant="outline" size="sm" className="mt-4 w-full rounded-xl border-slate-200 font-bold text-xs h-10 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
                                  Full Details <ExternalLink className="h-3 w-3 ml-2" />
                                </Button>
                              </Link>
                            </div>
                          </div>
                          <div className="flex-1 p-8">
                            <div className="space-y-4">
                              {(order.order_line_items_v2 || []).map((item: any) => (
                                <div key={item.id} className="flex items-center gap-5 p-3 rounded-2xl hover:bg-slate-50 transition-colors group/item">
                                  <div className="h-16 w-16 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg shadow-slate-200/50 relative border border-slate-100">
                                    {(item.img_url || item.image_url) ? (
                                      <img src={item.img_url || item.image_url} alt={item.name} className="h-full w-full object-cover group-hover/item:scale-110 transition-transform duration-500" />
                                    ) : (
                                      <Award className="h-6 w-6 text-slate-300 absolute inset-0 m-auto" />
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-4">
                                      <div>
                                        <h5 className="font-black text-slate-900 tracking-tight leading-tight mb-1">{item.name}</h5>
                                        <div className="flex items-center gap-2">
                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.vendor_name || 'Street Collector'}</span>
                                          <span className="h-1 w-1 rounded-full bg-slate-300" />
                                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty {item.quantity}</span>
                                        </div>
                                      </div>
                                      <div className="flex flex-col items-end gap-2">
                                        {item.edition_number ? (
                                          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-black text-[10px] rounded-lg h-6 px-2.5">
                                            EDITION #{item.edition_number}
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-[9px] font-black tracking-widest text-slate-400 border-slate-200 h-6">ACCESSORY</Badge>
                                        )}
                                        {item.nfc_claimed_at && <ShieldCheck className="h-4 w-4 text-emerald-500 drop-shadow-sm" />}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </motion.div>
                </TabsContent>

                <TabsContent value="editions" className="mt-0">
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  >
                    {editions.map((edition) => (
                      <Card key={edition.id} className="rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden group hover:scale-[1.02] transition-all duration-500 cursor-pointer">
                        <div className="flex h-full">
                          <div className="w-40 h-auto bg-slate-50 relative overflow-hidden flex-shrink-0">
                            {(edition.imgUrl || edition.imageUrl) ? (
                              <img src={edition.imgUrl || edition.imageUrl} alt={edition.name} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700" />
                            ) : (
                              <div className="flex items-center justify-center h-full bg-slate-100">
                                <Award className="h-12 w-12 text-slate-300" />
                              </div>
                            )}
                            <div className="absolute top-4 left-4">
                              <Badge className="bg-white/90 backdrop-blur-md text-slate-900 border-none font-black text-[10px] px-3 py-1.5 shadow-xl">
                                #{edition.editionNumber}
                              </Badge>
                            </div>
                          </div>
                          <div className="p-8 flex-1 min-w-0 flex flex-col justify-between">
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{edition.vendorName || 'Street Collector'}</p>
                              <h4 className="text-xl font-black text-slate-900 tracking-tight leading-tight mb-4 group-hover:text-primary transition-colors">{edition.name}</h4>
                              <div className="flex flex-wrap gap-2">
                                {edition.nfc_claimed_at || edition.verificationSource === 'supabase' ? (
                                  <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border border-emerald-100 font-black text-[9px] tracking-widest px-3 h-6 rounded-full flex items-center gap-1.5 shadow-sm">
                                    <ShieldCheck className="h-3 w-3" /> VERIFIED
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-slate-400 border-slate-200 font-black text-[9px] tracking-widest px-3 h-6 rounded-full">UNCLAIMED</Badge>
                                )}
                                {edition.editionType && (
                                  <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-black text-[9px] tracking-widest px-3 h-6 rounded-full uppercase">
                                    {edition.editionType}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="pt-6 mt-6 border-t border-slate-50 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-slate-300" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(edition.purchaseDate).toLocaleDateString()}</span>
                              </div>
                              <div className="h-8 w-8 rounded-full bg-slate-50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <ChevronRight className="h-4 w-4 text-slate-400" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </motion.div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
