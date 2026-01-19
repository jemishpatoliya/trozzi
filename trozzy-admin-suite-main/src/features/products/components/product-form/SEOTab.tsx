
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
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

import { TagInput } from "@/features/products/components/TagInput";
import { computeSeoScore } from "@/features/products/utils";
import type { ProductManagementFormValues } from "@/features/products/types";

export function SEOTab() {
  const { control } = useFormContext<ProductManagementFormValues>();

  const watchedSlug = useWatch({ control, name: "basic.slug" });
  const seoScore = computeSeoScore(watchedSlug ?? "");
  const metaTitle = useWatch({ control, name: "seo.metaTitle" });
  const metaDescription = useWatch({ control, name: "seo.metaDescription" });
  const productName = useWatch({ control, name: "basic.name" });

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="glass lg:col-span-2">
        <CardHeader>
          <CardTitle>SEO</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={control}
              name="seo.metaTitle"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Recommended up to 60 chars"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="seo.metaDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meta description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Recommended up to 160 chars"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={control}
            name="seo.metaKeywords"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Keywords</FormLabel>
                <FormControl>
                  <TagInput
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Add keywords"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="rounded-xl border bg-muted/10 p-4 space-y-2">
            <p className="font-medium">Search result preview</p>
            <div className="rounded-lg border bg-background p-3">
              <p className="text-primary font-medium truncate">
                {metaTitle || productName || "Product title"}
              </p>
              <p className="text-xs text-success truncate">
                example.com/{watchedSlug || "product"}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {metaDescription || "Meta description will appear here."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle>SEO Score</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Slug score</p>
            <p className="font-semibold">{seoScore}/100</p>
          </div>
          <Progress value={seoScore} />
          <div className="rounded-xl border bg-muted/10 p-4">
            <p className="font-medium">Guidelines</p>
            <p className="text-sm text-muted-foreground mt-1">
              Keep meta title within 60 chars and description within 160 chars.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
