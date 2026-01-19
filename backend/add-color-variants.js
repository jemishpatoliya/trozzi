// Script to add color variants to existing products
import { ProductModel } from './src/models/product.ts';
import mongoose from 'mongoose';

async function addColorVariants() {
    try {
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/trozz');
        console.log('Connected to database');

        // Find products without colorVariants
        const products = await ProductModel.find({
            $or: [
                { colorVariants: { $exists: false } },
                { colorVariants: { $size: 0 } }
            ]
        });

        console.log(`Found ${products.length} products without color variants`);

        // Update products with color variants
        for (const product of products) {
            let colorVariants = [];

            // Add color variants based on category
            if (product.category === 'Fashion' && product.colors.length > 0) {
                colorVariants = product.colors.map((color, index) => ({
                    color: color.toLowerCase().replace(/\s+/g, '-'),
                    colorName: color,
                    colorCode: getColorCode(color),
                    images: [product.image, ...(product.galleryImages || [])],
                    price: product.price,
                    stock: Math.max(5, product.stock - index * 2),
                    sku: `${product.sku}-${color.substring(0, 3).toUpperCase()}`
                }));
            } else if (product.colors.length > 0) {
                colorVariants = product.colors.map((color, index) => ({
                    color: color.toLowerCase().replace(/\s+/g, '-'),
                    colorName: color,
                    colorCode: getColorCode(color),
                    images: [product.image, ...(product.galleryImages || [])],
                    price: product.price,
                    stock: Math.max(5, product.stock - index * 2),
                    sku: `${product.sku}-${color.substring(0, 3).toUpperCase()}`
                }));
            }

            if (colorVariants.length > 0) {
                await ProductModel.findByIdAndUpdate(product._id, {
                    colorVariants: colorVariants
                });
                console.log(`✅ Added color variants to: ${product.name}`);
            }
        }

        console.log('✅ Color variants added successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

function getColorCode(colorName) {
    const colorCodes = {
        'Black': '#000000',
        'White': '#FFFFFF',
        'Red': '#FF0000',
        'Blue': '#0000FF',
        'Green': '#00FF00',
        'Yellow': '#FFFF00',
        'Purple': '#800080',
        'Orange': '#FFA500',
        'Pink': '#FFC0CB',
        'Brown': '#964B00',
        'Gray': '#808080',
        'Navy': '#000080',
        'Tan': '#D2B48C',
        'Classic Blue': '#1E3A8A',
        'Gray': '#6B7280'
    };
    return colorCodes[colorName] || '#CCCCCC';
}

addColorVariants();
