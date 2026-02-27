
import { useFormContext, useWatch } from "react-hook-form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { formatMoney } from "@/features/products/utils";
import type { ProductManagementFormValues } from "@/features/products/types";

export function ShippingTab() {
  const { control } = useFormContext<ProductManagementFormValues>();

  const weight = useWatch({ control, name: "shipping.weightKg" }) ?? 0;
  const weightGm = Math.round(Number(weight || 0) * 1000);
  const dimensions = useWatch({ control, name: "shipping.dimensionsCm" }) ?? {
    length: 0,
    width: 0,
    height: 0,
  };
  const freeShipping = useWatch({ control, name: "shipping.freeShipping" });
  const codAvailable = useWatch({ control, name: "shipping.codAvailable" });
  const shippingCharge = useWatch({ control, name: "shipping.shippingCharge" }) ?? 0;

  const volumetric = (dimensions.length * dimensions.width * dimensions.height) / 5000;
  const chargeable = Math.max(weight, volumetric);
  const calculatedCost = Math.max(4.99, chargeable * 1.2);
  const cost = freeShipping ? 0 : (Number(shippingCharge) > 0 ? Number(shippingCharge) : calculatedCost);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="glass lg:col-span-2">
        <CardHeader>
          <CardTitle>Shipping</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={control}
              name="shipping.weightKg"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight (gm)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={Number.isFinite(weightGm) ? weightGm : 0}
                      onChange={(e) => {
                        const raw = e.target.value;
                        const gm = raw === "" ? 0 : Number(raw);
                        const kg = Number.isFinite(gm) ? gm / 1000 : 0;
                        field.onChange(kg);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="shipping.shippingClass"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipping class</FormLabel>
                  <FormControl>
                    <Input placeholder="Standard" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="shipping.codCharge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>COD charge</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      disabled={!codAvailable}
                      {...field}
                      onChange={(e) => {
                        const raw = e.target.value;
                        field.onChange(raw === "" ? 0 : Number(raw));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="shipping.shippingCharge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shipping charge</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      disabled={freeShipping}
                      {...field}
                      onChange={(e) => {
                        const raw = e.target.value;
                        field.onChange(raw === "" ? 0 : Number(raw));
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-2">
            <Label>Dimensions (cm)</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              <FormField
                control={control}
                name="shipping.dimensionsCm.length"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Length"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="shipping.dimensionsCm.width"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Width"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="shipping.dimensionsCm.height"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Height"
                        min={0}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={control}
              name="shipping.freeShipping"
              render={({ field }) => (
                <FormItem className="rounded-xl border bg-muted/10 p-4 flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base font-medium">Free shipping</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Override shipping cost to 0
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="shipping.codAvailable"
              render={({ field }) => (
                <FormItem className="rounded-xl border bg-muted/10 p-4 flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base font-medium">COD available</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Enable cash on delivery
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Shipping Cost (mock)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl border bg-muted/10 p-4">
            <p className="text-sm text-muted-foreground">Chargeable weight</p>
            <p className="text-2xl font-bold">{chargeable.toFixed(2)} kg</p>
            <p className="text-xs text-muted-foreground mt-1">
              Based on max(actual weight, volumetric weight).
            </p>
          </div>
          <div className="rounded-xl border bg-muted/10 p-4">
            <p className="text-sm text-muted-foreground">Estimated shipping</p>
            <p className="text-2xl font-bold">{formatMoney(cost)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
