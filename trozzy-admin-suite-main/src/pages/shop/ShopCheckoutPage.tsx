import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { useToast } from "@/hooks/use-toast";

import { useCart } from "@/features/storefront/cart";
import { useCreateOrderMutation } from "@/features/storefront/queries";

export default function ShopCheckoutPage() {
  const cart = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();

  const createOrderMutation = useCreateOrderMutation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [country, setCountry] = useState("IN");

  const canSubmit = useMemo(() => {
    if (!cart.lines.length) return false;
    if (!name.trim() || !email.trim() || !line1.trim() || !city.trim() || !state.trim() || !postalCode.trim() || !country.trim()) {
      return false;
    }
    return true;
  }, [cart.lines.length, name, email, line1, city, state, postalCode, country]);

  const submit = async () => {
    if (!canSubmit) {
      toast({ title: "Missing fields", description: "Please fill all required fields.", variant: "destructive" });
      return;
    }

    try {
      const res = await createOrderMutation.mutateAsync({
        currency: "INR",
        items: cart.lines.map((l) => ({
          productId: l.productId,
          name: l.name,
          price: l.price,
          quantity: l.quantity,
          image: l.image,
        })),
        customer: { name: name.trim(), email: email.trim(), phone: phone.trim() || undefined },
        address: {
          line1: line1.trim(),
          line2: line2.trim() || undefined,
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          country: country.trim(),
        },
      });

      cart.clear();
      toast({ title: "Order placed", description: `Order ${res.orderNumber} created.` });
      navigate(`/shop/order/${res.id}`, { replace: true });
    } catch (e: any) {
      toast({ title: "Checkout failed", description: e?.message ?? "Please try again", variant: "destructive" });
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Checkout</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Address line 1 *</Label>
                <Input value={line1} onChange={(e) => setLine1(e.target.value)} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Address line 2</Label>
                <Input value={line2} onChange={(e) => setLine2(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>City *</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>State *</Label>
                <Input value={state} onChange={(e) => setState(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Postal code *</Label>
                <Input value={postalCode} onChange={(e) => setPostalCode(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Country *</Label>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} />
              </div>
            </div>

            <Button onClick={submit} disabled={!canSubmit || createOrderMutation.isPending}>
              {createOrderMutation.isPending ? "Placing order..." : "Place order"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Items</span>
            <span className="font-medium">{cart.count}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">${cart.subtotal.toFixed(2)}</span>
          </div>
          <p className="text-xs text-muted-foreground">Payment is mocked for now. Order is stored in MongoDB.</p>
        </CardContent>
      </Card>
    </div>
  );
}
