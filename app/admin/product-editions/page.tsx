"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface LineItem {
  id: string;
  product_id: string;
  order_id: string;
  order_name: string;
  created_at: string;
  edition_number: string | null;
  edition_total: number | null;
  status: string;
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ProductEditionsPage() {
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const pageSize = 10;

  const fetchLineItems = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from("order_line_items_v2")
        .select("*", { count: "exact" });

      // Apply search
      if (searchQuery) {
        query = query.or(`order_name.ilike.%${searchQuery}%,order_id.ilike.%${searchQuery}%`);
      }

      // Apply sorting and pagination
      const start = (currentPage - 1) * pageSize;
      const end = start + pageSize - 1;

      const { data, error, count } = await query
        .order(sortBy, { ascending: sortOrder === "asc" })
        .range(start, end);

      if (error) throw error;

      setLineItems(data || []);
      setTotalItems(count || 0);
      setTotalPages(Math.ceil((count || 0) / pageSize));
    } catch (error) {
      console.error('Error fetching line items:', error);
      setLineItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLineItems();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, searchQuery, sortBy, sortOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLineItems();
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Product Editions</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search by order name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Created Date</SelectItem>
                <SelectItem value="order_name">Order Name</SelectItem>
                <SelectItem value="edition_number">Edition Number</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
            <Button type="button" variant="outline" onClick={() => setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"))}>
              {sortOrder === "asc" ? "↑" : "↓"}
            </Button>
            <Button type="submit">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
          <div className="rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Order
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Created
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Edition
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Status
                  </th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-4">
                      <Link 
                        href={`/admin/orders/${item.order_id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {item.order_name || item.order_id}
                      </Link>
                    </td>
                    <td className="p-4">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                    <td className="p-4">
                      {item.edition_number ? (
                        <Badge variant="outline">{item.edition_number}</Badge>
                      ) : (
                        'Not assigned'
                      )}
                    </td>
                    <td className="p-4">
                      <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
                        {item.status || 'active'}
                      </Badge>
                    </td>
                    <td className="p-4">
                      <Link
                        href={`/admin/product-editions/${item.product_id}`}
                        className="text-primary hover:underline"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <span className="flex items-center text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 