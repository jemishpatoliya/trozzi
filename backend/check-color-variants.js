// Check color variants in database
import { ProductModel } from './src/models/product.ts';
import mongoose from 'mongoose';

async function checkColorVariants() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trozzy');
        console.log('Connected to database');

        // Find products with colorVariants
        const productsWithVariants = await ProductModel.find({
            colorVariants: { $exists: true, $ne: [] }
        });

        console.log(`Found ${productsWithVariants.length} products with color variants:`);

        productsWithVariants.forEach(product => {
            console.log(`- ${product.name}: ${product.colorVariants?.length || 0} variants`);
            if (product.colorVariants?.length > 0) {
                console.log(`  Variants: ${product.colorVariants.map(v => v.colorName).join(', ')}`);
            }
        });

        // Check a specific product
        const headphones = await ProductModel.findOne({ name: /Headphones/i });
        if (headphones) {
            console.log(`\nHeadphones product:`);
            console.log(`- colorVariants exists: ${!!headphones.colorVariants}`);
            console.log(`- colorVariants length: ${headphones.colorVariants?.length || 0}`);
            console.log(`- colorVariants: ${JSON.stringify(headphones.colorVariants, null, 2)}`);
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkColorVariants();
