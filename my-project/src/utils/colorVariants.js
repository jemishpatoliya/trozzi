export const normalizeToken = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, '');

export const normalizeColorKey = (value) => {
  const raw = String(value || '').trim();
  return raw ? raw.toLowerCase().replace(/\s+/g, '-') : '';
};

export const colorNameToHex = (value) => {
  const key = normalizeToken(value);
  if (key === 'black') return '#000000';
  if (key === 'white') return '#ffffff';
  if (key === 'silver') return '#c0c0c0';
  if (key === 'gray' || key === 'grey') return '#808080';
  if (key === 'red') return '#ef4444';
  if (key === 'blue') return '#3b82f6';
  if (key === 'green') return '#22c55e';
  if (key === 'yellow') return '#eab308';
  if (key === 'orange') return '#f97316';
  if (key === 'pink') return '#ec4899';
  if (key === 'purple') return '#a855f7';
  if (key === 'brown') return '#a16207';
  if (key === 'tan') return '#d2b48c';
  if (key === 'navy') return '#1e3a8a';
  if (key === 'rosegold') return '#b76e79';

  const hash = String(value || '')
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const hue = hash % 360;
  return `hsl(${hue}, 70%, 55%)`;
};

export const getDefaultProductImages = (product) => {
  const image = String(product?.image || '').trim();
  const gallery = Array.isArray(product?.galleryImages) ? product.galleryImages : [];
  const out = [];
  const seen = new Set();

  if (image) {
    seen.add(image);
    out.push(image);
  }

  for (const g of gallery) {
    const u = String(g || '').trim();
    if (!u) continue;
    if (seen.has(u)) continue;
    seen.add(u);
    out.push(u);
  }

  return out;
};

const normalizeImageUrl = (img) => {
  if (!img) return '';
  if (typeof img === 'string') return img;
  if (typeof img === 'object') {
    if (typeof img.url === 'string') return img.url;
    if (typeof img.src === 'string') return img.src;
    if (typeof img.image === 'string') return img.image;
    if (typeof img.path === 'string') return img.path;
  }
  return '';
};

const normalizeVariant = (variant, product) => {
  const rawName = variant?.colorName ?? variant?.name ?? variant?.color ?? '';
  const colorName = String(rawName || '').trim();
  const color = String(variant?.color || normalizeColorKey(colorName) || colorName);

  const images = Array.isArray(variant?.images)
    ? variant.images
        .map(normalizeImageUrl)
        .filter((u) => typeof u === 'string' && u.trim().length > 0)
    : [];

  return {
    ...variant,
    color,
    colorName: colorName || color,
    colorCode: variant?.colorCode || colorNameToHex(colorName || color),
    images,
    sku: variant?.sku ?? product?.sku,
    price: variant?.price ?? product?.price,
    stock: variant?.stock ?? product?.stock,
  };
};

export const buildColorVariantsFromProduct = (product) => {
  const existingVariantsRaw = Array.isArray(product?.colorVariants) ? product.colorVariants : [];
  const existingVariants = existingVariantsRaw.map((v) => normalizeVariant(v, product));

  const defaultImages = getDefaultProductImages(product);
  if (existingVariants.length === 0) return existingVariants;

  if (defaultImages.length === 0) return existingVariants;

  const imagesPerVariant = Math.max(1, Math.ceil(defaultImages.length / existingVariants.length));

  return existingVariants.map((v, idx) => {
    const images = Array.isArray(v?.images) ? v.images.filter(Boolean) : [];
    if (images.length > 0) return v;

    const nameNeedle = normalizeToken(v?.colorName);
    const keyNeedle = normalizeToken(v?.color);
    const needle = nameNeedle || keyNeedle;
    const matched = needle
      ? defaultImages.filter((img) => normalizeToken(img).includes(needle))
      : [];

    if (matched.length > 0) {
      return {
        ...v,
        images: matched,
      };
    }

    const start = idx * imagesPerVariant;
    const end = start + imagesPerVariant;
    const fallbackGroup = defaultImages.slice(start, end).filter(Boolean);

    // If we have more variants than images (or we're out of range), cycle images so every color still switches.
    const cycled = fallbackGroup.length > 0
      ? fallbackGroup
      : (defaultImages.length > 0 ? [defaultImages[idx % defaultImages.length]].filter(Boolean) : []);

    if (cycled.length === 0) return v;
    return {
      ...v,
      images: cycled,
    };
  });
};

export const normalizeProductForColorVariants = (product) => {
  if (!product || typeof product !== 'object') return product;
  const colorVariants = buildColorVariantsFromProduct(product);
  return {
    ...product,
    colorVariants,
  };
};
