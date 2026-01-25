"use client";

import { useState, useEffect } from "react";
;
;
;
;
import { Loader2, Search, Users, ShoppingBag, Award, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { Card, CardContent, CardHeader, CardTitle, CardDescription, Input, Button, Badge } from "@/components/ui"
interface Collector {
  user_email: string;
  user_id: string | null;
  shopify_customer_id: string | null;
  display_name: string;
  display_phone: string | null;
  total_orders: number;
  total_spent: number;
  total_editions: number;
  last_purchase_date: string | null;
  avatar_url: string | null;
  is_kickstarter_backer: boolean;
}

export default function CollectorsDirectoryPage() {
  const [collectors, setCollectors] = useState<Collector[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);

  const fetchCollectors = async (query = "") => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/collectors?search=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error("Failed to fetch collectors");
      const data = await res.json();
      setCollectors(data.collectors || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollectors();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCollectors(search);
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Collector Directory</h1>
          <p className="text-muted-foreground">
            Browse and manage enriched collector profiles across all platforms.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm h-8 px-3">
            <Users className="h-4 w-4 mr-2" />
            {total} Total Collectors
          </Badge>
        </div>
      </div>

      <Card className="mb-8">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {isLoading && collectors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Loading enriched profiles...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {collectors.map((collector) => (
            <Link 
              key={collector.user_email} 
              href={`/admin/collectors/${collector.shopify_customer_id || collector.user_id || collector.user_email}`}
              className="block group"
            >
              <Card className="h-full hover:shadow-md transition-all duration-200 border-slate-200/60 group-hover:border-primary/40">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border shadow-sm">
                      <AvatarImage src={collector.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/5 text-primary font-bold">
                        {collector.display_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base truncate group-hover:text-primary transition-colors">
                        {collector.display_name}
                      </CardTitle>
                      <CardDescription className="truncate text-xs">
                        {collector.user_email}
                      </CardDescription>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-50">
                    <div className="text-center">
                      <span className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">Orders</span>
                      <div className="flex items-center justify-center gap-1 text-sm font-semibold">
                        <ShoppingBag className="h-3 w-3 text-blue-500" />
                        {collector.total_orders}
                      </div>
                    </div>
                    <div className="text-center border-x">
                      <span className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">Editions</span>
                      <div className="flex items-center justify-center gap-1 text-sm font-semibold">
                        <Award className="h-3 w-3 text-amber-500" />
                        {collector.total_editions}
                      </div>
                    </div>
                    <div className="text-center">
                      <span className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">Spent</span>
                      <div className="text-sm font-semibold">
                        {formatCurrency(collector.total_spent, 'USD')}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {collector.user_id ? (
                        <Badge variant="default" className="text-[10px] h-4 py-0">Registered</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[10px] h-4 py-0">Guest</Badge>
                      )}
                      {collector.is_kickstarter_backer && (
                        <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200 text-[10px] h-4 py-0 font-bold uppercase">
                          Kickstarter
                        </Badge>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      Last: {collector.last_purchase_date ? new Date(collector.last_purchase_date).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {!isLoading && collectors.length === 0 && (
        <div className="text-center py-20 bg-muted/20 rounded-xl border border-dashed">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No collectors found</h3>
          <p className="text-muted-foreground">Try adjusting your search criteria.</p>
        </div>
      )}
    </div>
  );
}

