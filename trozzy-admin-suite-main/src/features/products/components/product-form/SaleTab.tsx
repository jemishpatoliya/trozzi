
import { useMemo } from "react";
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

import { computeDiscount, formatMoney } from "@/features/products/utils";
import type { ProductManagementFormValues } from "@/features/products/types";

function msToParts(ms: number) {
  const s = Math.floor(ms / 1000);
  const days = Math.floor(s / 86400);
  const hours = Math.floor((s % 86400) / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  return { days, hours, minutes, seconds };
}

export function SaleTab() {
  const { control } = useFormContext<ProductManagementFormValues>();

  const countdownEnd = useWatch({ control, name: "salePage.countdownEnd" });
  const bannerText = useWatch({ control, name: "salePage.bannerText" });
  const pricingSelling = useWatch({ control, name: "pricing.sellingPrice" }) ?? 0;
  const pricingOriginal = useWatch({ control, name: "pricing.originalPrice" }) ?? 0;

  const saleCountdownMs = useMemo(() => {
    if (!countdownEnd) return 0;
    const ms = new Date(countdownEnd).getTime() - Date.now();
    return Math.max(0, ms);
  }, [countdownEnd]);

  const saleCountdownParts = useMemo(
    () => msToParts(saleCountdownMs),
    [saleCountdownMs]
  );

  const discount = useMemo(
    () => computeDiscount(pricingOriginal, pricingSelling),
    [pricingOriginal, pricingSelling]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="glass lg:col-span-2">
        <CardHeader>
          <CardTitle>Sale Page Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <FormField
            control={control}
            name="salePage.enabled"
            render={({ field }) => (
              <FormItem className="rounded-xl border bg-muted/10 p-4 flex flex-row items-center justify-between space-y-0">
                <div className="space-y-0.5">
                  <FormLabel className="text-base font-medium">
                    Enable sale page
                  </FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Creates a promotional sale landing experience
                  </p>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={control}
              name="salePage.bannerText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Banner text</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Limited Time Offer" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="salePage.priorityOrder"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Priority order</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
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

          <FormField
            control={control}
            name="salePage.countdownEnd"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Countdown end</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="rounded-xl border bg-muted/10 p-4 space-y-2">
            <p className="font-medium">Sale preview</p>
            <div className="rounded-lg border bg-background p-3">
              <p className="text-sm text-muted-foreground">Banner</p>
              <p className="text-xl font-bold">{bannerText || "—"}</p>
              <Separator className="my-2" />
              <p className="text-sm text-muted-foreground">Countdown</p>
              <p className="text-lg font-semibold">
                {saleCountdownMs === 0
                  ? "No active countdown"
                  : `${saleCountdownParts.days}d ${saleCountdownParts.hours}h ${saleCountdownParts.minutes}m ${saleCountdownParts.seconds}s`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Sale Impact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl border bg-muted/10 p-4">
            <p className="text-sm text-muted-foreground">Discount</p>
            <p className="text-3xl font-bold">{discount.percent.toFixed(1)}%</p>
          </div>
          <div className="rounded-xl border bg-muted/10 p-4">
            <p className="text-sm text-muted-foreground">Final price</p>
            <p className="text-3xl font-bold">{formatMoney(pricingSelling)}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
