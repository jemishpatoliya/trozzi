const mongoose = require('mongoose');
const Review = require('../src/models/Review');
require('dotenv').config();

// Import Category and Product models
const { CategoryModel } = require('../src/models/category');
const { ProductModel } = require('../src/models/product');

const seedData = async () => {
    try {
        console.log('✅ Seed disabled: not inserting any demo data');
        process.exit(0);

        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trozzy-reviews');
        console.log('✅ Connected to MongoDB');

        // Clear existing reviews
        await Review.deleteMany({});
        console.log('🗑️ Cleared existing reviews');

        // Sample reviews
        const sampleReviews = [
            {
                customerName: 'John Doe',
                customerEmail: 'john@example.com',
                productId: new mongoose.Types.ObjectId(),
                productName: 'Premium Wireless Headphones',
                rating: 5,
                title: 'Excellent Sound Quality!',
                comment: 'These headphones have amazing sound quality. The noise cancellation is top-notch and the battery life lasts all day. Highly recommend!',
                status: 'approved',
                helpful: 24,
                verified: true
            },
            {
                customerName: 'Jane Smith',
                customerEmail: 'jane@example.com',
                productId: new mongoose.Types.ObjectId(),
                productName: 'Smart Watch Pro',
                rating: 4,
                title: 'Great Features, Minor Issues',
                comment: 'Love the fitness tracking and notifications. Battery could be better but overall satisfied with the purchase.',
                status: 'pending',
                helpful: 12,
                verified: true
            },
            {
                customerName: 'Mike Johnson',
                customerEmail: 'mike@example.com',
                productId: new mongoose.Types.ObjectId(),
                productName: 'Laptop Stand Adjustable',
                rating: 3,
                title: 'Decent but Overpriced',
                comment: 'It does the job but feels a bit flimsy for the price. The adjustable height is nice though.',
                status: 'rejected',
                helpful: 5,
                verified: false
            },
            {
                customerName: 'Sarah Williams',
                customerEmail: 'sarah@example.com',
                productId: new mongoose.Types.ObjectId(),
                productName: 'Premium Wireless Headphones',
                rating: 5,
                title: 'Best Headphones Ever!',
                comment: 'I\'ve tried many headphones but these are by far the best. The comfort and sound quality are unmatched.',
                status: 'approved',
                helpful: 31,
                verified: true
            },
            {
                customerName: 'David Brown',
                customerEmail: 'david@example.com',
                productId: new mongoose.Types.ObjectId(),
                productName: 'USB-C Hub Multi-Port',
                rating: 4,
                title: 'Very Useful Adapter',
                comment: 'Works perfectly with my MacBook. All ports function as expected. Compact design is a plus.',
                status: 'approved',
                helpful: 18,
                verified: true
            },
            {
                customerName: 'Emily Davis',
                customerEmail: 'emily@example.com',
                productId: new mongoose.Types.ObjectId(),
                productName: 'Smart Watch Pro',
                rating: 2,
                title: 'Disappointing Experience',
                comment: 'The watch stopped working after 2 weeks. Customer service was not helpful. Would not recommend.',
                status: 'pending',
                helpful: 3,
                verified: false
            },
            {
                customerName: 'Robert Wilson',
                customerEmail: 'robert@example.com',
                productId: new mongoose.Types.ObjectId(),
                productName: 'Mechanical Keyboard RGB',
                rating: 5,
                title: 'Perfect for Gaming!',
                comment: 'The tactile feedback is amazing. RGB lighting is customizable and the build quality is solid.',
                status: 'approved',
                helpful: 42,
                verified: true
            },
            {
                customerName: 'Lisa Anderson',
                customerEmail: 'lisa@example.com',
                productId: new mongoose.Types.ObjectId(),
                productName: 'Laptop Stand Adjustable',
                rating: 4,
                title: 'Good Value for Money',
                comment: 'Sturdy construction and easy to adjust. Made my home office setup much more ergonomic.',
                status: 'approved',
                helpful: 15,
                verified: true
            }
        ];

        // Insert sample reviews
        await Review.insertMany(sampleReviews);
        console.log('📝 Sample reviews created successfully');

        await mongoose.connection.close();
        console.log('✅ Seed completed (reviews only). Skipping categories/products.');
        process.exit(0);

        // Verify categories were actually inserted
        const verifyCount = await CategoryModel.countDocuments();
        console.log('Verified categories count in DB:', verifyCount);

        // Seed Products with realistic images
        const sampleProducts = [];
        const productData = [
            { name: 'Wireless Headphones Pro', category: 'Electronics', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400' },
            { name: 'Smart Watch Ultra', category: 'Electronics', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400' },
            { name: 'Laptop Stand Premium', category: 'Electronics', image: 'https://images.unsplash.com/photo-1527864550419-7fd7f4be09ab?w=400' },
            { name: 'USB-C Hub 7-in-1', category: 'Electronics', image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400' },
            { name: 'Mechanical Keyboard RGB', category: 'Electronics', image: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400' },
            { name: 'Wireless Mouse Ergonomic', category: 'Electronics', image: 'https://images.unsplash.com/photo-1527864550419-7fd7f4be09ab?w=400' },
            { name: '4K Webcam Pro', category: 'Electronics', image: 'https://images.unsplash.com/photo-1593696140826-c58b021acf8b?w=400' },
            { name: 'Phone Case Premium', category: 'Electronics', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400' },
            { name: 'Portable Charger 20000mAh', category: 'Electronics', image: 'https://images.unsplash.com/photo-1596445837567-443a04f5d8b0?w=400' },
            { name: 'Bluetooth Speaker Waterproof', category: 'Electronics', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400' },
            { name: 'Gaming Chair Pro', category: 'Sports & Outdoors', image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400' },
            { name: 'Monitor Stand Adjustable', category: 'Electronics', image: 'https://images.unsplash.com/photo-1527864550419-7fd7f4be09ab?w=400' },
            { name: 'Desk Lamp LED', category: 'Home & Garden', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400' },
            { name: 'Cable Management Kit', category: 'Home & Garden', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400' },
            { name: 'External SSD 1TB', category: 'Electronics', image: 'https://images.unsplash.com/photo-1593699585336-fb874f444042?w=400' },
            { name: 'Graphics Tablet Digital', category: 'Electronics', image: 'https://images.unsplash.com/photo-1544198366-f677aca41c29?w=400' },
            { name: 'Fitness Tracker Smart', category: 'Sports & Outdoors', image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400' },
            { name: 'Yoga Mat Premium', category: 'Sports & Outdoors', image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400' },
            { name: 'Running Shoes Pro', category: 'Sports & Outdoors', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400' },
            { name: 'Sports Water Bottle', category: 'Sports & Outdoors', image: 'https://images.unsplash.com/photo-1602143407151-7111842cd0c7?w=400' },
            { name: 'Tennis Racket Pro', category: 'Sports & Outdoors', image: 'https://images.unsplash.com/photo-1599456977168-cf7fd6d2b7ed?w=400' },
            { name: 'Basketball Official', category: 'Sports & Outdoors', image: 'https://images.unsplash.com/photo-1552667466-07770ae1105d?w=400' },
            { name: 'Camping Tent 4-Person', category: 'Sports & Outdoors', image: 'https://images.unsplash.com/photo-1504280390367-3619e2eb2b93?w=400' },
            { name: 'Hiking Backpack 50L', category: 'Sports & Outdoors', image: 'https://images.unsplash.com/photo-1551698618-1dcef5a2f61d?w=400' },
            { name: 'Cooking Knife Set', category: 'Home & Garden', image: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=400' },
            { name: 'Coffee Maker Deluxe', category: 'Home & Garden', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400' },
            { name: 'Air Fryer Premium', category: 'Home & Garden', image: 'https://images.unsplash.com/photo-1573245518962-997d617553c1?w=400' },
            { name: 'Blender Professional', category: 'Home & Garden', image: 'https://images.unsplash.com/photo-1547721064-da6e6129c1b6?w=400' },
            { name: 'Non-Stick Pan Set', category: 'Home & Garden', image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400' },
            { name: 'Kitchen Scale Digital', category: 'Home & Garden', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400' },
            { name: 'Vacuum Cleaner Pro', category: 'Home & Garden', image: 'https://images.unsplash.com/photo-1587293822754-424312d3a6d3?w=400' },
            { name: 'Steam Iron Deluxe', category: 'Home & Garden', image: 'https://images.unsplash.com/photo-1547886040-ce6a5b32d5b5?w=400' },
            { name: 'Bed Sheet Set Premium', category: 'Home & Garden', image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400' },
            { name: 'Pillow Memory Foam', category: 'Home & Garden', image: 'https://images.unsplash.com/photo-1549490349-8643362247b5?w=400' },
            { name: 'Blanket Fleece', category: 'Home & Garden', image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400' },
            { name: 'Towel Set Luxury', category: 'Home & Garden', image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400' },
            { name: 'Shower Caddy Organizer', category: 'Home & Garden', image: 'https://images.unsplash.com/photo-1584622650116-7aa1ba658e12?w=400' },
            { name: 'Bath Mat Non-Slip', category: 'Home & Garden', image: 'https://images.unsplash.com/photo-1584622650116-7aa1ba658e12?w=400' },
            { name: 'Toothbrush Electric', category: 'Home & Garden', image: 'https://images.unsplash.com/photo-1607619056574-7b6d193063c0?w=400' },
            { name: 'Hair Dryer Professional', category: 'Home & Garden', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400' },
            { name: 'Makeup Brush Set', category: 'Clothing', image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400' },
            { name: 'Skincare Kit Premium', category: 'Clothing', image: 'https://images.unsplash.com/photo-1556228720-195a672e8285?w=400' },
            { name: 'Perfume Luxury', category: 'Clothing', image: 'https://images.unsplash.com/photo-1528304637144-243f4b2bcac1?w=400' },
            { name: 'Jewelry Box Elegant', category: 'Clothing', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400' },
            { name: 'Wallet Leather Premium', category: 'Clothing', image: 'https://images.unsplash.com/photo-1592730475738-db3663b3b16d?w=400' },
            { name: 'Backpack School', category: 'Clothing', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400' },
            { name: 'Sunglasses Polarized', category: 'Clothing', image: 'https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=400' },
            { name: 'Watch Classic', category: 'Clothing', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400' },
            { name: 'Belt Leather Genuine', category: 'Clothing', image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400' },
            { name: 'Scarf Cashmere', category: 'Clothing', image: 'https://images.unsplash.com/photo-1578632292375-bb192cdf7531?w=400' },
            { name: 'Gloves Winter', category: 'Clothing', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400' },
            { name: 'Hat Baseball', category: 'Clothing', image: 'https://images.unsplash.com/photo-1586899078174-60333f0da232?w=400' },
            { name: 'Jeans Slim Fit', category: 'Clothing', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400' },
            { name: 'T-Shirt Cotton Premium', category: 'Clothing', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400' },
            { name: 'Dress Formal', category: 'Clothing', image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400' },
            { name: 'Jacket Winter', category: 'Clothing', image: 'https://images.unsplash.com/photo-1541364988987-9b48e4630682?w=400' },
            { name: 'Boots Leather', category: 'Clothing', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400' },
            { name: 'Sneakers Sports', category: 'Clothing', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400' },
            { name: 'Sandals Summer', category: 'Clothing', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400' },
            { name: 'Slippers Comfort', category: 'Clothing', image: 'https://images.unsplash.com/photo-1608343396332-59a0c8ad8f7e?w=400' },
            { name: 'Book Bestseller Novel', category: 'Books & Media', image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400' },
            { name: 'Movie Blu-ray Collection', category: 'Books & Media', image: 'https://images.unsplash.com/photo-1471474871142-3d044bd4f8eb?w=400' },
            { name: 'Music Album Vinyl', category: 'Books & Media', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400' },
            { name: 'Video Game Console', category: 'Books & Media', image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400' },
            { name: 'Board Game Family', category: 'Toys & Games', image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400' },
            { name: 'Puzzle 1000 Pieces', category: 'Toys & Games', image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400' },
            { name: 'Action Figure Collectible', category: 'Toys & Games', image: 'https://images.unsplash.com/photo-1596445837567-443a04f5d8b0?w=400' },
            { name: 'Toy Educational', category: 'Toys & Games', image: 'https://images.unsplash.com/photo-1566576912321-d58ddd7a6080?w=400' },
            { name: 'Drum Set Electronic', category: 'Books & Media', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400' },
            { name: 'Guitar Acoustic', category: 'Books & Media', image: 'https://images.unsplash.com/photo-1511690743698-d9d85f2fbf38?w=400' },
            { name: 'Microphone Studio', category: 'Books & Media', image: 'https://images.unsplash.com/photo-1599454669858-212e55c35c9b?w=400' },
            { name: 'Amplifier Pro', category: 'Books & Media', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400' },
            { name: 'Camera DSLR', category: 'Electronics', image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd7?w=400' },
            { name: 'Lens Telephoto', category: 'Electronics', image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd7?w=400' },
            { name: 'Tripod Professional', category: 'Electronics', image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd7?w=400' },
            { name: 'Camera Bag Premium', category: 'Clothing', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400' },
            { name: 'Television 4K Smart', category: 'Electronics', image: 'https://images.unsplash.com/photo-1593784997432-2ec303a99e06?w=400' },
            { name: 'Soundbar Surround', category: 'Electronics', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400' },
            { name: 'Streaming Device', category: 'Electronics', image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400' },
            { name: 'Remote Control Universal', category: 'Electronics', image: 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=400' },
            { name: 'Router WiFi 6', category: 'Electronics', image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400' },
            { name: 'Modem Cable', category: 'Electronics', image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400' },
            { name: 'Network Switch', category: 'Electronics', image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400' },
            { name: 'Ethernet Cable Premium', category: 'Electronics', image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400' },
            { name: 'Printer All-in-One', category: 'Electronics', image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400' },
            { name: 'Scanner Document', category: 'Electronics', image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400' },
            { name: 'Shredder Office', category: 'Electronics', image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400' },
            { name: 'Desk Organizer', category: 'Home & Garden', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400' },
            { name: 'Chair Office Ergonomic', category: 'Home & Garden', image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400' },
            { name: 'Desk Standing', category: 'Home & Garden', image: 'https://images.unsplash.com/photo-1527864550419-7fd7f4be09ab?w=400' },
            { name: 'Lamp Desk LED', category: 'Home & Garden', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400' },
            { name: 'Whiteboard Magnetic', category: 'Home & Garden', image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400' },
            { name: 'Plant Pot Ceramic', category: 'Home & Garden', image: 'https://images.unsplash.com/photo-1485955900006-10cb4e966f3e?w=400' },
            { name: 'Garden Tool Set', category: 'Home & Garden', image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400' },
            { name: 'Lawn Mower Electric', category: 'Home & Garden', image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400' },
            { name: 'Hose Garden Expandable', category: 'Home & Garden', image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400' },
            { name: 'Bicycle Mountain', category: 'Sports & Outdoors', image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400' },
            { name: 'Helmet Safety', category: 'Sports & Outdoors', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400' },
            { name: 'Lock Bike Security', category: 'Sports & Outdoors', image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400' },
            { name: 'Pump Tire Electric', category: 'Sports & Outdoors', image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400' },
            { name: 'Dumbbell Set Adjustable', category: 'Sports & Outdoors', image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400' },
            { name: 'Exercise Mat Yoga', category: 'Sports & Outdoors', image: 'https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=400' },
            { name: 'Resistance Bands Set', category: 'Sports & Outdoors', image: 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=400' },
            { name: 'Jump Rope Speed', category: 'Sports & Outdoors', image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400' },
            { name: 'Water Bottle Insulated', category: 'Sports & Outdoors', image: 'https://images.unsplash.com/photo-1602143407151-7111842cd0c7?w=400' },
            { name: 'Towel Gym Microfiber', category: 'Sports & Outdoors', image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400' },
            { name: 'Gloves Fitness', category: 'Sports & Outdoors', image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400' },
            { name: 'Shaker Bottle Protein', category: 'Sports & Outdoors', image: 'https://images.unsplash.com/photo-1602143407151-7111842cd0c7?w=400' }
        ];

        for (let i = 0; i < productData.length; i++) {
            const product = productData[i];
            const productObj = {
                slug: product.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
                visibility: 'public',
                name: product.name,
                sku: `SKU-${String(i + 1).padStart(6, '0')}`,
                price: Math.floor(Math.random() * 900) + 100, // $100 - $999
                stock: Math.floor(Math.random() * 100) + 10, // 10 - 109
                status: 'active',
                image: product.image,
                galleryImages: [
                    product.image.replace('w=400', 'w=400&auto=format&fit=crop'),
                    product.image.replace('w=400', 'w=400&auto=format&fit=crop&blur=2')
                ],
                category: product.category,
                description: `High-quality ${product.name} with premium features and durable construction. Perfect for everyday use.`,
                featured: Math.random() > 0.8, // 20% chance of being featured
                createdAt: new Date().toISOString(),
                sizes: ['S', 'M', 'L', 'XL'].slice(0, Math.floor(Math.random() * 4) + 1),
                colors: ['Red', 'Blue', 'Black', 'White', 'Green'].slice(0, Math.floor(Math.random() * 3) + 2),
                colorVariants: [],
                variants: [],
                tags: ['popular', 'new', 'sale', 'trending'].slice(0, Math.floor(Math.random() * 3) + 1),
                keyFeatures: [
                    'Premium quality materials',
                    'Modern design',
                    'Easy to use',
                    'Long lasting durability'
                ].slice(0, Math.floor(Math.random() * 3) + 2),
                warranty: '1 Year Warranty',
                warrantyDetails: 'Full warranty coverage for manufacturing defects',
                saleEnabled: Math.random() > 0.7, // 30% chance of being on sale
                saleDiscount: Math.floor(Math.random() * 30) + 10, // 10-40% discount
                saleStartDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                saleEndDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                metaTitle: `${product.name} - Best Price Online`,
                metaDescription: `Shop ${product.name} at the best price. Quality guaranteed.`,
                weight: Math.floor(Math.random() * 1000) + 100, // 100-1100g
                dimensions: {
                    length: Math.floor(Math.random() * 50) + 10,
                    width: Math.floor(Math.random() * 50) + 10,
                    height: Math.floor(Math.random() * 50) + 10
                },
                badge: Math.random() > 0.8 ? 'Best Seller' : '',
                brand: ['PremiumBrand', 'TechPro', 'StyleMaster', 'HomeEssentials'][Math.floor(Math.random() * 4)],
                rating: (Math.random() * 2 + 3).toFixed(1), // 3.0-5.0 rating
                questions: [],
                reviews: [],
                management: {},
                managementUpdatedAt: new Date().toISOString()
            };
            sampleProducts.push(productObj);
        }

        const insertedProducts = await ProductModel.insertMany(sampleProducts);
        console.log('🛍️ Sample products created successfully');
        console.log('Inserted products count:', insertedProducts.length);

        console.log('✅ Database seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedData();
