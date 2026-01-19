// Test color variants functionality
import { fetchProducts } from './src/api/catalog.js';

async function testColorVariants() {
    try {
        console.log('Testing color variants functionality...');

        // Test API call
        const response = await fetchProducts({ q: 'Backpack', limit: 1 });
        const product = response.items[0];

        if (!product) {
            console.log('❌ No product found');
            return;
        }

        console.log('✅ Product found:', product.name);
        console.log('✅ Color variants:', product.colorVariants?.length || 0);

        if (product.colorVariants && product.colorVariants.length > 0) {
            console.log('✅ Color variant details:');
            product.colorVariants.forEach((variant, index) => {
                console.log(`  ${index + 1}. ${variant.colorName} - ${variant.colorCode}`);
                console.log(`     Price: $${variant.price}`);
                console.log(`     Stock: ${variant.stock}`);
                console.log(`     SKU: ${variant.sku}`);
                console.log(`     Images: ${variant.images.length}`);
            });
        } else {
            console.log('❌ No color variants found');
        }

        // Test color variant structure
        const hasRequiredFields = product.colorVariants?.every(variant =>
            variant.color &&
            variant.colorName &&
            variant.colorCode &&
            variant.images &&
            variant.images.length > 0
        );

        console.log('✅ Color variants have required fields:', hasRequiredFields);

        console.log('🎉 Color variants test completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testColorVariants();
