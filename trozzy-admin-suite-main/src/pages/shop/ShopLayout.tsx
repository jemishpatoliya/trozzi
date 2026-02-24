import { Link, Outlet } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { useCart } from "@/features/storefront/cart";

export default function ShopLayout() {
  const cart = useCart();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Link to="/shop" className="text-sm font-semibold tracking-tight">
              Trozzi Store
            </Link>
            <Badge variant="outline">Preview</Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/shop/products">Products</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link to="/shop/cart">Cart ({cart.count})</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/commerce/products">Admin</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} Trozzi
        </div>
      </footer>
    </div>
  );
}
