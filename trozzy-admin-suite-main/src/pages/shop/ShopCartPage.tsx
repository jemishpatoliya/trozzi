import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

import { useCart } from "@/features/storefront/cart";

export default function ShopCartPage() {
  const cart = useCart();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Cart</h1>
          <p className="text-sm text-muted-foreground">{cart.count} items</p>
        </div>
        <Button asChild variant="outline">
          <Link to="/shop/products">Continue shopping</Link>
        </Button>
      </div>

      {cart.lines.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">Your cart is empty.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {cart.lines.map((l) => (
              <Card key={l.productId}>
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
                  <div className="h-16 w-16 overflow-hidden rounded bg-muted/30">
                    {l.image ? <img src={l.image} alt={l.name} className="h-full w-full object-cover" /> : null}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium line-clamp-1">{l.name}</p>
                    <p className="text-xs text-muted-foreground">${l.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      className="w-20"
                      type="number"
                      min={1}
                      max={99}
                      value={l.quantity}
                      onChange={(e) => cart.setQuantity(l.productId, Number(e.target.value))}
                    />
                    <Button variant="ghost" onClick={() => cart.remove(l.productId)}>
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardContent className="space-y-3 p-4">
              <p className="text-sm font-medium">Summary</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">${cart.subtotal.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex flex-wrap gap-2">
                <Button className="w-full" onClick={() => navigate("/shop/checkout")}>
                  Checkout
                </Button>
                <Button className="w-full" variant="outline" onClick={cart.clear}>
                  Clear cart
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
