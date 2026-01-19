// Check all products in database
import { ProductModel } from './src/models/product.ts';
import mongoose from 'mongoose';

async function checkAllProducts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/trozz');
        console.log('Connected to database');

        // Count all products
        const totalCount = await ProductModel.countDocuments();
        console.log(`Total products in database: ${totalCount}`);

        // Count products with colorVariants
        const withVariantsCount = await ProductModel.countDocuments({
            colorVariants: { $exists: true, $ne: [] }
        });
        console.log(`Products with color variants: ${withVariantsCount}`);

        // Get all products with colorVariants
        const productsWithVariants = await ProductModel.find({
            colorVariants: { $exists: true, $ne: [] }
        }).select('name colorVariants');

        console.log('\nProducts with color variants:');
        productsWithVariants.forEach(product => {
            console.log(`- ${product.name}: ${product.colorVariants?.length || 0} variants`);
        });

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkAllProducts();
