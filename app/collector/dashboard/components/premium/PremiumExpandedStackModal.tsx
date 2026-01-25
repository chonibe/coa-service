"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { X, Award, Calendar, ShieldCheck } from "lucide-react";
import { Button, Card, Badge } from "@/components/ui"
;
;
;

interface PremiumExpandedStackModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: any[] | null;
  groupingMode: 'product' | 'artist';
}

export function PremiumExpandedStackModal({ isOpen, onClose, group, groupingMode }: PremiumExpandedStackModalProps) {
  if (!group) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-xl"
          onClick={onClose}
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
                  {groupingMode === 'product' ? group[0].name : group[0].vendorName}
                </h3>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">
                  {group.length} Editions in this Stack
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onClose}
                className="rounded-full h-12 w-12 p-0 hover:bg-slate-100"
              >
                <X className="h-6 w-6 text-slate-400" />
              </Button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {group.map((edition: any) => (
                  <Link key={edition.id} href={`/collector/artwork/${edition.lineItemId}`}>
                    <Card className="rounded-3xl border-none shadow-xl bg-white overflow-hidden hover:scale-[1.02] transition-transform cursor-pointer">
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
                          {(edition.nfc_claimed_at || edition.verificationSource === 'supabase') && <ShieldCheck className="h-4 w-4 text-emerald-500" />}
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
