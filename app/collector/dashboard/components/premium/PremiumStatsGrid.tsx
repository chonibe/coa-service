"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Award, DollarSign, ShoppingBag, LayoutGrid } from "lucide-react";

interface StatItem {
  label: string;
  value: string | number;
  icon: any;
  color: string;
  bg: string;
}

interface PremiumStatsGridProps {
  stats: StatItem[];
}

export function PremiumStatsGrid({ stats }: PremiumStatsGridProps) {
  return (
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
  );
}
