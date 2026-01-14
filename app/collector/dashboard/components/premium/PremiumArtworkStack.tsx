"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ChevronLeft, ChevronRight, Award, 
  ShieldCheck, Calendar, ChevronRight as ChevronRightIcon 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PremiumArtworkStackProps {
  group: any[];
  groupingMode: 'product' | 'artist';
  onExpand: (group: any[]) => void;
}

export function PremiumArtworkStack({ group, groupingMode, onExpand }: PremiumArtworkStackProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const count = group.length;
  const hasMultiple = count > 1;
  
  const displayGroup = [...group].sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
  const leadItem = displayGroup[activeIndex] || displayGroup[0];
  const isStreetCollector = leadItem.vendorName?.toLowerCase().includes('street collector') || leadItem.vendorName?.toLowerCase().includes('street-collector');

  const cycleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex(prev => (prev + 1) % count);
  };

  const cyclePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveIndex(prev => (prev - 1 + count) % count);
  };

  return (
    <motion.div 
      className="relative group h-[220px]"
      whileHover="hover"
      initial="initial"
      onClick={() => hasMultiple && onExpand(displayGroup)}
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
              onClick={cyclePrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              className="h-8 w-8 rounded-full p-0 shadow-lg pointer-events-auto hover:scale-110"
              onClick={cycleNext}
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
                      ? `EDITIONS: ${group.length}` 
                      : leadItem.editionNumber ? `#${leadItem.editionNumber}${leadItem.editionTotal ? '/' + leadItem.editionTotal : ''}` : 'PIECE')}
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
                <div className="h-7 w-7 rounded-full bg-slate-50 flex items-center justify-center">
                  <ChevronRightIcon className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}
