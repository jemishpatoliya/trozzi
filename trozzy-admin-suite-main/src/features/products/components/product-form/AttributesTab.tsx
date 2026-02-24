
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

const resolveApiBaseUrl = () => {
  const envAny = (import.meta as any)?.env || {};
  const raw = String(envAny.VITE_API_URL || envAny.VITE_API_BASE_URL || "").trim();
  const fallback = "http://localhost:5050/api";
  const base = raw || fallback;
  return base.replace(/\/+$/, "");
};

const API_BASE_URL = resolveApiBaseUrl();

export function AttributesTab() {
  const { control, getValues, setValue } = useFormContext<ProductManagementFormValues>();
  const { toast } = useToast();

  const sets = useWatch({ control, name: "attributes.sets" }) ?? [];
  const variants = useWatch({ control, name: "attributes.variants" }) ?? [];
  const startPrice = useWatch({ control, name: "pricing.sellingPrice" }) ?? 0;
  const colorVariants = useWatch({ control, name: "colorVariants" }) ?? [];

  // Local state for the color picker inputs (keyed by set index)
  const [colorInputs, setColorInputs] = useState<Record<number, { hex: string; name: string }>>({});
  const [sizeGuideImageUploading, setSizeGuideImageUploading] = useState(false);

  const sizeGuideImageUrl = useWatch({ control, name: "attributes.sizeGuideImageUrl" }) ?? "";

  const isColorAttribute = (name: string) => {
    const n = name.toLowerCase();
    return n.includes("color") || n.includes("colour");
  };

  const isSizeGuideAttribute = (name: string) => {
    const n = name.toLowerCase();
    return n.includes("size") && n.includes("guide");
  };

  const uploadSizeGuideImage = async (file: File) => {
    setSizeGuideImageUploading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please sign in to upload an image.");

      const form = new FormData();
      form.append("image", file);

      const res = await fetch(`${API_BASE_URL}/upload/admin-image?folder=size-guides`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      if (!res.ok) {
        let msg = `Upload failed (${res.status})`;
        try {
          const text = await res.text();
          if (text) msg = text.slice(0, 200);
        } catch {
        }
        throw new Error(msg);
      }

      const data: any = await res.json();
      const url = String(data?.url || "").trim();
      if (!url) throw new Error(String(data?.message || "Upload failed"));

      setValue("attributes.sizeGuideImageUrl", url, { shouldDirty: true, shouldValidate: true });
      toast({ title: "Uploaded", description: "Size guide image uploaded." });
    } catch (e: any) {
      toast({ title: "Upload failed", description: String(e?.message || e), variant: "destructive" });
    } finally {
      setSizeGuideImageUploading(false);
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

  const uploadVariantImage = async (file: File) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Please sign in to upload an image.");

      const form = new FormData();
      form.append("image", file);

      const res = await fetch(`${API_BASE_URL}/upload/admin-image?folder=product-variants`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      });

      if (!res.ok) {
        let msg = `Upload failed (${res.status})`;
        try {
          const text = await res.text();
          if (text) msg = text.slice(0, 200);
        } catch {
        }
        throw new Error(msg);
      }

      const data: any = await res.json();
      const url = String(data?.url || "").trim();
      if (!url) throw new Error(String(data?.message || "Upload failed"));
      return url;
    } catch (e: any) {
      toast({ title: "Upload failed", description: String(e?.message || e), variant: "destructive" });
      return "";
    }
  };

  const normalizeColorKey = (value: string) => {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");
  };

  const colorSet = useMemo(() => {
    return sets.find((s) => isColorAttribute(String(s?.name || "")));
  }, [sets]);

  const derivedColors = useMemo(() => {
    const vals = Array.isArray(colorSet?.values) ? colorSet.values : [];
    return vals
      .map((v) => String(v))
      .map((v) => v.trim())
      .filter((v) => v.length > 0);
  }, [colorSet]);

  useEffect(() => {
    if (derivedColors.length === 0) return;
    const existing = Array.isArray(getValues("colorVariants")) ? (getValues("colorVariants") as any[]) : [];
    const existingByKey = new Map(existing.map((v) => [String(v?.color || ""), v]));
    const next = derivedColors.map((c) => {
      const colorName = c;
      const key = normalizeColorKey(colorName) || colorName;
      const prev = existingByKey.get(key) || existing.find((v) => String(v?.colorName || "").trim() === colorName);
      return {
        color: key,
        colorName,
        colorCode: String(prev?.colorCode || "") || "#000000",
        name: prev?.name,
        images: Array.isArray(prev?.images) ? prev.images : [],
        price: prev?.price,
        stock: prev?.stock,
        sku: prev?.sku,
      };
    });
    setValue("colorVariants", next, { shouldDirty: true, shouldValidate: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derivedColors.join("|")]);

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
                const isColor = isColorAttribute(String(s?.name || ""));
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
                            <div className="rounded-lg border bg-background p-3 space-y-2">
                              <Label className="text-xs">Size Guide Image</Label>
                              {sizeGuideImageUrl ? (
                                <div className="space-y-2">
                                  <div className="rounded-md bg-muted/40 p-2 flex items-center justify-center">
                                    <img src={sizeGuideImageUrl} alt="Size guide" className="max-h-40 w-auto object-contain" />
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      disabled={sizeGuideImageUploading}
                                      onClick={() => setValue("attributes.sizeGuideImageUrl", "", { shouldDirty: true, shouldValidate: true })}
                                    >
                                      Remove
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <Input
                                  type="file"
                                  accept="image/*"
                                  disabled={sizeGuideImageUploading}
                                  onChange={(e) => {
                                    const f = e.currentTarget.files?.[0];
                                    if (f) void uploadSizeGuideImage(f);
                                    e.currentTarget.value = "";
                                  }}
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      {!isGuide && (
                        <TagInput
                          value={s.values}
                          onChange={(vals) => {
                            const next = [...getValues("attributes.sets")];
                            next[idx] = { ...next[idx], values: vals };
                            setValue("attributes.sets", next, { shouldDirty: true });
                          }}
                          placeholder={isColor ? "Type color name or hex" : "Type value & hit Enter"}
                        />
                      )}

                      {isColor && (
                        <div className="flex flex-wrap items-center gap-2 pt-1">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className="h-6 text-xs gap-1">
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
                                        setColorInputs((prev) => ({
                                          ...prev,
                                          [idx]: { hex, name: prev[idx]?.name ?? "" },
                                        }));
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-2 flex-1">
                                    <Input
                                      placeholder="Color Name"
                                      className="h-9"
                                      value={colorInputs[idx]?.name ?? ""}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setColorInputs((prev) => ({
                                          ...prev,
                                          [idx]: { ...(prev[idx] || { hex: "#000000" }), name: val },
                                        }));
                                      }}
                                    />
                                    <Input
                                      placeholder="#RRGGBB"
                                      className="h-9"
                                      value={colorInputs[idx]?.hex ?? "#000000"}
                                      onChange={(e) => {
                                        const hex = e.target.value;
                                        setColorInputs((prev) => ({
                                          ...prev,
                                          [idx]: { ...(prev[idx] || { name: "" }), hex },
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
                                    const nameRaw = String(colorInputs[idx]?.name || "").trim();
                                    const hexRaw = String(colorInputs[idx]?.hex || "").trim() || "#000000";
                                    if (!nameRaw) return;

                                    const key = normalizeColorKey(nameRaw) || nameRaw;

                                    const current = getValues(`attributes.sets.${idx}.values`) || [];
                                    const merged = Array.from(new Set([...(current || []), nameRaw]));
                                    setValue(`attributes.sets.${idx}.values`, merged, { shouldDirty: true, shouldValidate: true });

                                    const existing = Array.isArray(getValues("colorVariants")) ? (getValues("colorVariants") as any[]) : [];
                                    const foundIndex = existing.findIndex(
                                      (v) => String(v?.color || "") === key || String(v?.colorName || "").trim() === nameRaw
                                    );

                                    const nextVariants = [...existing];
                                    if (foundIndex >= 0) {
                                      nextVariants[foundIndex] = {
                                        ...nextVariants[foundIndex],
                                        color: key,
                                        colorName: nameRaw,
                                        colorCode: hexRaw,
                                      };
                                    } else {
                                      nextVariants.push({
                                        color: key,
                                        colorName: nameRaw,
                                        colorCode: hexRaw,
                                        images: [],
                                      });
                                    }
                                    setValue("colorVariants", nextVariants, { shouldDirty: true, shouldValidate: true });

                                    setColorInputs((prev) => ({
                                      ...prev,
                                      [idx]: { hex: "#000000", name: "" },
                                    }));
                                  }}
                                >
                                  Add Color
                                </Button>
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      )}
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

          {false && (
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
          )}

          {derivedColors.length > 0 && (
            <div className="rounded-xl border bg-muted/10 p-4 space-y-3">
              <div>
                <p className="font-medium">Color Variants</p>
                <p className="text-sm text-muted-foreground">
                  Set per-color product name, SKU and images.
                </p>
              </div>

              <div className="space-y-3">
                {(Array.isArray(colorVariants) ? colorVariants : []).map((cv: any, idx: number) => (
                  <div key={String(cv?.color || idx)} className="rounded-xl border bg-background p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-4 w-4 rounded-full border"
                            style={{ backgroundColor: String(cv?.colorCode || "#000000") }}
                          />
                          <p className="font-medium truncate">{String(cv?.colorName || cv?.color || "Color")}</p>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">Key: {String(cv?.color || "")}</p>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          const nextSets = [...(getValues("attributes.sets") as any[])];
                          const setIndex = nextSets.findIndex((s) => isColorAttribute(String(s?.name || "")));
                          if (setIndex >= 0) {
                            const colorName = String(cv?.colorName || "").trim();
                            const colorKey = normalizeColorKey(colorName || String(cv?.color || ""));
                            const values = Array.isArray(nextSets[setIndex]?.values) ? nextSets[setIndex].values : [];

                            nextSets[setIndex] = {
                              ...nextSets[setIndex],
                              values: values.filter((v: any) => {
                                const s = String(v ?? '').trim();
                                if (!s) return false;
                                const k = normalizeColorKey(s);
                                return k !== colorKey;
                              }),
                            };
                            setValue("attributes.sets", nextSets, { shouldDirty: true, shouldValidate: true });
                          }

                          const existingVariants = Array.isArray(getValues("colorVariants")) ? (getValues("colorVariants") as any[]) : [];
                          const targetName = String(cv?.colorName || "").trim();
                          const targetKey = normalizeColorKey(targetName || String(cv?.color || ""));

                          const nextVariants = existingVariants.filter((v) => {
                            const vName = String(v?.colorName || '').trim();
                            const vKey = normalizeColorKey(vName || String(v?.color || ''));
                            return vKey !== targetKey;
                          });

                          setValue("colorVariants", nextVariants, { shouldDirty: true, shouldValidate: true });
                        }}
                        title="Delete color variant"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="space-y-1 md:col-span-2">
                        <Label className="text-xs">Color Name</Label>
                        <Input
                          className="h-8"
                          value={String(cv?.colorName ?? "")}
                          onChange={(e) => {
                            const nextName = String(e.target.value ?? "");
                            const prevName = String(cv?.colorName ?? "");
                            const prevKey = normalizeColorKey(prevName || String(cv?.color || ""));
                            const nextKey = normalizeColorKey(nextName);

                            const next = [...(getValues("colorVariants") as any[])];
                            next[idx] = {
                              ...next[idx],
                              colorName: nextName,
                              ...(nextKey ? { color: nextKey } : {}),
                            };
                            setValue("colorVariants", next, { shouldDirty: true, shouldValidate: true });

                            const nextSets = [...(getValues("attributes.sets") as any[])];
                            const setIndex = nextSets.findIndex((s) => isColorAttribute(String(s?.name || "")));
                            if (setIndex >= 0) {
                              const values = Array.isArray(nextSets[setIndex]?.values) ? nextSets[setIndex].values : [];
                              const replaced = values.map((v: any) => {
                                const raw = String(v ?? "").trim();
                                if (!raw) return raw;
                                const k = normalizeColorKey(raw);
                                if (prevKey && k === prevKey) return nextName;
                                return raw;
                              });
                              const deduped = Array.from(new Set(replaced.map((v: any) => String(v).trim()).filter((v: string) => v.length > 0)));
                              nextSets[setIndex] = { ...nextSets[setIndex], values: deduped };
                              setValue("attributes.sets", nextSets, { shouldDirty: true, shouldValidate: true });
                            }
                          }}
                          placeholder="e.g. Navy Blue"
                        />
                      </div>
                      <div className="space-y-1 md:col-span-1">
                        <Label className="text-xs">Color Code</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            className="h-8 w-10 p-0 border-0 rounded cursor-pointer"
                            value={(() => {
                              const raw = String(cv?.colorCode ?? "").trim();
                              return /^#[0-9a-f]{6}$/i.test(raw) ? raw : "#000000";
                            })()}
                            onChange={(e) => {
                              const next = [...(getValues("colorVariants") as any[])];
                              next[idx] = { ...next[idx], colorCode: e.target.value };
                              setValue("colorVariants", next, { shouldDirty: true, shouldValidate: true });
                            }}
                            title="Pick color"
                          />
                          <Input
                            className="h-8 flex-1"
                            value={String(cv?.colorCode ?? "")}
                            onChange={(e) => {
                              const next = [...(getValues("colorVariants") as any[])];
                              next[idx] = { ...next[idx], colorCode: e.target.value };
                              setValue("colorVariants", next, { shouldDirty: true, shouldValidate: true });
                            }}
                            placeholder="#RRGGBB"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                      <div className="space-y-1">
                        <Label className="text-xs">SKU</Label>
                        <Input
                          className="h-8"
                          value={String(cv?.sku ?? "")}
                          onChange={(e) => {
                            const next = [...(getValues("colorVariants") as any[])];
                            next[idx] = { ...next[idx], sku: e.target.value };
                            setValue("colorVariants", next, { shouldDirty: true, shouldValidate: true });
                          }}
                          placeholder="Variant SKU"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Price</Label>
                        <Input
                          className="h-8"
                          type="number"
                          value={cv?.price ?? ""}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const next = [...(getValues("colorVariants") as any[])];
                            next[idx] = { ...next[idx], price: raw === "" ? undefined : Number(raw) };
                            setValue("colorVariants", next, { shouldDirty: true, shouldValidate: true });
                          }}
                          placeholder={String(startPrice || 0)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Stock</Label>
                        <Input
                          className="h-8"
                          type="number"
                          value={cv?.stock ?? ""}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const next = [...(getValues("colorVariants") as any[])];
                            next[idx] = { ...next[idx], stock: raw === "" ? undefined : Number(raw) };
                            setValue("colorVariants", next, { shouldDirty: true, shouldValidate: true });
                          }}
                          placeholder="Stock"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Images</Label>
                      <div className="flex flex-wrap items-center gap-2">
                        {(Array.isArray(cv?.images) ? cv.images : []).map((url: string) => (
                          <div key={url} className="relative">
                            <img src={url} alt="variant" className="h-12 w-12 rounded-md border object-cover" />
                            <button
                              type="button"
                              className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-white text-xs"
                              onClick={() => {
                                const next = [...(getValues("colorVariants") as any[])];
                                const imgs = Array.isArray(next[idx]?.images) ? next[idx].images : [];
                                next[idx] = { ...next[idx], images: imgs.filter((u: string) => u !== url) };
                                setValue("colorVariants", next, { shouldDirty: true, shouldValidate: true });
                              }}
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <Input
                          type="file"
                          accept="image/*"
                          className="h-10 w-[220px]"
                          onChange={async (e) => {
                            const f = e.currentTarget.files?.[0];
                            e.currentTarget.value = "";
                            if (!f) return;
                            const url = await uploadVariantImage(f);
                            if (!url) return;
                            const next = [...(getValues("colorVariants") as any[])];
                            const imgs = Array.isArray(next[idx]?.images) ? next[idx].images : [];
                            next[idx] = { ...next[idx], images: Array.from(new Set([...imgs, url])) };
                            setValue("colorVariants", next, { shouldDirty: true, shouldValidate: true });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
