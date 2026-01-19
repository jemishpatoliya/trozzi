import { Link, useParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useOrderQuery } from "@/features/storefront/queries";

export default function ShopOrderSuccessPage() {
  const { id } = useParams();
  const orderQuery = useOrderQuery(id);

  if (orderQuery.isLoading) return <div className="text-sm text-muted-foreground">Loading...</div>;

  if (orderQuery.error || !orderQuery.data) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">Order not found</p>
        <Button asChild variant="outline">
          <Link to="/shop">Back to shop</Link>
        </Button>
      </div>
    );
  }

  const o = orderQuery.data;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order placed</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground">Your order has been created in MongoDB.</p>
        <div className="text-sm">
          <p>
            <span className="text-muted-foreground">Order:</span> <span className="font-medium">{o.orderNumber}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Total:</span> <span className="font-medium">${o.total.toFixed(2)}</span>
          </p>
          <p>
            <span className="text-muted-foreground">Status:</span> <span className="font-medium">{o.status}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild>
            <Link to="/shop/products">Continue shopping</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/commerce/orders">Go to admin orders</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
