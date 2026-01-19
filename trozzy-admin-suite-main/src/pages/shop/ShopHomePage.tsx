import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { usePublicProductsQuery } from "@/features/storefront/queries";

export default function ShopHomePage() {
  const productsQuery = usePublicProductsQuery();

  const featured = (productsQuery.data ?? []).filter((p) => p.featured).slice(0, 4);

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Shop</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This is the public user-side storefront. It loads products from MongoDB via the same API used by the admin panel.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button asChild>
                <Link to="/shop/products">Browse products</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/commerce/products/new">Create in admin</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>What shows here?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>- Only products with status <span className="font-medium text-foreground">active</span></p>
            <p>- And visibility <span className="font-medium text-foreground">public</span></p>
            <p>- Everything is coming from MongoDB</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Featured</h2>
          <Button asChild variant="ghost" size="sm">
            <Link to="/shop/products">View all</Link>
          </Button>
        </div>

        {productsQuery.isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : featured.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
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
        ) : (
          <div className="text-sm text-muted-foreground">No featured products yet. Create/publish one from admin.</div>
        )}
      </div>
    </div>
  );
}
