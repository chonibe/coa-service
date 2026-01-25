"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  ShoppingBag, ExternalLink, ChevronLeft, 
  ChevronRight, Award, ShieldCheck 
} from "lucide-react";
;
;
;
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

import { Card, Badge, Button } from "@/components/ui"
interface PremiumOrderCardProps {
  order: any;
  onExpandStack: (group: any[]) => void;
}

export function PremiumOrderCard({ order, onExpandStack }: PremiumOrderCardProps) {
  const [activeIndices, setActiveIndices] = useState<Record<string, number>>({});

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

  const groupedOrderItems = (order.order_line_items_v2 || order.lineItems || []).reduce((acc: any, item: any) => {
    const key = item.product_id || item.productId || item.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <Card className="rounded-[2rem] border-none shadow-xl bg-white overflow-hidden hover:shadow-2xl transition-all group">
      <div className="flex flex-col md:flex-row">
        <div className="md:w-64 bg-slate-50 border-r border-slate-100 p-8 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h4 className="text-xl font-black text-slate-900 tracking-tight">#{order.order_number || order.orderNumber}</h4>
              <div className="flex gap-1.5">
                <Badge className={`${(order.financial_status || order.financialStatus) === 'paid' ? 'bg-emerald-500' : 'bg-amber-500'} border-none text-[9px] font-black uppercase tracking-widest h-5`}>
                  {order.financial_status || order.financialStatus || 'pending'}
                </Badge>
                <Badge className={`${(order.fulfillment_status || order.fulfillmentStatus) === 'fulfilled' ? 'bg-blue-500' : 'bg-slate-400'} border-none text-[9px] font-black uppercase tracking-widest h-5`}>
                  {order.fulfillment_status || order.fulfillmentStatus || 'pending'}
                </Badge>
              </div>
            </div>
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{new Date(order.processed_at || order.processedAt).toLocaleDateString()}</p>
          </div>
          <div className="mt-8">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total</p>
            <p className="text-2xl font-black text-slate-900">{formatCurrency(order.total_price || order.totalPrice, order.currency_code || 'USD')}</p>
            <Button variant="outline" size="sm" className="mt-4 w-full rounded-xl border-slate-200 font-bold text-xs h-10 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all">
              Full Details <ExternalLink className="h-3 w-3 ml-2" />
            </Button>
          </div>
        </div>
        <div className="flex-1 p-8">
          <div className="space-y-4">
            {Object.values(groupedOrderItems).map((group: any) => {
              const count = group.length;
              const hasMultiple = count > 1;
              const groupId = `order-${order.id}-${group[0].product_id || group[0].productId || group[0].name}`;
              const activeIndex = activeIndices[groupId] || 0;
              const leadItem = group[activeIndex] || group[0];

              return (
                <motion.div 
                  key={groupId} 
                  className="relative group/stack"
                  whileHover="hover"
                  initial="initial"
                  onClick={() => hasMultiple && onExpandStack(group.map((li: any) => ({
                    ...li,
                    purchaseDate: order.processed_at || order.processedAt,
                    vendorName: li.vendor_name || li.vendorName,
                    imgUrl: li.img_url || li.imgUrl,
                    editionNumber: li.edition_number || li.editionNumber
                  })))}
                >
                  {hasMultiple && (
                    <>
                      <motion.div 
                        className="absolute inset-0 bg-slate-100 border border-slate-200 rounded-2xl shadow-sm"
                        style={{ zIndex: 1 }}
                        variants={{ hover: { x: 15, y: -8, rotate: 4, opacity: 1 } }}
                        initial={{ x: 6, y: -3, rotate: 1.5, opacity: 0.4 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                      />
                      <motion.div 
                        className="absolute inset-0 bg-slate-50 border border-slate-200 rounded-2xl shadow-md"
                        style={{ zIndex: 2 }}
                        variants={{ hover: { x: 8, y: -4, rotate: 2, opacity: 1 } }}
                        initial={{ x: 3, y: -1.5, rotate: 0.5, opacity: 0.6 }}
                        transition={{ type: "spring", stiffness: 200, damping: 20 }}
                      />
                      <motion.div 
                        className="absolute -top-2 -right-2 z-[60] h-6 w-6 bg-slate-900 text-white rounded-full flex items-center justify-center font-black text-[10px] shadow-lg border-2 border-white"
                        variants={{ hover: { scale: 1.2, rotate: 12, x: 5, y: -3 } }}
                      >
                        {count}
                      </motion.div>
                      <div className="absolute inset-y-0 -left-4 -right-4 flex items-center justify-between opacity-0 group-hover/stack:opacity-100 transition-opacity z-[70] pointer-events-none">
                        <Button variant="secondary" size="sm" className="h-6 w-6 rounded-full p-0 shadow-lg pointer-events-auto hover:scale-110" onClick={(e) => cyclePrev(e, groupId, count)}>
                          <ChevronLeft className="h-3 w-3" />
                        </Button>
                        <Button variant="secondary" size="sm" className="h-6 w-6 rounded-full p-0 shadow-lg pointer-events-auto hover:scale-110" onClick={(e) => cycleNext(e, groupId, count)}>
                          <ChevronRight className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  )}
                  
                  <motion.div className="relative" style={{ zIndex: 10 }} variants={{ hover: { y: -2 } }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>
                    <div className={`flex items-center gap-5 p-3 rounded-2xl bg-white border border-transparent hover:border-slate-100 hover:bg-slate-50 transition-all group/item cursor-pointer ${leadItem.status !== 'active' && leadItem.status ? 'opacity-60 grayscale-[0.5]' : ''}`}>
                      <div className="h-16 w-16 bg-slate-100 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg shadow-slate-200/50 relative border border-slate-100">
                        {(leadItem.img_url || leadItem.imgUrl) ? (
                          <img key={leadItem.id} src={leadItem.img_url || leadItem.imgUrl} alt={leadItem.name} className="h-full w-full object-cover group-hover/item:scale-110 transition-transform duration-500" />
                        ) : (
                          <Award className="h-6 w-6 text-slate-300 absolute inset-0 m-auto" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h5 className={`font-black text-slate-900 tracking-tight leading-tight mb-1 ${leadItem.status !== 'active' && leadItem.status ? 'line-through text-slate-400' : ''}`}>{leadItem.name}</h5>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{leadItem.vendor_name || leadItem.vendorName || 'Street Collector'}</span>
                              <span className="h-1 w-1 rounded-full bg-slate-300" />
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Qty {leadItem.quantity || 1}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {hasMultiple ? (
                              <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[9px] rounded-lg h-6 px-2">
                                {count} EDITIONS
                              </Badge>
                            ) : (leadItem.edition_number || leadItem.editionNumber) ? (
                              <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 border-none font-black text-[10px] rounded-lg h-6 px-2.5">
                                EDITION #{(leadItem.edition_number || leadItem.editionNumber)}{(leadItem.edition_total || leadItem.editionTotal) ? `/${(leadItem.edition_total || leadItem.editionTotal)}` : ''}
                              </Badge>
                            ) : null}
                            {(leadItem.nfc_claimed_at || leadItem.nfcClaimedAt) && <ShieldCheck className="h-4 w-4 text-emerald-500 drop-shadow-sm" />}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}
