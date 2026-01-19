
import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Sparkles, Palette } from "lucide-react";
import { useFormContext, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

import { TagInput } from "@/features/products/components/TagInput";
import { generateVariantOverrides, formatMoney } from "@/features/products/utils";
import type { ProductManagementFormValues } from "@/features/products/types";

type SizeGuideIndexResponse = { keys: string[] };
type SizeGuideDoc = { category: string; columns: Array<{ key: string; label: string }>; rows: Array<Record<string, string>> };

async function requestJson<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const token = localStorage.getItem("token");
  const res = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      msg = data?.message ?? msg;
    } catch {
    }
    throw new Error(msg);
  }

  return (await res.json()) as T;
}

export function AttributesTab() {
  const { control, getValues, setValue } = useFormContext<ProductManagementFormValues>();
  const { toast } = useToast();

  const sets = useWatch({ control, name: "attributes.sets" }) ?? [];
  const variants = useWatch({ control, name: "attributes.variants" }) ?? [];
  const startPrice = useWatch({ control, name: "pricing.sellingPrice" }) ?? 0;

  // Local state for the color picker inputs (keyed by set index)
  const [colorInputs, setColorInputs] = useState<Record<number, { hex: string; name: string }>>({});

  const [sizeGuideKeys, setSizeGuideKeys] = useState<string[]>([]);
  const [sizeGuideLoadError, setSizeGuideLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const data = await requestJson<SizeGuideIndexResponse>("/api/size-guides");
        if (!cancelled) setSizeGuideKeys(Array.isArray(data?.keys) ? data.keys : []);
      } catch (e: any) {
        if (!cancelled) {
          setSizeGuideKeys([]);
          setSizeGuideLoadError(String(e?.message || e));
        }
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const quickAddValues = (index: number, newVals: string[]) => {
    const current = getValues(`attributes.sets.${index}.values`) || [];
    const merged = Array.from(new Set([...current, ...newVals]));
    setValue(`attributes.sets.${index}.values`, merged, { shouldDirty: true, shouldValidate: true });
  };

  const getSuggestions = (name: string) => {
    const n = name.toLowerCase();
    if (n.includes("size")) return ["XS", "S", "M", "L", "XL", "XXL"];
    if (n.includes("color") || n.includes("colour")) return ["Red", "Blue", "Black", "White", "Green"];
    if (n.includes("material")) return ["Cotton", "Polyester", "Wool", "Leather"];
    return [];
  };

  const isColorAttribute = (name: string) => {
    const n = name.toLowerCase();
    return n.includes("color") || n.includes("colour");
  };

  const isSizeGuideAttribute = (name: string) => {
    const n = name.toLowerCase();
    return n.includes("size") && n.includes("guide");
  };

  const sizeGuideSetIndex = useMemo(() => sets.findIndex((s: any) => isSizeGuideAttribute(String(s?.name ?? ""))), [sets]);
  const sizeSetIndex = useMemo(() => sets.findIndex((s: any) => String(s?.name ?? "").toLowerCase() === "size"), [sets]);

  const selectedSizeGuideKey = useMemo(() => {
    if (sizeGuideSetIndex < 0) return "";
    const vals = getValues(`attributes.sets.${sizeGuideSetIndex}.values`) || [];
    return vals && vals.length ? String(vals[0] || "") : "";
  }, [getValues, sizeGuideSetIndex, sets]);

  const setSelectedSizeGuideKey = (key: string) => {
    if (sizeGuideSetIndex < 0) return;
    const v = String(key || "").trim();
    setValue(`attributes.sets.${sizeGuideSetIndex}.values`, v ? [v] : [], { shouldDirty: true, shouldValidate: true });
  };

  const applyGuideSizes = async () => {
    if (!selectedSizeGuideKey) {
      toast({ title: "Select Size Guide", description: "Please select a size guide key first.", variant: "destructive" });
      return;
    }
    if (sizeSetIndex < 0) {
      toast({ title: "Size option missing", description: "Add a 'Size' option first.", variant: "destructive" });
      return;
    }

    try {
      const guide = await requestJson<SizeGuideDoc>(`/api/size-guides/${encodeURIComponent(selectedSizeGuideKey)}`);
      const rows = Array.isArray(guide?.rows) ? guide.rows : [];
      const sizes = rows
        .map((r) => String(r?.size ?? "").trim())
        .filter((s) => s.length > 0);

      if (sizes.length === 0) {
        toast({ title: "No sizes in guide", description: "Add 'size' values in the guide rows and save.", variant: "destructive" });
        return;
      }

      const current = getValues(`attributes.sets.${sizeSetIndex}.values`) || [];
      const merged = Array.from(new Set([...(current || []), ...sizes]));
      setValue(`attributes.sets.${sizeSetIndex}.values`, merged, { shouldDirty: true, shouldValidate: true });
      toast({ title: "Sizes applied", description: `Added ${sizes.length} sizes from '${selectedSizeGuideKey}'.` });
    } catch (e: any) {
      toast({ title: "Failed to apply sizes", description: String(e?.message || e), variant: "destructive" });
    }
  };

  const addSet = (name: string) => {
    const guide = isSizeGuideAttribute(name);
    const next = [
      ...getValues("attributes.sets"),
      {
        id: `attr-${Date.now()}`,
        name,
        values: [],
        useForVariants: guide ? false : true,
      },
    ];
    setValue("attributes.sets", next, { shouldDirty: true });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="glass lg:col-span-2">
        <CardHeader>
          <CardTitle>Product Options</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Options</p>
                <p className="text-sm text-muted-foreground">
                  Add options like Size or Color to generate variants.
                </p>
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Option
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => addSet("Size")}>
                    Size
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addSet("Size Guide")}>
                    Size Guide
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addSet("Color")}>
                    Color
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addSet("Material")}>
                    Material
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addSet("")}>
                    Custom...
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-4">
              {sets.map((s, idx) => {
                const suggestions = getSuggestions(s.name);
                const isColor = isColorAttribute(s.name);
                const isGuide = isSizeGuideAttribute(s.name);
                
                return (
                  <div
                    key={s.id}
                    className="rounded-xl border bg-muted/10 p-4 space-y-4"
                  >
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2 md:col-span-2">
                        <Label>Option Name</Label>
                        <Input
                          value={s.name}
                          onChange={(e) => {
                            const next = [...getValues("attributes.sets")];
                            next[idx] = { ...next[idx], name: e.target.value };
                            setValue("attributes.sets", next, { shouldDirty: true });
                          }}
                          placeholder="e.g. Size, Color"
                        />
                      </div>
                      <div className="flex items-end justify-between gap-4">
                        <div className="space-y-1">
                          <Label>Use for variants</Label>
                          <div>
                            <Switch
                              checked={s.useForVariants}
                              onCheckedChange={(v) => {
                                const next = [...getValues("attributes.sets")];
                                next[idx] = { ...next[idx], useForVariants: v };
                                setValue("attributes.sets", next, {
                                  shouldDirty: true,
                                });
                              }}
                              disabled={isGuide}
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            const next = getValues("attributes.sets").filter(
                              (_, i) => i !== idx
                            );
                            setValue("attributes.sets", next, { shouldDirty: true });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Option Values</Label>
                      {isGuide && (
                        <div className="grid gap-2 md:grid-cols-3">
                          <div className="md:col-span-2 space-y-2">
                            <Select value={selectedSizeGuideKey || undefined} onValueChange={(v) => setSelectedSizeGuideKey(v)}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select size guide (e.g. cap)" />
                              </SelectTrigger>
                              <SelectContent>
                                {(sizeGuideKeys || []).map((k) => (
                                  <SelectItem key={k} value={k}>{k}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Input
                              value={selectedSizeGuideKey}
                              onChange={(e) => setSelectedSizeGuideKey(e.target.value)}
                              placeholder="Or type new guide key (e.g. cap)"
                              list={`size-guide-keys-${idx}`}
                            />
                            <datalist id={`size-guide-keys-${idx}`}>
                              {(sizeGuideKeys || []).map((k) => (
                                <option key={k} value={k} />
                              ))}
                            </datalist>
                            {sizeGuideLoadError ? (
                              <div className="text-xs text-destructive">{sizeGuideLoadError}</div>
                            ) : null}
                          </div>
                          <Button type="button" variant="outline" onClick={applyGuideSizes}>
                            Apply Sizes
                          </Button>
                        </div>
                      )}
                      <TagInput
                        value={s.values}
                        onChange={(vals) => {
                          const next = [...getValues("attributes.sets")];
                          next[idx] = { ...next[idx], values: vals };
                          setValue("attributes.sets", next, { shouldDirty: true });
                        }}
                        placeholder={isColor ? "Type color name or hex" : "Type value & hit Enter"}
                      />
                      
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {suggestions.length > 0 && (
                          <>
                            <span className="text-xs text-muted-foreground self-center mr-1">
                              Quick add:
                            </span>
                            {suggestions.map((sug) => (
                              <Badge
                                key={sug}
                                variant="outline"
                                className="cursor-pointer hover:bg-accent"
                                onClick={() => quickAddValues(idx, [sug])}
                              >
                                {sug}
                              </Badge>
                            ))}
                          </>
                        )}

                        {isColor && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className="h-6 text-xs gap-1 ml-2">
                                <Palette className="h-3 w-3" />
                                Custom Color
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-64 p-3" align="start">
                              <div className="space-y-3">
                                <h4 className="font-medium leading-none">Pick Custom Color</h4>
                                <div className="flex gap-3">
                                  <div className="shrink-0">
                                    <input
                                      type="color"
                                      className="h-9 w-9 p-0 border-0 rounded overflow-hidden cursor-pointer"
                                      value={colorInputs[idx]?.hex ?? "#000000"}
                                      onChange={(e) => {
                                        const hex = e.target.value;
                                        setColorInputs(prev => ({
                                          ...prev,
                                          [idx]: { hex, name: hex } // Auto-set name to hex initially
                                        }));
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-2 flex-1">
                                    <Input
                                      placeholder="Color name or Hex"
                                      className="h-9"
                                      value={colorInputs[idx]?.name ?? ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setColorInputs(prev => ({
                                          ...prev,
                                          [idx]: { ...prev[idx] || { hex: "#000000" }, name: val }
                                        }));
                                      }}
                                    />
                                  </div>
                                </div>
                                <Button
                                  size="sm"
                                  className="w-full"
                                  disabled={!colorInputs[idx]?.name}
                                  onClick={() => {
                                    const val = colorInputs[idx]?.name;
                                    if (val) {
                                      quickAddValues(idx, [val]);
                                      // Reset
                                      setColorInputs(prev => ({
                                        ...prev,
                                        [idx]: { hex: "#000000", name: "" }
                                      }));
                                    }
                                  }}
                                >
                                  Add Color
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {sets.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed rounded-xl text-muted-foreground">
                  No options added. Click "Add Option" to start.
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border bg-muted/10 p-4 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium">Variants</p>
                <p className="text-sm text-muted-foreground">
                  Review and customize generated variants.
                </p>
              </div>
              <Button
                type="button"
                className="gap-2"
                onClick={() => {
                  const currentSets = getValues("attributes.sets");
                  const existing = getValues("attributes.variants");
                  const next = generateVariantOverrides(currentSets, existing);
                  setValue("attributes.variants", next, { shouldDirty: true });
                  toast({
                    title: "Variants generated",
                    description: `Generated ${next.length} variants based on your options.`,
                  });
                }}
              >
                <Sparkles className="h-4 w-4" />
                Generate / Update Variants
              </Button>
            </div>

            <div className="space-y-3">
              {variants.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No variants. Add options with values and click Generate.
                </p>
              ) : (
                variants.map((v, idx) => (
                  <div
                    key={v.id}
                    className="rounded-xl border bg-background p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{v.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {Object.entries(v.attributes)
                            .map(([k, val]) => `${k}: ${val}`)
                            .join(" · ")}
                        </p>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-3 lg:w-[34rem]">
                        <div className="space-y-1">
                          <Label className="text-xs">SKU</Label>
                          <Input
                            className="h-8"
                            value={v.skuOverride ?? ""}
                            onChange={(e) => {
                              const next = [...getValues("attributes.variants")];
                              next[idx] = {
                                ...next[idx],
                                skuOverride: e.target.value,
                              };
                              setValue("attributes.variants", next, {
                                shouldDirty: true,
                              });
                            }}
                            placeholder="Custom SKU"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Price</Label>
                          <Input
                            className="h-8"
                            type="number"
                            value={v.priceOverride ?? ""}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const next = [...getValues("attributes.variants")];
                              next[idx] = {
                                ...next[idx],
                                priceOverride:
                                  raw === "" ? undefined : Number(raw),
                              };
                              setValue("attributes.variants", next, {
                                shouldDirty: true,
                              });
                            }}
                            placeholder={formatMoney(startPrice)}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Stock</Label>
                          <Input
                            className="h-8"
                            type="number"
                            value={v.stockOverride ?? ""}
                            onChange={(e) => {
                              const raw = e.target.value;
                              const next = [...getValues("attributes.variants")];
                              next[idx] = {
                                ...next[idx],
                                stockOverride:
                                  raw === "" ? undefined : Number(raw),
                              };
                              setValue("attributes.variants", next, {
                                shouldDirty: true,
                              });
                            }}
                            placeholder="Stock"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Variant Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="rounded-xl border bg-muted/10 p-4">
            <p className="text-sm text-muted-foreground">Total Variants</p>
            <p className="text-3xl font-bold">{variants.length}</p>
          </div>
          <div className="rounded-xl border bg-muted/10 p-4">
            <p className="text-sm text-muted-foreground">Base Price</p>
            <p className="text-xl font-semibold">{formatMoney(startPrice)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Applied unless overridden per variant.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
