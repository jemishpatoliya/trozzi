import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { useCategoriesQuery, useProductManagementQuery } from "@/features/products/queries";
import { computeDiscount, formatMoney } from "@/features/products/utils";

import { ArrowLeft, ExternalLink } from "lucide-react";

export default function ProductPreviewPage() {
  const { id } = useParams();

  const categoriesQuery = useCategoriesQuery();
  const productQuery = useProductManagementQuery(id);

  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);

  const product = productQuery.data;

  const selectedImage = useMemo(() => {
    if (!product) return null;
    const images = product.media.images;
    if (!images.length) return null;

    const preferred = selectedImageId
      ? images.find((img) => img.id === selectedImageId)
      : null;

    if (preferred) return preferred;

    const thumb = product.media.thumbnailId ? images.find((img) => img.id === product.media.thumbnailId) : null;
    return thumb ?? images[0];
  }, [product, selectedImageId]);

  const categoryLabels = useMemo(() => {
    const categories = categoriesQuery.data ?? [];
    const byId = new Map(categories.map((c) => [c.id, c] as const));
    const ids = product?.basic.categoryIds ?? [];
    return ids.map((cid) => byId.get(cid)?.name ?? cid);
  }, [categoriesQuery.data, product?.basic.categoryIds]);

  const original = product?.pricing.originalPrice ?? 0;
  const selling = product?.pricing.sellingPrice ?? 0;
  const discount = useMemo(() => computeDiscount(original, selling), [original, selling]);

  if (productQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-6xl px-4 py-8">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-40" />
            <Skeleton className="h-10 w-40" />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Skeleton className="h-[420px] w-full" />
            <Skeleton className="h-[420px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (productQuery.error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto w-full max-w-3xl px-4 py-12">
          <Card>
            <CardHeader>
              <CardTitle>Preview unavailable</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">This product could not be loaded. It may have been deleted.</p>
              <div className="flex flex-wrap gap-2">
                <Button asChild variant="outline">
                  <Link to="/commerce/products">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Products
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const images = product.media.images;

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Button asChild variant="ghost" size="sm">
              <Link to="/commerce/products" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Link>
            </Button>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">Preview</p>
              <p className="truncate text-xs text-muted-foreground">{product.basic.slug}</p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to={`/commerce/products/${id}`} className="gap-2">
              <ExternalLink className="h-4 w-4" />
              Edit product
            </Link>
          </Button>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border bg-muted/20">
              {selectedImage ? (
                <img
                  src={selectedImage.url}
                  alt={selectedImage.alt ?? product.basic.name}
                  className="h-[420px] w-full object-cover"
                />
              ) : (
                <div className="flex h-[420px] w-full items-center justify-center text-sm text-muted-foreground">No images</div>
              )}
            </div>

            {images.length > 1 ? (
              <div className="grid grid-cols-5 gap-2">
                {images.slice(0, 10).map((img) => {
                  const isActive = selectedImage?.id === img.id;
                  return (
                    <button
                      key={img.id}
                      type="button"
                      onClick={() => setSelectedImageId(img.id)}
                      className={`overflow-hidden rounded-lg border transition ${
                        isActive ? "border-primary" : "border-border hover:border-muted-foreground/40"
                      }`}
                    >
                      <img src={img.url} alt={img.alt ?? product.basic.name} className="aspect-square w-full object-cover" />
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold tracking-tight">{product.basic.name || "Untitled product"}</h1>
                <Badge variant="outline">{product.basic.status}</Badge>
                <Badge variant="secondary">{product.basic.visibility}</Badge>
              </div>

              {categoryLabels.length ? (
                <div className="flex flex-wrap gap-2">
                  {categoryLabels.map((c) => (
                    <Badge key={c} variant="outline">
                      {c}
                    </Badge>
                  ))}
                </div>
              ) : null}

              {product.basic.shortDescription ? (
                <p className="text-muted-foreground">{product.basic.shortDescription}</p>
              ) : null}
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex flex-wrap items-end gap-3">
                <p className="text-3xl font-bold">{formatMoney(selling)}</p>
                {original > selling ? (
                  <p className="text-sm text-muted-foreground line-through">{formatMoney(original)}</p>
                ) : null}
                {discount.percent > 0 ? (
                  <Badge variant="secondary">Save {discount.percent}%</Badge>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground">SKU: {product.inventory.sku || "—"}</p>
              <p className="text-sm text-muted-foreground">Stock: {product.inventory.stockQuantity}</p>
            </div>

            <Separator />

            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                {product.basic.descriptionHtml ? (
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: product.basic.descriptionHtml }}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">No description provided.</p>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Shipping</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-muted-foreground">Weight: {product.shipping.weightKg} kg</p>
                  <p className="text-muted-foreground">
                    Dimensions: {product.shipping.dimensionsCm.length} × {product.shipping.dimensionsCm.width} × {product.shipping.dimensionsCm.height} cm
                  </p>
                  <p className="text-muted-foreground">Class: {product.shipping.shippingClass || "—"}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>SEO</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-muted-foreground">Title: {product.seo.metaTitle || "—"}</p>
                  <p className="text-muted-foreground">Description: {product.seo.metaDescription || "—"}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
