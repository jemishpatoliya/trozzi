
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
import { Skeleton } from "@/components/ui/skeleton";

import { MultiSelectPopover } from "@/features/products/components/MultiSelectPopover";
import type { ProductManagementFormValues } from "@/features/products/types";

interface MarketingTabProps {
  productsLoading: boolean;
  productOptions: {
    value: string;
    label: string;
    description?: string;
    indent: number;
  }[];
}

export function MarketingTab({
  productsLoading,
  productOptions,
}: MarketingTabProps) {
  const { control } = useFormContext<ProductManagementFormValues>();

  const scheduleEnabled = useWatch({ control, name: "marketing.scheduleSale.enabled" });
  const relatedIds = useWatch({ control, name: "marketing.relatedProductIds" }) ?? [];
  const upsellIds = useWatch({ control, name: "marketing.upsellProductIds" }) ?? [];

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="glass lg:col-span-2">
        <CardHeader>
          <CardTitle>Marketing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={control}
              name="marketing.featured"
              render={({ field }) => (
                <FormItem className="rounded-xl border bg-muted/10 p-4 flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base font-medium">Featured</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Show in featured sections
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
              name="marketing.saleBadge"
              render={({ field }) => (
                <FormItem className="rounded-xl border bg-muted/10 p-4 flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base font-medium">Sale badge</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Show "On sale" badge
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          <div className="rounded-xl border bg-muted/10 p-4 space-y-3">
            <FormField
              control={control}
              name="marketing.scheduleSale.enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base font-medium">
                      Scheduled sale
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Enable time-limited sale window
                    </p>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            {scheduleEnabled && (
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={control}
                  name="marketing.scheduleSale.startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start date</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="marketing.scheduleSale.endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End date</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>

          <FormField
            control={control}
            name="marketing.couponEligible"
            render={({ field }) => (
              <FormItem className="rounded-xl border bg-muted/10 p-4 flex flex-row items-center justify-between space-y-0">
                <div className="space-y-0.5">
                  <FormLabel className="text-base font-medium">
                    Coupon eligible
                  </FormLabel>
                  <p className="text-sm text-muted-foreground">
                    Allow applying coupons
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
            name="marketing.relatedProductIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Related products</FormLabel>
                {productsLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <FormControl>
                    <MultiSelectPopover
                      value={field.value}
                      onChange={field.onChange}
                      options={productOptions}
                      placeholder="Select related products"
                    />
                  </FormControl>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={control}
            name="marketing.upsellProductIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Upsell products</FormLabel>
                {productsLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <FormControl>
                    <MultiSelectPopover
                      value={field.value}
                      onChange={field.onChange}
                      options={productOptions}
                      placeholder="Select upsell products"
                    />
                  </FormControl>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Marketing Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl border bg-muted/10 p-4">
            <p className="text-sm text-muted-foreground">Related products</p>
            <p className="text-3xl font-bold">{relatedIds.length}</p>
          </div>
          <div className="rounded-xl border bg-muted/10 p-4">
            <p className="text-sm text-muted-foreground">Upsells</p>
            <p className="text-3xl font-bold">{upsellIds.length}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
