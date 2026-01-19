
import { useEffect, useMemo, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
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
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

import type { ProductManagementFormValues } from "@/features/products/types";

function nowIso() {
  return new Date().toISOString();
}

function compactDateTime(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function InventoryTab() {
  const { control, getValues, setValue } = useFormContext<ProductManagementFormValues>();
  const [liveStock, setLiveStock] = useState(false);

  const stockQuantity = useWatch({ control, name: "inventory.stockQuantity" }) ?? 0;
  const lowStockThreshold = useWatch({ control, name: "inventory.lowStockThreshold" }) ?? 0;
  // We also need to watch history to update the table
  const history = useWatch({ control, name: "inventory.history" }) ?? [];

  const pushInventoryHistory = (delta: number, reason: string, user = "Admin User") => {
    const current = getValues("inventory.stockQuantity");
    const next = Math.max(0, current + delta);

    const currentHistory = getValues("inventory.history") || [];
    const entry = {
      id: `h-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      at: nowIso(),
      user,
      reason,
      delta,
      resultingStock: next,
    };

    setValue("inventory.stockQuantity", next, { shouldDirty: true });
    setValue("inventory.history", [entry, ...currentHistory].slice(0, 50), { shouldDirty: true });
  };

  useEffect(() => {
    if (!liveStock) return;

    const interval = window.setInterval(() => {
      const roll = Math.random();
      if (roll < 0.7) return;
      const delta = roll < 0.85 ? -1 : 5;
      pushInventoryHistory(
        delta,
        delta < 0 ? "Live order simulation" : "Live restock simulation",
        "System"
      );
    }, 1600);

    return () => window.clearInterval(interval);
  }, [liveStock]);

  const inventoryHistoryColumns = useMemo(
    () => [
      {
        key: "at",
        header: "Time",
        render: (row: any) => (
          <div className="min-w-[10rem]">
            <p className="text-sm font-medium">{compactDateTime(row.at)}</p>
            <p className="text-xs text-muted-foreground">{row.user}</p>
          </div>
        ),
      },
      {
        key: "reason",
        header: "Event",
        render: (row: any) => (
          <p className="text-sm font-medium truncate max-w-[18rem]">{row.reason}</p>
        ),
      },
      {
        key: "delta",
        header: "Delta",
        render: (row: any) => (
          <Badge variant={row.delta < 0 ? "destructive" : "secondary"}>
            {row.delta > 0 ? `+${row.delta}` : row.delta}
          </Badge>
        ),
      },
      {
        key: "resultingStock",
        header: "Stock",
        render: (row: any) => <span className="font-medium">{row.resultingStock}</span>,
      },
    ],
    []
  );

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="glass lg:col-span-2">
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={control}
              name="inventory.sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU *</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. WH-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name="inventory.lowStockThreshold"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Low stock threshold</FormLabel>
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

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={control}
              name="inventory.stockQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Quantity</FormLabel>
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

            <FormField
              control={control}
              name="inventory.stockStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Stock status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="in_stock">In Stock</SelectItem>
                      <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                      <SelectItem value="backorder">Backorder</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <FormField
              control={control}
              name="inventory.allowBackorders"
              render={({ field }) => (
                <FormItem className="rounded-xl border bg-muted/10 p-4 flex flex-row items-center justify-between space-y-0">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base font-medium">
                      Allow backorders
                    </FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Continue selling even when out of stock
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="rounded-xl border bg-muted/10 p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">Real-time simulation</p>
                <p className="text-sm text-muted-foreground">
                  Auto updates stock + history
                </p>
              </div>
              <Switch checked={liveStock} onCheckedChange={setLiveStock} />
            </div>
          </div>

          <div className="rounded-xl border bg-muted/10 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Quick stock actions</p>
                <p className="text-sm text-muted-foreground">
                  Logs to inventory history
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => pushInventoryHistory(+10, "Manual restock +10")}
                >
                  +10
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => pushInventoryHistory(+50, "Manual restock +50")}
                >
                  +50
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => pushInventoryHistory(-1, "Manual adjustment -1")}
                >
                  -1
                </Button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Inventory History</Label>
            <DataTable
              data={history}
              columns={inventoryHistoryColumns as any}
              emptyMessage="No inventory history yet"
              className="bg-transparent"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Inventory Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl border bg-muted/10 p-4">
            <p className="text-sm text-muted-foreground">Stock</p>
            <p className="text-3xl font-bold">{stockQuantity}</p>
          </div>
          <div className="rounded-xl border bg-muted/10 p-4">
            <p className="text-sm text-muted-foreground">Low stock threshold</p>
            <p className="text-xl font-semibold">{lowStockThreshold}</p>
            {stockQuantity <= lowStockThreshold ? (
              <p className="text-sm text-warning mt-1">Low stock warning</p>
            ) : (
              <p className="text-sm text-success mt-1">Healthy</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
