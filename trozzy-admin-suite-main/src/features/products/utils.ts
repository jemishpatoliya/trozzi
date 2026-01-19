import type { AttributeSet, ProductVariantOverride, TaxClass } from "./types";

export function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function formatMoney(amount: number, currency = "USD") {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `$${amount.toFixed(2)}`;
  }
}

export function getTaxRate(taxClass: TaxClass) {
  if (taxClass === "gst") return 0.18;
  if (taxClass === "vat") return 0.2;
  return 0;
}

export function computeDiscount(originalPrice: number, sellingPrice: number) {
  const safeOriginal = Number.isFinite(originalPrice) ? originalPrice : 0;
  const safeSelling = Number.isFinite(sellingPrice) ? sellingPrice : 0;

  const amount = Math.max(0, safeOriginal - safeSelling);
  const percent = safeOriginal > 0 ? (amount / safeOriginal) * 100 : 0;

  return {
    amount,
    percent,
  };
}

export function computeSeoScore(slug: string) {
  const s = slug.trim();
  if (!s) return 0;

  let score = 60;

  if (s.length >= 10 && s.length <= 60) score += 20;
  else score -= 10;

  if (/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) score += 15;
  else score -= 20;

  if (s.split("-").length >= 2) score += 5;

  return Math.max(0, Math.min(100, score));
}

export function stableVariantId(attributes: Record<string, string>) {
  const canonical = Object.keys(attributes)
    .sort()
    .map((k) => `${k}:${attributes[k]}`)
    .join("|");

  let hash = 2166136261;
  for (let i = 0; i < canonical.length; i++) {
    hash ^= canonical.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, "0");
}

function cartesianProduct<T>(arrays: T[][]): T[][] {
  return arrays.reduce<T[][]>((acc, curr) => {
    if (acc.length === 0) return curr.map((v) => [v]);
    const out: T[][] = [];
    for (const a of acc) {
      for (const b of curr) {
        out.push([...a, b]);
      }
    }
    return out;
  }, []);
}

export function generateVariantOverrides(sets: AttributeSet[], existing: ProductVariantOverride[]) {
  const variantSets = sets
    .filter((s) => s.useForVariants)
    .map((s) => ({
      name: s.name,
      values: s.values.filter((v) => v.trim().length > 0),
    }))
    .filter((s) => s.values.length > 0);

  if (variantSets.length === 0) return [];

  const combos = cartesianProduct(variantSets.map((s) => s.values));

  const next: ProductVariantOverride[] = combos.map((combo) => {
    const attributes: Record<string, string> = {};
    combo.forEach((value, idx) => {
      attributes[variantSets[idx].name] = value;
    });

    const id = stableVariantId(attributes);
    const name = variantSets.map((s, idx) => `${s.name}: ${combo[idx]}`).join(" · ");

    const prev = existing.find((v) => v.id === id);

    return {
      id,
      name,
      attributes,
      skuOverride: prev?.skuOverride,
      priceOverride: prev?.priceOverride,
      stockOverride: prev?.stockOverride,
    };
  });

  return next;
}
