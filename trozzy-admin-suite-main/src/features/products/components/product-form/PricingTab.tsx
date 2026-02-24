
import { useMemo } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  computeDiscount,
  formatMoney,
  getTaxRate,
} from "@/features/products/utils";
import type { ProductManagementFormValues } from "@/features/products/types";

export function PricingTab() {
  const { control } = useFormContext<ProductManagementFormValues>();

  const originalPrice = useWatch({ control, name: "pricing.originalPrice" }) ?? 0;
  const sellingPrice = useWatch({ control, name: "pricing.sellingPrice" }) ?? 0;
  const taxClass = useWatch({ control, name: "pricing.taxClass" }) ?? "gst";
  const taxRatePercent = useWatch({ control, name: "pricing.taxRatePercent" });

  const discount = useMemo(
    () => computeDiscount(originalPrice, sellingPrice),
    [originalPrice, sellingPrice]
  );
  const taxRate = useMemo(() => getTaxRate(taxClass, taxRatePercent), [taxClass, taxRatePercent]);
  const taxAmount = useMemo(() => sellingPrice * taxRate, [sellingPrice, taxRate]);
  const totalInclTax = useMemo(
    () => sellingPrice + taxAmount,
    [sellingPrice, taxAmount]
  );

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="glass lg:col-span-2">
        <CardHeader>
          <CardTitle>Pricing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-4">
            <FormField
              control={control}
              name="pricing.originalPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Original Price (MRP) *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      min={0}
                      step={0.01}
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
              name="pricing.sellingPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Selling Price *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0.00"
                      min={0}
                      step={0.01}
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
              name="pricing.taxClass"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax class</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Tax" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="gst">GST</SelectItem>
                      <SelectItem value="vat">VAT</SelectItem>
                      <SelectItem value="none">None</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="pricing.taxRatePercent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tax rate (%)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      min={0}
                      max={100}
                      step={0.01}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const next = e.target.value;
                        field.onChange(next === "" ? undefined : Number(next));
                      }}
                      disabled={taxClass === "none"}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="rounded-xl border bg-muted/10 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Auto discount calculation</p>
                <p className="text-sm text-muted-foreground">
                  Based on MRP vs selling price
                </p>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">{discount.percent.toFixed(1)}%</Badge>
                <Badge variant="outline">{formatMoney(discount.amount)}</Badge>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-muted/10 p-4 space-y-2">
            <p className="font-medium">Price preview</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border bg-background p-3">
                <p className="text-sm text-muted-foreground">
                  Selling (excl. tax)
                </p>
                <p className="text-2xl font-bold">
                  {formatMoney(sellingPrice)}
                </p>
              </div>
              <div className="rounded-lg border bg-background p-3">
                <p className="text-sm text-muted-foreground">
                  Total (incl. tax)
                </p>
                <p className="text-2xl font-bold">
                  {formatMoney(totalInclTax)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Tax: {formatMoney(taxAmount)} (
                  {(taxRate * 100).toFixed(0)}%)
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Pricing Guardrails</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl border bg-muted/10 p-4">
            <p className="font-medium">Validation</p>
            <p className="text-sm text-muted-foreground mt-1">
              Selling price cannot exceed original price.
            </p>
          </div>
          <div className="rounded-xl border bg-muted/10 p-4">
            <p className="font-medium">Recommendation</p>
            <p className="text-sm text-muted-foreground mt-1">
              Keep discount under 70% for better trust.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
