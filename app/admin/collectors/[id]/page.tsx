"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
;
;
;
;
import { 
  Loader2, ArrowLeft, Mail, Phone, ShoppingBag, 
  Award, Clock, MapPin, ExternalLink, ShieldCheck,
  User, Database, Globe, Calendar, DollarSign,
  Package, LayoutGrid, Heart, TrendingUp, Info,
  Map as MapIcon, Share2, MoreHorizontal, History as HistoryIcon,
  ChevronRight, ChevronLeft, X, Eye
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui";
import { InkOGatchi } from "@/app/collector/dashboard/components/ink-o-gatchi";
import { InkOGatchiWidget } from "@/app/collector/dashboard/components/inkogatchi-widget";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, Button, Badge, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui"
export default function CollectorDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [editions, setEditions] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [groupingMode, setGroupingMode] = useState<"product" | "artist">("product");
  const [expandedGroup, setExpandedGroup] = useState<any[] | null>(null);
  const [activeIndices, setActiveIndices] = useState<Record<string, number>>({});

  const getActiveIndex = (groupId: string) => activeIndices[groupId] || 0;
  
  const cycleNext = (e: React.MouseEvent, groupId: string, count: number) => {
    e.stopPropagation();
    setActiveIndices(prev => ({
      ...prev,
      [groupId]: ((prev[groupId] || 0) + 1) % count
    }));
  };

  const cyclePrev = (e: React.MouseEvent, groupId: string, count: number) => {
    e.stopPropagation();
    setActiveIndices(prev => ({
      ...prev,
      [groupId]: ((prev[groupId] || 0) - 1 + count) % count
    }));
  };

  // Group editions by product_id/SKU for the "Stacked Deck" effect
  const groupedByProduct = editions.reduce((acc: any, edition: any) => {
    const key = edition.productId || edition.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(edition);
    return acc;
  }, {});

  // Group editions by Vendor/Artist
  const groupedByArtist = editions.reduce((acc: any, edition: any) => {
    const key = edition.vendorName || 'Street Collector';
    if (!acc[key]) acc[key] = [];
    acc[key].push(edition);
    return acc;
  }, {});

  const groupedEditionsList = Object.values(groupedByProduct);
  const groupedByArtistList = Object.values(groupedByArtist);

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

        // Pass BOTH email and ID for robust matching
        const editionsUrl = `/api/collector/editions?id=${profileData.shopify_customer_id || id}&email=${profileData.user_email || ''}`;
        console.log('[CollectorPage] Fetching editions from:', editionsUrl);
        const editionsRes = await fetch(editionsUrl);
        if (editionsRes.ok) {
          const editionsData = await editionsRes.json();
          console.log('[CollectorPage] Received editions count:', editionsData.editions?.length);
          if (editionsData.editions?.length > 0) {
            console.log('[CollectorPage] Sample edition:', editionsData.editions[0]);
          }
          setEditions(editionsData.editions || []);
        } else {
          console.error('[CollectorPage] Failed to fetch editions:', editionsRes.status);
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

  const validOrders = orders.filter(o => o.fulfillment_status !== 'canceled' && o.financial_status !== 'voided');

  const stats = [
    { label: 'Active Collection', value: profile.total_editions, icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'Market Value', value: formatCurrency(profile.total_spent, 'USD'), icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Acquisitions', value: validOrders.length, icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Items Tracked', value: validOrders.reduce((sum, o) => sum + (o.order_line_items_v2?.length || 0), 0), icon: LayoutGrid, color: 'text-purple-600', bg: 'bg-purple-50' },
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
                    <div className="flex items-center gap-2 flex-wrap">
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
                      {profile.shopify_customer_id && (
                        <Link 
                          href={`/collector/dashboard?customerId=${profile.shopify_customer_id}`}
                          target="_blank"
                        >
                          <Button variant="outline" size="sm" className="rounded-full text-xs font-bold">
                            <ExternalLink className="h-3.5 w-3.5 mr-2" />
                            View as Collector
                          </Button>
                        </Link>
                      )}
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

                {/* MODAL OVERLAY FOR EXPANDED STACK */}
                <AnimatePresence>
                  {expandedGroup && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl"
                      onClick={() => setExpandedGroup(null)}
                    >
                      <motion.div 
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="bg-white rounded-[3rem] shadow-2xl max-w-5xl w-full max-h-[85vh] overflow-hidden flex flex-col"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                          <div>
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                              {groupingMode === 'product' ? expandedGroup[0].name : expandedGroup[0].vendorName}
                            </h3>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                              {expandedGroup.length} Editions in this Stack
                            </p>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setExpandedGroup(null)}
                            className="rounded-full h-12 w-12 p-0 hover:bg-slate-100"
                          >
                            <X className="h-6 w-6 text-slate-400" />
                          </Button>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {expandedGroup.map((edition: any) => (
                              <Card 
                                key={edition.id} 
                                className="rounded-3xl border-none shadow-xl bg-white overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer group"
                                onClick={() => window.open(`/admin/artwork-preview/${edition.lineItemId}`, '_blank')}
                              >
                                <div className="aspect-[4/5] bg-slate-100 relative">
                                  {edition.imgUrl ? (
                                    <img src={edition.imgUrl} alt={edition.name} className="h-full w-full object-cover" />
                                  ) : (
                                    <div className="h-full w-full flex items-center justify-center">
                                      <Award className="h-12 w-12 text-slate-300" />
                                    </div>
                                  )}
                                  <div className="absolute top-4 left-4">
                                    <Badge className="bg-white/90 backdrop-blur-md text-slate-900 border-none font-black text-[10px] px-3 py-1.5 shadow-xl">
                                      #{edition.editionNumber}{edition.editionTotal ? `/${edition.editionTotal}` : ''}
                                    </Badge>
                                  </div>
                                  {/* Preview Icon Overlay */}
                                  <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors flex items-center justify-center">
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-3 shadow-xl">
                                      <Eye className="h-6 w-6 text-slate-900" />
                                    </div>
                                  </div>
                                </div>
                                <div className="p-5">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{edition.vendorName}</p>
                                  <h5 className="font-black text-slate-900 line-clamp-1 mb-3">{edition.name}</h5>
                                  <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                                    <div className="flex items-center gap-1.5">
                                      <Calendar className="h-3 w-3 text-slate-300" />
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        {new Date(edition.purchaseDate).toLocaleDateString()}
                                      </span>
                                    </div>
                                    {edition.nfc_claimed_at && <ShieldCheck className="h-4 w-4 text-emerald-500" />}
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

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
                          {validOrders.slice(0, 3).map((order, idx) => (
                            <div key={order.id} className="flex gap-4 relative">
                              {idx < validOrders.slice(0, 3).length - 1 && (
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
                                      {item.img_url && <img src={item.img_url} alt="" className="h-full w-full object-cover" />}
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
                                <div className="flex gap-1.5">
                                  <Badge className={`${order.financial_status === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'} border-none text-[9px] font-black uppercase tracking-widest h-5`}>
                                    {order.financial_status}
                                  </Badge>
                                  <Badge className={`${order.fulfillment_status === 'fulfilled' ? 'bg-blue-500' : 'bg-slate-400'} border-none text-[9px] font-black uppercase tracking-widest h-5`}>
                                    {order.fulfillment_status || 'pending'}
                                  </Badge>
                                </div>
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
                              {(() => {
                                // CRITICAL: Filter out inactive/removed line items first
                                const activeLineItems = (order.order_line_items_v2 || []).filter((item: any) => 
                                  item.status === 'active' && 
                                  item.restocked !== true
                                );
                                
                                // Group items by product_id within the order
                                const groupedOrderItems = activeLineItems.reduce((acc: any, item: any) => {
                                  const key = item.product_id || item.name;
                                  if (!acc[key]) acc[key] = [];
                                  acc[key].push(item);
                                  return acc;
                                }, {});

                                return Object.values(groupedOrderItems).map((group: any) => {
                                  const count = group.length;
                                  const hasMultiple = count > 1;
                                  const groupId = `order-${order.id}-${group[0].product_id || group[0].name}`;
                                  const activeIndex = getActiveIndex(groupId);
                                  const leadItem = group[activeIndex] || group[0];

                                  return (
                                    <motion.div 
                                      key={groupId} 
                                      className="relative group/stack"
                                      whileHover="hover"
                                      initial="initial"
                                      onClick={() => hasMultiple && setExpandedGroup(group.map((li: any) => ({
                                        ...li,
                                        purchaseDate: order.processed_at,
                                        vendorName: li.vendor_name,
                                        imgUrl: li.img_url,
                                        editionNumber: li.edition_number
                                      })))}
                                    >
                                      {hasMultiple && (
                                        <>
                                          {/* Visual Stack Layers */}
                                          {count >= 3 && (
                                            <motion.div 
                                              className="absolute inset-0 bg-slate-100 border border-slate-200 rounded-2xl shadow-sm"
                                              style={{ zIndex: 1 }}
                                              variants={{
                                                hover: { x: 15, y: -8, rotate: 4, opacity: 1 }
                                              }}
                                              initial={{ x: 6, y: -3, rotate: 1.5, opacity: 0.4 }}
                                              transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                            />
                                          )}
                                          <motion.div 
                                            className="absolute inset-0 bg-slate-50 border border-slate-200 rounded-2xl shadow-md"
                                            style={{ zIndex: 2 }}
                                            variants={{
                                              hover: { x: 8, y: -4, rotate: 2, opacity: 1 }
                                            }}
                                            initial={{ x: 3, y: -1.5, rotate: 0.5, opacity: 0.6 }}
                                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                          />
                                          <motion.div 
                                            className="absolute -top-2 -right-2 z-[60] h-6 w-6 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-[10px] shadow-lg border-2 border-white"
                                            variants={{
                                              hover: { scale: 1.2, rotate: 12, x: 5, y: -3 }
                                            }}
                                          >
                                            {count}
                                          </motion.div>

                                          {/* Navigation Arrows */}
                                          <div className="absolute inset-y-0 -left-4 -right-4 flex items-center justify-between opacity-0 group-hover/stack:opacity-100 transition-opacity z-[70] pointer-events-none">
                                            <Button 
                                              variant="secondary" 
                                              size="sm" 
                                              className="h-6 w-6 rounded-full p-0 shadow-lg pointer-events-auto hover:scale-110"
                                              onClick={(e) => cyclePrev(e, groupId, count)}
                                            >
                                              <ChevronLeft className="h-3 w-3" />
                                            </Button>
                                            <Button 
                                              variant="secondary" 
                                              size="sm" 
                                              className="h-6 w-6 rounded-full p-0 shadow-lg pointer-events-auto hover:scale-110"
                                              onClick={(e) => cycleNext(e, groupId, count)}
                                            >
                                              <ChevronRight className="h-3 w-3" />
                                            </Button>
                                          </div>
                                        </>
                                      )}
                                      
                                      <motion.div
                                        className="relative"
                                        style={{ zIndex: 10 }}
                                        variants={{
                                          hover: { y: -2 }
                                        }}
                                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                      >
                                        <div className={`flex items-center gap-5 p-3 rounded-2xl bg-white border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all group/item cursor-pointer ${leadItem.status !== 'active' ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                                          <div className="h-16 w-16 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg shadow-slate-200/50 relative border border-slate-100">
                                            {leadItem.img_url ? (
                                              <img 
                                                key={leadItem.id}
                                                src={leadItem.img_url} 
                                                alt={leadItem.name} 
                                                className={`h-full w-full object-cover group-hover/item:scale-110 transition-transform duration-500`} 
                                              />
                                            ) : (
                                              <Award className="h-6 w-6 text-slate-300 absolute inset-0 m-auto" />
                                            )}
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-4">
                                              <div>
                                                <h5 className={`font-black text-slate-900 tracking-tight leading-tight mb-1 ${leadItem.status !== 'active' ? 'line-through text-slate-400' : ''}`}>{leadItem.name}</h5>
                                                <div className="flex items-center gap-2">
                                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{leadItem.vendor_name || 'Street Collector'}</span>
                                                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty {leadItem.quantity || 1}</span>
                                                  {leadItem.status !== 'active' && (
                                                    <>
                                                      <span className="h-1 w-1 rounded-full bg-slate-300" />
                                                      <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest px-1.5 h-4 border-slate-200 text-slate-400">
                                                        {leadItem.status}
                                                      </Badge>
                                                    </>
                                                  )}
                                                </div>
                                              </div>
                                              <div className="flex flex-col items-end gap-2">
                                                {hasMultiple ? (
                                                  <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[9px] rounded-lg h-6 px-2">
                                                    {count} EDITIONS
                                                  </Badge>
                                                ) : leadItem.edition_number ? (
                                                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-black text-[10px] rounded-lg h-6 px-2.5">
                                                    EDITION #{leadItem.edition_number}{leadItem.edition_total ? `/${leadItem.edition_total}` : ''}
                                                  </Badge>
                                                ) : (
                                                  <Badge variant="outline" className="text-[9px] font-black tracking-widest text-slate-400 border-slate-200 h-6">
                                                    {leadItem.vendor_name === 'Street Collector' ? 'ACCESSORY' : 'PENDING'}
                                                  </Badge>
                                                )}
                                                {(leadItem.nfc_claimed_at || group.some((i: any) => i.nfc_claimed_at)) && <ShieldCheck className="h-4 w-4 text-emerald-500 drop-shadow-sm" />}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </motion.div>
                                    </motion.div>
                                  );
                                });
                              })()}
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </motion.div>
                </TabsContent>

                <TabsContent value="editions" className="mt-0">
                  <div className="flex items-center justify-between mb-8 px-2">
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Artworks Gallery</h3>
                    <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200/50">
                      <Button 
                        variant={groupingMode === 'product' ? 'default' : 'ghost'} 
                        size="sm" 
                        onClick={() => setGroupingMode('product')}
                        className={`rounded-lg px-4 h-8 text-[10px] font-black uppercase tracking-widest transition-all ${groupingMode === 'product' ? 'bg-white text-primary shadow-sm border-slate-200' : 'text-slate-500'}`}
                      >
                        By Item
                      </Button>
                      <Button 
                        variant={groupingMode === 'artist' ? 'default' : 'ghost'} 
                        size="sm" 
                        onClick={() => setGroupingMode('artist')}
                        className={`rounded-lg px-4 h-8 text-[10px] font-black uppercase tracking-widest transition-all ${groupingMode === 'artist' ? 'bg-white text-primary shadow-sm border-slate-200' : 'text-slate-500'}`}
                      >
                        By Artist
                      </Button>
                    </div>
                  </div>

                  <motion.div 
                    key={groupingMode}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12"
                  >
                    {groupedEditionsList.length > 0 ? (
                      (groupingMode === 'product' ? groupedEditionsList : groupedByArtistList).map((group: any) => {
                        const count = group.length;
                        const hasMultiple = count > 1;
                        const groupId = group[0].productId || group[0].vendorName;
                        const activeIndex = getActiveIndex(groupId);
                        
                        const displayGroup = [...group].sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
                        const leadItem = displayGroup[activeIndex] || displayGroup[0];
                        const isStreetCollector = leadItem.vendorName?.toLowerCase().includes('street collector') || leadItem.vendorName?.toLowerCase().includes('street-collector');

                        return (
                          <motion.div 
                            key={groupId + groupingMode} 
                            className="relative group h-[220px]"
                            whileHover="hover"
                            initial="initial"
                            onClick={(e) => {
                              if (hasMultiple) {
                                setExpandedGroup(displayGroup)
                              } else {
                                // Single artwork - open preview in new tab
                                e.preventDefault()
                                window.open(`/admin/artwork-preview/${leadItem.lineItemId}`, '_blank')
                              }
                            }}
                          >
                          {/* Visual Stack Layers with Animation */}
                          {hasMultiple && (
                            <>
                              {/* Deepest Card (Only if 3+ items) */}
                              {count >= 3 && (
                                <motion.div 
                                  className="absolute inset-0 bg-slate-100 border border-slate-200 rounded-[2.5rem] shadow-sm"
                                  style={{ zIndex: 1 }}
                                  variants={{
                                    hover: { x: 30, y: -15, rotate: 8, opacity: 1 }
                                  }}
                                  initial={{ x: 12, y: -6, rotate: 3, opacity: 0.6 }}
                                  transition={{ type: "spring", stiffness: 250, damping: 20 }}
                                />
                              )}
                              {/* Middle Card */}
                              <motion.div 
                                className="absolute inset-0 bg-slate-50 border border-slate-200 rounded-[2.5rem] shadow-md"
                                style={{ zIndex: 2 }}
                                variants={{
                                  hover: { x: 15, y: -8, rotate: 4, opacity: 1 }
                                }}
                                initial={{ x: 6, y: -3, rotate: 1.5, opacity: 0.8 }}
                                transition={{ type: "spring", stiffness: 250, damping: 20 }}
                              />
                                
                                {/* Quantity Badge */}
                                <motion.div 
                                  className="absolute -top-3 -right-3 z-[60] h-10 w-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-sm shadow-xl border-4 border-white"
                                  variants={{
                                    hover: { scale: 1.2, rotate: 12, x: 5, y: -5 }
                                  }}
                                >
                                  {count}
                                </motion.div>

                                {/* Navigation Arrows (Only on Hover) */}
                                <div className="absolute inset-y-0 -left-6 -right-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-[70] pointer-events-none">
                                  <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    className="h-8 w-8 rounded-full p-0 shadow-lg pointer-events-auto hover:scale-110"
                                    onClick={(e) => cyclePrev(e, groupId, count)}
                                  >
                                    <ChevronLeft className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    className="h-8 w-8 rounded-full p-0 shadow-lg pointer-events-auto hover:scale-110"
                                    onClick={(e) => cycleNext(e, groupId, count)}
                                  >
                                    <ChevronRight className="h-4 w-4" />
                                  </Button>
                                </div>
                              </>
                            )}

                            <motion.div
                              className="h-full w-full relative"
                              style={{ zIndex: 10 }}
                              variants={{
                                hover: { y: -5 }
                              }}
                              transition={{ type: "spring", stiffness: 400, damping: 25 }}
                            >
                              <Card className={`rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden group-hover:shadow-2xl transition-all duration-500 cursor-pointer h-full ${hasMultiple ? 'ring-1 ring-slate-100' : ''}`}>
                                <div className="flex h-full">
                                  <div className="w-44 aspect-[4/5] bg-slate-50 relative overflow-hidden flex-shrink-0">
                                    {leadItem.imgUrl ? (
                                      <img 
                                        key={leadItem.id} 
                                        src={leadItem.imgUrl} 
                                        alt={leadItem.name} 
                                        className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700" 
                                      />
                                    ) : (
                                      <div className="flex items-center justify-center h-full bg-slate-100">
                                        <Award className="h-12 w-12 text-slate-300" />
                                      </div>
                                    )}
                                  <div className="absolute top-4 left-4">
                                    <Badge className="bg-white/90 backdrop-blur-md text-slate-900 border-none font-black text-[10px] px-3 py-1.5 shadow-xl">
                                      {isStreetCollector 
                                        ? 'COLLECTIBLE' 
                                        : (groupingMode === 'product' && hasMultiple 
                                            ? `IDS: ${group.map((e: any) => `#${e.editionNumber}${e.editionTotal ? '/' + e.editionTotal : ''}`).join(', ')}` 
                                            : leadItem.editionNumber ? `#${leadItem.editionNumber}${leadItem.editionTotal ? '/' + leadItem.editionTotal : ''}` : 'ARTIST')}
                                    </Badge>
                                  </div>
                                  </div>
                                  <div className="p-6 flex-1 min-w-0 flex flex-col justify-between overflow-hidden">
                                    <div className="space-y-2">
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] truncate">
                                        {groupingMode === 'artist' ? `${count} Pieces Owned` : (leadItem.vendorName || 'Street Collector')}
                                      </p>
                                      <h4 className="text-lg font-black text-slate-900 tracking-tight leading-tight line-clamp-2 group-hover:text-primary transition-colors min-h-[3rem]">
                                        {groupingMode === 'artist' ? (leadItem.vendorName || 'Street Collector') : leadItem.name}
                                      </h4>
                                      <div className="flex flex-wrap gap-2">
                                        {group.some((e: any) => e.nfc_claimed_at || e.verificationSource === 'supabase') ? (
                                          <Badge className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50 border border-emerald-100 font-black text-[9px] tracking-widest px-3 h-6 rounded-full flex items-center gap-1.5 shadow-sm">
                                            <ShieldCheck className="h-3 w-3" /> {group.every((e: any) => e.nfc_claimed_at) ? 'ALL VERIFIED' : 'PARTIAL VERIFIED'}
                                          </Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-slate-400 border-slate-200 font-black text-[9px] tracking-widest px-3 h-6 rounded-full">UNCLAIMED</Badge>
                                        )}
                                        {leadItem.editionType && groupingMode === 'product' && !isStreetCollector && (
                                          <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-black text-[9px] tracking-widest px-3 h-6 rounded-full uppercase">
                                            {leadItem.editionType}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <div className="pt-4 mt-2 border-t border-slate-50 flex items-center justify-between flex-shrink-0">
                                      <div className="flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5 text-slate-300" />
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                          {hasMultiple ? `Last: ${new Date(leadItem.purchaseDate).toLocaleDateString()}` : new Date(leadItem.purchaseDate).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <div className="h-7 w-7 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                                          <Eye className="h-4 w-4 text-slate-400 group-hover:text-white" />
                                        </div>
                                        {hasMultiple && (
                                          <div className="h-7 w-7 rounded-full bg-slate-50 flex items-center justify-center">
                                            <ChevronRight className="h-4 w-4 text-slate-400" />
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            </motion.div>
                          </motion.div>
                        );
                      })
                    ) : (
                      <div className="col-span-full py-20 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                        <Award className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <h4 className="text-lg font-black text-slate-900 tracking-tight">No Artworks Found</h4>
                        <p className="text-sm text-slate-400 font-medium">This collector hasn't acquired any authenticated pieces yet.</p>
                      </div>
                    )}
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
