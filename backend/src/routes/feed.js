/**
 * Product Feed Route for Meta (Facebook/Instagram) Catalog
 * Generates dynamic CSV feed from database
 */

const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Escape CSV special characters
function escapeCSV(value) {
    if (value === null || value === undefined) return '';
    const str = String(value);
    // If value contains comma, quote, or newline, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

// Build absolute URL for product images
function getAbsoluteUrl(req, path) {
    if (!path || typeof path !== 'string') return '';
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    const host = req.get('host') || 'trozzi.in';
    const protocol = req.protocol || 'https';
    if (path.startsWith('/')) {
        return `${protocol}://${host}${path}`;
    }
    return `${protocol}://${host}/${path}`;
}

// Generate CSV content from products
function generateProductCSV(products, req) {
    // CSV Header (Meta required fields + bonus fields)
    const headers = [
        'id',
        'title',
        'description',
        'availability',
        'condition',
        'price',
        'sale_price',
        'link',
        'image_link',
        'brand',
        'sku',
        'item_group_id',
        'google_product_category',
        'product_type',
        'shipping',
        'size',
        'color'
    ];

    let csv = headers.map(escapeCSV).join(',') + '\n';

    for (const p of products) {
        const management = p.management || {};
        const basic = management.basic || {};
        const pricing = management.pricing || {};
        const inventory = management.inventory || {};
        const shipping = management.shipping || {};
        const media = management.media || {};

        // Get product details
        const id = String(p._id || '');
        const title = basic.name || p.name || '';
        const description = basic.shortDescription || basic.descriptionHtml || p.description || title;
        const stockQty = inventory.stockQuantity || p.stock || 0;
        const availability = stockQty > 0 ? 'in stock' : 'out of stock';
        const condition = 'new';
        
        // Price with currency
        const sellingPrice = Number(pricing.sellingPrice || p.price || 0);
        const comparePrice = Number(pricing.compareAtPrice || 0);
        const price = sellingPrice > 0 ? `${sellingPrice} INR` : '';
        const salePrice = (comparePrice > 0 && comparePrice > sellingPrice) ? `${sellingPrice} INR` : '';
        
        // Product URL
        const slug = p.slug || id;
        const host = req.get('host') || 'trozzi.in';
        const protocol = req.protocol || 'https';
        const link = `${protocol}://${host}/product/${slug}`;
        
        // Image URL
        const rawImages = Array.isArray(media.images) ? media.images : [];
        const thumbId = media.thumbnailId;
        const thumb = thumbId ? rawImages.find(i => i.id === thumbId) : null;
        const imageUrl = p.image || thumb?.url || rawImages[0]?.url || '';
        const imageLink = getAbsoluteUrl(req, imageUrl);
        
        // Brand
        const brand = basic.brand || 'Trozzi';
        
        // SKU
        const sku = inventory.sku || p.sku || id;
        
        // Item group ID (for variants)
        const itemGroupId = p._id ? String(p._id) : '';
        
        // Category
        const categoryIds = Array.isArray(basic.categoryIds) ? basic.categoryIds : [];
        const category = categoryIds[0] || 'Apparel & Accessories';
        const googleCategory = 'Apparel & Accessories > Clothing';
        
        // Shipping
        const shippingCost = shipping.shippingCharge || p.shippingCharge || 0;
        const freeShipping = shipping.freeShipping || p.freeShipping || false;
        const shippingStr = freeShipping ? '0 INR' : (shippingCost > 0 ? `${shippingCost} INR` : '40 INR');
        
        // Size and Color from attributes
        const attributes = management.attributes || {};
        const sets = Array.isArray(attributes.sets) ? attributes.sets : [];
        
        const sizeSet = sets.find(s => s.name && s.name.toLowerCase().includes('size') && !s.name.toLowerCase().includes('guide'));
        const sizes = sizeSet && Array.isArray(sizeSet.values) ? sizeSet.values.join(',') : '';
        
        const colorSet = sets.find(s => s.name && s.name.toLowerCase().includes('color'));
        const colors = colorSet && Array.isArray(colorSet.values) ? colorSet.values.join(',') : '';

        const row = [
            id,
            title,
            description,
            availability,
            condition,
            price,
            salePrice,
            link,
            imageLink,
            brand,
            sku,
            itemGroupId,
            googleCategory,
            category,
            shippingStr,
            sizes,
            colors
        ].map(escapeCSV);

        csv += row.join(',') + '\n';
    }

    return csv;
}

// GET /feed/products.csv - Meta Product Catalog Feed
router.get('/products.csv', async (req, res) => {
    try {
        const db = mongoose.connection.db;
        if (!db) {
            return res.status(503).send('Database not ready');
        }

        // Fetch all active products
        const products = await db.collection('products')
            .find({
                status: { $in: ['active', 'published'] },
                $or: [
                    { visibility: 'public' },
                    { visibility: { $exists: false } },
                    { 'management.basic.visibility': 'public' },
                    { 'management.basic.visibility': { $exists: false } }
                ]
            })
            .project({
                _id: 1,
                name: 1,
                slug: 1,
                sku: 1,
                price: 1,
                stock: 1,
                image: 1,
                description: 1,
                shippingCharge: 1,
                freeShipping: 1,
                management: 1
            })
            .toArray();

        console.log(`[Feed] Generated CSV with ${products.length} products`);

        // Generate CSV
        const csv = generateProductCSV(products, req);

        // Set headers for CSV download
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="trozzi-products.csv"');
        res.setHeader('Cache-Control', 'no-cache');

        res.send(csv);
    } catch (error) {
        console.error('[Feed] Error generating product feed:', error);
        res.status(500).send('Failed to generate product feed');
    }
});

// GET /feed/products.json - Alternative JSON feed
router.get('/products.json', async (req, res) => {
    try {
        const db = mongoose.connection.db;
        if (!db) {
            return res.status(503).json({ error: 'Database not ready' });
        }

        const products = await db.collection('products')
            .find({
                status: { $in: ['active', 'published'] },
                $or: [
                    { visibility: 'public' },
                    { visibility: { $exists: false } },
                    { 'management.basic.visibility': 'public' },
                    { 'management.basic.visibility': { $exists: false } }
                ]
            })
            .project({
                _id: 1,
                name: 1,
                slug: 1,
                sku: 1,
                price: 1,
                stock: 1,
                image: 1,
                description: 1,
                shippingCharge: 1,
                freeShipping: 1,
                management: 1
            })
            .toArray();

        const host = req.get('host') || 'trozzi.in';
        const protocol = req.protocol || 'https';

        const feed = products.map(p => {
            const management = p.management || {};
            const basic = management.basic || {};
            const pricing = management.pricing || {};
            const inventory = management.inventory || {};
            const media = management.media || {};
            const shipping = management.shipping || {};

            const rawImages = Array.isArray(media.images) ? media.images : [];
            const thumbId = media.thumbnailId;
            const thumb = thumbId ? rawImages.find(i => i.id === thumbId) : null;
            const imageUrl = p.image || thumb?.url || rawImages[0]?.url || '';

            return {
                id: String(p._id),
                title: basic.name || p.name || '',
                description: basic.shortDescription || p.description || '',
                availability: (inventory.stockQuantity || p.stock || 0) > 0 ? 'in stock' : 'out of stock',
                condition: 'new',
                price: `${pricing.sellingPrice || p.price || 0} INR`,
                sale_price: pricing.compareAtPrice ? `${pricing.sellingPrice || p.price || 0} INR` : undefined,
                link: `${protocol}://${host}/product/${p.slug || p._id}`,
                image_link: imageUrl.startsWith('http') ? imageUrl : `${protocol}://${host}${imageUrl}`,
                brand: basic.brand || 'Trozzi',
                sku: inventory.sku || p.sku || String(p._id),
                item_group_id: String(p._id),
                google_product_category: 'Apparel & Accessories > Clothing',
                shipping: shipping.freeShipping ? '0 INR' : `${shipping.shippingCharge || p.shippingCharge || 40} INR`
            };
        });

        res.json({
            success: true,
            count: feed.length,
            products: feed
        });
    } catch (error) {
        console.error('[Feed] Error generating JSON feed:', error);
        res.status(500).json({ error: 'Failed to generate feed' });
    }
});

// Escape XML special characters
function escapeXML(value) {
    if (value === null || value === undefined) return '';
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// Build product object with all fields
function buildProductData(p, req) {
    const management = p.management || {};
    const basic = management.basic || {};
    const pricing = management.pricing || {};
    const inventory = management.inventory || {};
    const media = management.media || {};
    const shipping = management.shipping || {};
    const attributes = management.attributes || {};

    const host = req.get('host') || 'trozzi.in';
    const protocol = req.protocol || 'https';

    const rawImages = Array.isArray(media.images) ? media.images : [];
    const thumbId = media.thumbnailId;
    const thumb = thumbId ? rawImages.find(i => i.id === thumbId) : null;
    const imageUrl = p.image || thumb?.url || rawImages[0]?.url || '';
    const imageLink = imageUrl.startsWith('http') ? imageUrl : `${protocol}://${host}${imageUrl}`;

    const sets = Array.isArray(attributes.sets) ? attributes.sets : [];
    const sizeSet = sets.find(s => s.name && s.name.toLowerCase().includes('size') && !s.name.toLowerCase().includes('guide'));
    const sizes = sizeSet && Array.isArray(sizeSet.values) ? sizeSet.values : [];
    const colorSet = sets.find(s => s.name && s.name.toLowerCase().includes('color'));
    const colors = colorSet && Array.isArray(colorSet.values) ? colorSet.values : [];

    const stockQty = inventory.stockQuantity || p.stock || 0;
    const sellingPrice = Number(pricing.sellingPrice || p.price || 0);
    const comparePrice = Number(pricing.compareAtPrice || 0);

    return {
        id: String(p._id || ''),
        title: basic.name || p.name || '',
        description: basic.shortDescription || basic.descriptionHtml || p.description || '',
        availability: stockQty > 0 ? 'in stock' : 'out of stock',
        condition: 'new',
        price: sellingPrice,
        salePrice: comparePrice > 0 && comparePrice > sellingPrice ? sellingPrice : null,
        currency: 'INR',
        link: `${protocol}://${host}/product/${p.slug || p._id}`,
        imageLink: imageLink,
        additionalImages: rawImages.slice(1).map(img => img.url ? (img.url.startsWith('http') ? img.url : `${protocol}://${host}${img.url}`) : '').filter(Boolean),
        brand: basic.brand || 'Trozzi',
        sku: inventory.sku || p.sku || String(p._id),
        itemGroupId: String(p._id),
        category: Array.isArray(basic.categoryIds) && basic.categoryIds[0] ? basic.categoryIds[0] : 'Apparel & Accessories',
        googleCategory: 'Apparel & Accessories > Clothing',
        shippingCost: shipping.freeShipping ? 0 : (shipping.shippingCharge || p.shippingCharge || 40),
        freeShipping: shipping.freeShipping || p.freeShipping || false,
        weight: shipping.weightKg || p.weight || 0,
        sizes: sizes,
        colors: colors,
        stock: stockQty,
        status: p.status,
        slug: p.slug || '',
        createdAt: p.createdAt || new Date().toISOString(),
        updatedAt: p.updatedAt || new Date().toISOString()
    };
}

// Generate XML for a single product
function generateProductXML(product, req) {
    const p = buildProductData(product, req);

    let additionalImagesXML = '';
    for (const img of p.additionalImages) {
        additionalImagesXML += `      <additional_image_link>${escapeXML(img)}</additional_image_link>\n`;
    }

    let sizesXML = '';
    for (const size of p.sizes) {
        sizesXML += `      <size>${escapeXML(size)}</size>\n`;
    }

    let colorsXML = '';
    for (const color of p.colors) {
        colorsXML += `      <color>${escapeXML(color)}</color>\n`;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<product>
  <id>${escapeXML(p.id)}</id>
  <title>${escapeXML(p.title)}</title>
  <description>${escapeXML(p.description)}</description>
  <availability>${escapeXML(p.availability)}</availability>
  <condition>${escapeXML(p.condition)}</condition>
  <price>${escapeXML(p.price)} ${escapeXML(p.currency)}</price>
  ${p.salePrice ? `<sale_price>${escapeXML(p.salePrice)} ${escapeXML(p.currency)}</sale_price>` : ''}
  <link>${escapeXML(p.link)}</link>
  <image_link>${escapeXML(p.imageLink)}</image_link>
${additionalImagesXML}  <brand>${escapeXML(p.brand)}</brand>
  <sku>${escapeXML(p.sku)}</sku>
  <item_group_id>${escapeXML(p.itemGroupId)}</item_group_id>
  <google_product_category>${escapeXML(p.googleCategory)}</google_product_category>
  <product_type>${escapeXML(p.category)}</product_type>
  <shipping>
    <cost>${escapeXML(p.shippingCost)} ${escapeXML(p.currency)}</cost>
    <free>${escapeXML(p.freeShipping)}</free>
  </shipping>
  <stock>${escapeXML(p.stock)}</stock>
  <status>${escapeXML(p.status)}</status>
  <weight>${escapeXML(p.weight)}</weight>
${sizesXML}${colorsXML}  <slug>${escapeXML(p.slug)}</slug>
  <created_at>${escapeXML(p.createdAt)}</created_at>
  <updated_at>${escapeXML(p.updatedAt)}</updated_at>
</product>`;
}

// Generate XML for all products
function generateProductsXML(products, req) {
    let productsXML = '';
    for (const product of products) {
        const p = buildProductData(product, req);

        let additionalImagesXML = '';
        for (const img of p.additionalImages) {
            additionalImagesXML += `        <additional_image_link>${escapeXML(img)}</additional_image_link>\n`;
        }

        let sizesXML = '';
        for (const size of p.sizes) {
            sizesXML += `        <size>${escapeXML(size)}</size>\n`;
        }

        let colorsXML = '';
        for (const color of p.colors) {
            colorsXML += `        <color>${escapeXML(color)}</color>\n`;
        }

        productsXML += `
  <product>
    <id>${escapeXML(p.id)}</id>
    <title>${escapeXML(p.title)}</title>
    <description>${escapeXML(p.description)}</description>
    <availability>${escapeXML(p.availability)}</availability>
    <condition>${escapeXML(p.condition)}</condition>
    <price>${escapeXML(p.price)} ${escapeXML(p.currency)}</price>
    ${p.salePrice ? `<sale_price>${escapeXML(p.salePrice)} ${escapeXML(p.currency)}</sale_price>` : ''}
    <link>${escapeXML(p.link)}</link>
    <image_link>${escapeXML(p.imageLink)}</image_link>
${additionalImagesXML}    <brand>${escapeXML(p.brand)}</brand>
    <sku>${escapeXML(p.sku)}</sku>
    <item_group_id>${escapeXML(p.itemGroupId)}</item_group_id>
    <google_product_category>${escapeXML(p.googleCategory)}</google_product_category>
    <product_type>${escapeXML(p.category)}</product_type>
    <shipping>
      <cost>${escapeXML(p.shippingCost)} ${escapeXML(p.currency)}</cost>
      <free>${escapeXML(p.freeShipping)}</free>
    </shipping>
    <stock>${escapeXML(p.stock)}</stock>
    <status>${escapeXML(p.status)}</status>
    <weight>${escapeXML(p.weight)}</weight>
${sizesXML}${colorsXML}    <slug>${escapeXML(p.slug)}</slug>
    <created_at>${escapeXML(p.createdAt)}</created_at>
    <updated_at>${escapeXML(p.updatedAt)}</updated_at>
  </product>`;
    }

    return `<?xml version="1.0" encoding="UTF-8"?>
<products>
  <total>${products.length}</total>
  <generated_at>${new Date().toISOString()}</generated_at>
${productsXML}
</products>`;
}

// GET /feed/products.xml - All products in XML format
router.get('/products.xml', async (req, res) => {
    try {
        const db = mongoose.connection.db;
        if (!db) {
            return res.status(503).send('Database not ready');
        }

        const products = await db.collection('products')
            .find({
                status: { $in: ['active', 'published'] },
                $or: [
                    { visibility: 'public' },
                    { visibility: { $exists: false } },
                    { 'management.basic.visibility': 'public' },
                    { 'management.basic.visibility': { $exists: false } }
                ]
            })
            .project({
                _id: 1,
                name: 1,
                slug: 1,
                sku: 1,
                price: 1,
                stock: 1,
                image: 1,
                description: 1,
                shippingCharge: 1,
                freeShipping: 1,
                weight: 1,
                status: 1,
                createdAt: 1,
                updatedAt: 1,
                management: 1
            })
            .toArray();

        console.log(`[Feed] Generated XML with ${products.length} products`);

        const xml = generateProductsXML(products, req);

        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');

        res.send(xml);
    } catch (error) {
        console.error('[Feed] Error generating XML feed:', error);
        res.status(500).send('Failed to generate product feed');
    }
});

// GET /feed/product/:id.xml - Single product in XML format
router.get('/product/:id.xml', async (req, res) => {
    try {
        const db = mongoose.connection.db;
        if (!db) {
            return res.status(503).send('Database not ready');
        }

        const { id } = req.params;
        if (!id) {
            return res.status(400).send('Product ID required');
        }

        let product;
        if (mongoose.Types.ObjectId.isValid(id)) {
            product = await db.collection('products').findOne({ _id: new mongoose.Types.ObjectId(id) });
        } else {
            product = await db.collection('products').findOne({ slug: id });
        }

        if (!product) {
            return res.status(404).send('Product not found');
        }

        console.log(`[Feed] Generated XML for product: ${product.name || id}`);

        const xml = generateProductXML(product, req);

        res.setHeader('Content-Type', 'application/xml; charset=utf-8');
        res.setHeader('Cache-Control', 'no-cache');

        res.send(xml);
    } catch (error) {
        console.error('[Feed] Error generating product XML:', error);
        res.status(500).send('Failed to generate product XML');
    }
});

module.exports = router;
