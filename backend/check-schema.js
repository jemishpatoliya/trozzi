// Check database schema for colorVariants
import { ProductModel } from './src/models/product.ts';
import mongoose from 'mongoose';

async function checkSchema() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trozzy');
        console.log('Connected to database');

        // Get one product and check its raw structure
        const product = await ProductModel.findOne({ name: /Headphones/i }).lean();

        if (product) {
            console.log('Product keys:', Object.keys(product));
            console.log('colorVariants field exists:', 'colorVariants' in product);
            console.log('colorVariants value:', product.colorVariants);
            console.log('Raw product:', JSON.stringify(product, null, 2));
        } else {
            console.log('No headphones product found');
        }

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkSchema();
