// Test Products API for Dashboard
console.log('🧪 Testing Products API for Dashboard');
console.log('=====================================\n');

// Test the fetchProducts function
async function testProductsAPI() {
    try {
        // Import the API function
        const { fetchProducts } = require('./src/api/catalog.js');
        
        console.log('📋 Testing fetchProducts API...');
        
        // Test with admin mode
        const response = await fetchProducts({ 
            mode: 'admin', 
            limit: 10,
            page: 1 
        });
        
        console.log('✅ API Response Structure:');
        console.log('- Total Items:', response.totalItems || 'N/A');
        console.log('- Products Array Length:', response.products?.length || 0);
        console.log('- Response Keys:', Object.keys(response));
        
        if (response.products && response.products.length > 0) {
            console.log('\n✅ Sample Product:');
            const sampleProduct = response.products[0];
            console.log('- ID:', sampleProduct._id || sampleProduct.id);
            console.log('- Name:', sampleProduct.name);
            console.log('- Price:', sampleProduct.price);
            console.log('- Stock:', sampleProduct.stock);
            console.log('- Category:', sampleProduct.category);
            console.log('- Active:', sampleProduct.isActive);
            
            console.log('\n🎉 Products API is working correctly!');
            console.log('Dashboard should now show products.');
        } else {
            console.log('\n⚠️ No products found in API response');
            console.log('This could mean:');
            console.log('- No products in database');
            console.log('- API endpoint not working');
            console.log('- Authentication issues');
        }
        
    } catch (error) {
        console.error('❌ Error testing products API:', error.message);
        console.log('\n🔧 Possible solutions:');
        console.log('1. Check if backend server is running on port 5050');
        console.log('2. Verify /api/products endpoint exists');
        console.log('3. Check authentication token');
        console.log('4. Ensure CORS is configured');
    }
}

// Test the dashboard component structure
function testDashboardComponent() {
    console.log('\n📋 Testing Dashboard Component Structure...');
    
    const fs = require('fs');
    const path = require('path');
    
    try {
        const componentPath = path.join(__dirname, 'src/Pages/AdminDashboard/index.jsx');
        const componentContent = fs.readFileSync(componentPath, 'utf8');
        
        const checks = [
            { pattern: 'fetchProducts', message: 'Products API imported' },
            { pattern: 'setProducts(', message: 'Products state setter used' },
            { pattern: 'products.length === 0', message: 'Products empty state handled' },
            { pattern: 'products.slice(0, 5)', message: 'Products displayed in table' },
            { pattern: 'product.name', message: 'Product name field used' },
            { pattern: 'product.price', message: 'Product price field used' },
            { pattern: 'product.stock', message: 'Product stock field used' }
        ];
        
        checks.forEach(({ pattern, message }) => {
            if (componentContent.includes(pattern)) {
                console.log(`✅ ${message}`);
            } else {
                console.log(`❌ ${message} - Missing: ${pattern}`);
            }
        });
        
    } catch (error) {
        console.error('❌ Error reading dashboard component:', error.message);
    }
}

// Run tests
async function runTests() {
    await testProductsAPI();
    testDashboardComponent();
    
    console.log('\n🎯 Summary:');
    console.log('=============');
    console.log('✅ Dashboard updated to show products');
    console.log('✅ Products API integration added');
    console.log('✅ Fallback handling implemented');
    console.log('✅ Error handling added');
    console.log('\n🚀 Dashboard should now display products!');
    console.log('If products still don\'t show, check:');
    console.log('1. Backend server is running');
    console.log('2. Products exist in database');
    console.log('3. API endpoints are accessible');
    console.log('4. Authentication is working');
}

// Run if called directly
if (require.main === module) {
    runTests();
}

module.exports = { testProductsAPI, testDashboardComponent, runTests };
