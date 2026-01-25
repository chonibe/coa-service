"use client";

import { motion } from "framer-motion";
import { 
  ShieldCheck, Award, Mail, Phone, Calendar, 
  TrendingUp, Package, Globe, Database, Info,
  Map as MapIcon, User
} from "lucide-react";
;
;
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui";
import { InkOGatchi } from "../ink-o-gatchi";

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui"
interface PremiumProfileHeroProps {
  profile: any;
  avatar?: any;
}

export function PremiumProfileHero({ profile, avatar }: PremiumProfileHeroProps) {
  const pii = profile.pii_sources || {};
  const sources = [
    { key: 'profile', name: 'Authorized Profile', data: pii.profile, icon: ShieldCheck, color: 'bg-blue-500' },
    { key: 'warehouse', name: 'Verified Shipping', data: pii.warehouse, icon: Package, color: 'bg-amber-500' },
    { key: 'shopify', name: 'Transactional Data', data: pii.shopify, icon: Globe, color: 'bg-green-500' },
  ].filter(s => s.data);

  return (
    <div className="space-y-6">
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
                {avatar ? (
                  <div className="h-32 w-32 border-[6px] border-white shadow-2xl shadow-slate-900/10 rounded-full bg-white relative z-10 flex items-center justify-center overflow-hidden">
                    <InkOGatchi 
                      stage={avatar.evolutionStage} 
                      equippedItems={{
                        hat: avatar.equippedItems?.hat?.asset_url,
                        eyes: avatar.equippedItems?.eyes?.asset_url,
                        body: avatar.equippedItems?.body?.asset_url,
                        accessory: avatar.equippedItems?.accessory?.asset_url,
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
                {avatar && (
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-black px-3 py-1 rounded-full">
                    LVL {avatar.level}
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
                  {profile.user_email || profile.email}
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
                    {profile.user_created_at || profile.created_at ? new Date(profile.user_created_at || profile.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' }) : 'Jan 2024'}
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

      {sources.length > 0 && (
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
                        <div className={`h-8 w-8 rounded-lg ${source.color} flex items-center justify-center shadow-lg shadow-slate-200/50`}>
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
      )}
    </div>
  );
}
