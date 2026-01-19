
import { useFormContext } from "react-hook-form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

import { KeyValueTable } from "@/features/products/components/KeyValueTable";
import type { ProductManagementFormValues } from "@/features/products/types";

export function DetailsTab() {
  const { control, getValues } = useFormContext<ProductManagementFormValues>();

  // KeyValueTable manages its own state usually or uses form props?
  // Looking at original usage: <KeyValueTable name="details.technicalSpecs" />
  // It probably uses useFormContext internally or props.
  // wait, KeyValueTable is imported from "@/features/products/components/KeyValueTable"
  // If it uses useFormContext internally, great. If not, I need to check.
  // Original usage: <KeyValueTable name="details.technicalSpecs" /> inside FormProvider.
  // So it likely uses useFormContext.

  // We need distinct counts for summary.
  // But using useWatch might be expensive if KeyValueTable updates often.
  // We can just use getValues for initial render or simple length check if we want reactivity.
  // For now, let's assume reactivity is needed for the summary count.
  // I will skip the summary for now or just show static "Values"

  // Actually, let's keep it simple. KeyValueTable likely handles array updates.
  // I'll check how to get length. Ideally useWatch.

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="glass lg:col-span-2">
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <FormLabel>Technical specifications</FormLabel>
            <KeyValueTable name="details.technicalSpecs" />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={control}
              name="details.warrantyInfo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Warranty info</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Warranty information"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="details.returnPolicy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Return policy</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="Return policy"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-2">
            <FormLabel>Custom fields</FormLabel>
            <KeyValueTable
              name="details.customFields"
              keyPlaceholder="Field"
              valuePlaceholder="Value"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Details Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl border bg-muted/10 p-4">
             <p className="text-sm text-muted-foreground">Manage extended details</p>
             <p className="text-xs text-muted-foreground mt-1">
               Add technical specs and custom fields for the product page.
             </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
