
import { useFormContext, useWatch } from "react-hook-form";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormField, FormItem, FormMessage } from "@/components/ui/form";
import { MediaManager } from "@/features/products/components/MediaManager";
import type { ProductManagementFormValues } from "@/features/products/types";

export function MediaTab() {
  const { control, setValue, formState } = useFormContext<ProductManagementFormValues>();

  const images = useWatch({ control, name: "media.images" }) ?? [];
  const thumbnailId = useWatch({ control, name: "media.thumbnailId" });

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle>Media</CardTitle>
      </CardHeader>
      <CardContent>
        {/* We can't easily use FormField here because MediaManager handles two fields at once.
            We'll monitor errors for 'media.images' specifically.
        */}
        <MediaManager
          images={images}
          thumbnailId={thumbnailId}
          onChange={(next) => {
            setValue("media.images", next.images, { shouldDirty: true, shouldValidate: true });
            setValue("media.thumbnailId", next.thumbnailId, { shouldDirty: true });
          }}
        />
        {formState.errors.media?.images && (
          <p className="text-sm font-medium text-destructive mt-2">
            {formState.errors.media.images.message}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
