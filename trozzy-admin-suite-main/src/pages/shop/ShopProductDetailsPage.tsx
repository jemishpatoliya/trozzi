import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { useCart } from "@/features/storefront/cart";
import { usePublicProductBySlugQuery } from "@/features/storefront/queries";

export default function ShopProductDetailsPage() {
  const { slug } = useParams();
  const productQuery = usePublicProductBySlugQuery(slug);
  const cart = useCart();

  const product = productQuery.data;

  const [activeImage, setActiveImage] = useState<string | null>(null);

  const imageUrls = useMemo(() => {
    const urls = product ? [product.image, ...(product.galleryImages ?? [])].filter(Boolean) : [];
    return Array.from(new Set(urls));
  }, [product]);

  const selected = useMemo(() => {
    if (!imageUrls.length) return null;
    if (activeImage && imageUrls.includes(activeImage)) return activeImage;
    return imageUrls[0];
  }, [activeImage, imageUrls]);

  if (productQuery.isLoading) return <div className="text-sm text-muted-foreground">Loading...</div>;

  if (productQuery.error || !product) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">Product not found</p>
        <Button asChild variant="outline">
          <Link to="/shop/products">Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{product.name}</h1>
          <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/shop/cart">Go to cart</Link>
        </Button>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border bg-muted/20">
            {selected ? <img src={selected} alt={product.name} className="h-[420px] w-full object-cover" /> : null}
          </div>
          {imageUrls.length > 1 ? (
            <div className="grid grid-cols-5 gap-2">
              {imageUrls.slice(0, 10).map((url) => (
                <button
                  key={url}
                  type="button"
                  onClick={() => setActiveImage(url)}
                  className={`overflow-hidden rounded-lg border transition ${
                    selected === url ? "border-primary" : "border-border hover:border-muted-foreground/40"
                  }`}
                >
                  <img src={url} alt={product.name} className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {product.brand ? <Badge variant="outline">{product.brand}</Badge> : null}
            {product.category ? <Badge variant="secondary">{product.category}</Badge> : null}
            {product.badge ? <Badge variant="outline">{product.badge}</Badge> : null}
          </div>

          <div className="space-y-1">
            <p className="text-3xl font-bold">${product.price.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">Stock: {product.stock}</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => cart.add(product, 1)} disabled={product.stock <= 0}>
              Add to cart
            </Button>
            <Button asChild variant="outline">
              <Link to="/shop/products">Continue shopping</Link>
            </Button>
          </div>

          <Separator />

          <Card>
            <CardContent className="space-y-2 p-4">
              <p className="text-sm font-medium">Description</p>
              <p className="text-sm text-muted-foreground">{product.description || "No description"}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
