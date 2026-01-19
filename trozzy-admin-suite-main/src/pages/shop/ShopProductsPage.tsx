import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { usePublicProductsQuery } from "@/features/storefront/queries";

export default function ShopProductsPage() {
  const productsQuery = usePublicProductsQuery();
  const [q, setQ] = useState("");

  const products = productsQuery.data ?? [];

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return products;
    return products.filter((p) => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s));
  }, [products, q]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} items</p>
        </div>
        <div className="flex items-center gap-2">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products" className="w-72" />
          <Button asChild variant="outline">
            <Link to="/commerce/products/new">Add in admin</Link>
          </Button>
        </div>
      </div>

      {productsQuery.isLoading ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : productsQuery.error ? (
        <div className="text-sm text-destructive">Failed to load products.</div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((p) => (
            <Link key={p.id} to={`/shop/products/${p.slug}`} className="group">
              <Card className="overflow-hidden">
                <div className="aspect-square bg-muted/30">
                  {p.image ? <img src={p.image} alt={p.name} className="h-full w-full object-cover" /> : null}
                </div>
                <CardContent className="space-y-1 p-4">
                  <p className="font-medium line-clamp-1 group-hover:underline">{p.name}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{p.category || "Uncategorized"}</p>
                  <p className="text-sm font-semibold">${p.price.toFixed(2)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
