"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button, Card, Badge } from "@/components/ui"
import { 
  ChevronLeft, ChevronRight, Award, 
  ShieldCheck, Calendar, ChevronRight as ChevronRightIcon 
} from "lucide-react";
import { VinylCrateStack } from "@/components/vinyl";
import { gsap, durations } from "@/lib/animations";
import { useGSAP } from "@gsap/react";

interface PremiumArtworkStackProps {
  group: any[];
  groupingMode: 'product' | 'artist';
  onExpand: (group: any[]) => void;
}

/**
 * PremiumArtworkStack
 * 
 * Enhanced with GSAP-powered vinyl record interactions:
 * - 3D tilt effect on hover (like holding a physical record)
 * - Smooth stack animations when cycling through items
 * - Momentum-based spring physics
 */
export function PremiumArtworkStack({ group, groupingMode, onExpand }: PremiumArtworkStackProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const count = group.length;
  const hasMultiple = count > 1;
  
  const displayGroup = [...group].sort((a, b) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime());
  const leadItem = displayGroup[activeIndex] || displayGroup[0];
  const isStreetCollector = leadItem.vendorName?.toLowerCase().includes('street collector') || leadItem.vendorName?.toLowerCase().includes('street-collector');

  // GSAP 3D tilt effect
  const quickTiltX = useRef<gsap.QuickToFunc | null>(null);
  const quickTiltY = useRef<gsap.QuickToFunc | null>(null);
  const quickScale = useRef<gsap.QuickToFunc | null>(null);

  useGSAP(() => {
    if (!cardRef.current) return;

    const card = cardRef.current;

    // Set perspective for 3D effect
    gsap.set(card, {
      transformPerspective: 1000,
      transformStyle: 'preserve-3d',
    });

    // Create quickTo functions for 60fps tilt
    quickTiltX.current = gsap.quickTo(card, 'rotateY', {
      duration: 0.4,
      ease: 'power2.out',
    });
    quickTiltY.current = gsap.quickTo(card, 'rotateX', {
      duration: 0.4,
      ease: 'power2.out',
    });
    quickScale.current = gsap.quickTo(card, 'scale', {
      duration: 0.3,
      ease: 'power2.out',
    });

    const handleMouseMove = (e: MouseEvent) => {
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const offsetX = (e.clientX - centerX) / (rect.width / 2);
      const offsetY = (e.clientY - centerY) / (rect.height / 2);
      
      quickTiltX.current?.(offsetX * 8);
      quickTiltY.current?.(-offsetY * 8);
    };

    const handleMouseEnter = () => {
      quickScale.current?.(1.02);
    };

    const handleMouseLeave = () => {
      quickTiltX.current?.(0);
      quickTiltY.current?.(0);
      quickScale.current?.(1);
    };

    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mousemove', handleMouseMove);
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, { dependencies: [] });

  const cycleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Animate card flip
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        rotateY: 10,
        duration: 0.15,
        ease: 'power2.in',
        onComplete: () => {
          setActiveIndex(prev => (prev + 1) % count);
          gsap.to(cardRef.current!, {
            rotateY: 0,
            duration: 0.25,
            ease: 'elastic.out(1, 0.5)',
          });
        }
      });
    } else {
      setActiveIndex(prev => (prev + 1) % count);
    }
  };

  const cyclePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Animate card flip in reverse
    if (cardRef.current) {
      gsap.to(cardRef.current, {
        rotateY: -10,
        duration: 0.15,
        ease: 'power2.in',
        onComplete: () => {
          setActiveIndex(prev => (prev - 1 + count) % count);
          gsap.to(cardRef.current!, {
            rotateY: 0,
            duration: 0.25,
            ease: 'elastic.out(1, 0.5)',
          });
        }
      });
    } else {
      setActiveIndex(prev => (prev - 1 + count) % count);
    }
  };

  const handleCardClick = (e: React.MouseEvent) => {
    if (hasMultiple) {
      e.preventDefault();
      onExpand(displayGroup);
    }
  };

  return (
    <motion.div 
      className="relative group h-[220px]"
      whileHover="hover"
      initial="initial"
    >
      {/* Visual Stack Layers with Animation - Enhanced with GSAP physics */}
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
              className="h-8 w-8 rounded-full p-0 shadow-lg pointer-events-auto hover:scale-110 transition-transform"
              onClick={cyclePrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="secondary" 
              size="sm" 
              className="h-8 w-8 rounded-full p-0 shadow-lg pointer-events-auto hover:scale-110 transition-transform"
              onClick={cycleNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </>
      )}

      <div
        ref={cardRef}
        className="h-full w-full relative will-change-transform"
        style={{ zIndex: 10 }}
      >
        <Link 
          href={`/collector/artwork/${leadItem.lineItemId}`} 
          className="block h-full"
          onClick={handleCardClick}
        >
          <Card className={`rounded-[2.5rem] border-none shadow-xl bg-white overflow-hidden group-hover:shadow-2xl transition-shadow duration-500 cursor-pointer h-full ${hasMultiple ? 'ring-1 ring-slate-100' : ''}`}>
            <div className="flex h-full">
              <div className="w-44 aspect-[4/5] bg-slate-50 relative overflow-hidden flex-shrink-0">
                <AnimatePresence mode="wait">
                  {leadItem.imgUrl ? (
                    <motion.img 
                      key={leadItem.id}
                      initial={{ opacity: 0, scale: 1.05 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      src={leadItem.imgUrl} 
                      alt={leadItem.name} 
                      className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700" 
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full bg-slate-100">
                      <Award className="h-12 w-12 text-slate-300" />
                    </div>
                  )}
                </AnimatePresence>
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
                <div className="h-7 w-7 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                  <ChevronRightIcon className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            </div>
          </div>
          </Card>
        </Link>
      </div>
    </motion.div>
  );
}
