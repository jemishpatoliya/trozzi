const mongoose = require('mongoose');
require('dotenv').config();

// Banner Schema
const BannerSchema = new mongoose.Schema({
    title: { type: String, required: true },
    subtitle: { type: String, default: '' },
    image: { type: String, required: true },
    link: { type: String, default: '' },
    position: { type: String, required: true },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Banner = mongoose.models.Banner || mongoose.model('Banner', BannerSchema);

const seedBanners = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/trozzy-reviews');
        console.log('✅ Connected to MongoDB');

        // Clear existing banners
        await Banner.deleteMany({});
        console.log('🗑️ Cleared existing banners');

        // Sample banner data
        const sampleBanners = [
            // Home Hero Banners
            {
                title: 'Mega Electronics Sale',
                subtitle: 'Up to 50% off on smartphones, laptops & more',
                image: 'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=1200&q=80&auto=format&fit=crop',
                link: '/category/electronics',
                position: 'home_hero',
                active: true,
                order: 1
            },
            {
                title: 'Fashion Week Special',
                subtitle: 'Trendy clothing at unbeatable prices',
                image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&q=80&auto=format&fit=crop',
                link: '/category/clothing',
                position: 'home_hero',
                active: true,
                order: 2
            },
            {
                title: 'Home Makeover',
                subtitle: 'Transform your space with our collection',
                image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80&auto=format&fit=crop',
                link: '/category/home-garden',
                position: 'home_hero',
                active: true,
                order: 3
            },
            // Home Ad Grid Banners
            {
                title: 'New Arrivals',
                subtitle: 'Fresh styles just dropped',
                image: 'https://images.unsplash.com/photo-1558769132-cb1aea45c1e5?w=600&q=80&auto=format&fit=crop',
                link: '/new-arrivals',
                position: 'home_ad_grid',
                active: true,
                order: 1
            },
            {
                title: 'Best Sellers',
                subtitle: 'Customer favorites',
                image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=600&q=80&auto=format&fit=crop',
                link: '/best-sellers',
                position: 'home_ad_grid',
                active: true,
                order: 2
            },
            {
                title: 'Sports & Fitness',
                subtitle: 'Gear up for your workout',
                image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&q=80&auto=format&fit=crop',
                link: '/category/sports-outdoors',
                position: 'home_ad_grid',
                active: true,
                order: 3
            },
            {
                title: 'Books & Media',
                subtitle: 'Bestsellers and new releases',
                image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&q=80&auto=format&fit=crop',
                link: '/category/books-media',
                position: 'home_ad_grid',
                active: true,
                order: 4
            },
            // Home Mid Slider Banners
            {
                title: 'Flash Sale',
                subtitle: 'Limited time - 70% OFF',
                image: 'https://images.unsplash.com/photo-1607082318824-0b96a2c4b9b5?w=800&q=80&auto=format&fit=crop',
                link: '/flash-sale',
                position: 'home_mid_slider',
                active: true,
                order: 1
            },
            {
                title: 'Weekend Special',
                subtitle: 'Extra 20% off on selected items',
                image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80&auto=format&fit=crop',
                link: '/weekend-deals',
                position: 'home_mid_slider',
                active: true,
                order: 2
            },
            {
                title: 'Clearance Sale',
                subtitle: 'Last chance to grab deals',
                image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=800&q=80&auto=format&fit=crop',
                link: '/clearance',
                position: 'home_mid_slider',
                active: true,
                order: 3
            },
            // Home Mid Banners
            {
                title: 'Free Shipping',
                subtitle: 'On orders above $50',
                image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&q=80&auto=format&fit=crop',
                link: '/shipping-info',
                position: 'home_mid_banners',
                active: true,
                order: 1
            },
            {
                title: 'Easy Returns',
                subtitle: '30-day return policy',
                image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80&auto=format&fit=crop',
                link: '/returns',
                position: 'home_mid_banners',
                active: true,
                order: 2
            },
            {
                title: '24/7 Support',
                subtitle: 'We\'re here to help',
                image: 'https://images.unsplash.com/photo-1573496359142-b3d406da8521?w=600&q=80&auto=format&fit=crop',
                link: '/support',
                position: 'home_mid_banners',
                active: true,
                order: 3
            },
            // Home Promo Slider Banners
            {
                title: 'Electronics Deals',
                subtitle: 'Latest gadgets at best prices',
                image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=800&q=80&auto=format&fit=crop',
                link: '/category/electronics',
                position: 'home_promo_slider',
                active: true,
                order: 1
            },
            {
                title: 'Fashion Essentials',
                subtitle: 'Style meets comfort',
                image: 'https://images.unsplash.com/photo-1483985988355-763628919326?w=800&q=80&auto=format&fit=crop',
                link: '/category/clothing',
                position: 'home_promo_slider',
                active: true,
                order: 2
            },
            {
                title: 'Kids Zone',
                subtitle: 'Fun toys and games',
                image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&q=80&auto=format&fit=crop',
                link: '/category/toys-games',
                position: 'home_promo_slider',
                active: true,
                order: 3
            },
            {
                title: 'Outdoor Adventure',
                subtitle: 'Gear for your next trip',
                image: 'https://images.unsplash.com/photo-1552667466-07770ae1105d?w=800&q=80&auto=format&fit=crop',
                link: '/category/sports-outdoors',
                position: 'home_promo_slider',
                active: true,
                order: 4
            },
            // Category Banners
            {
                title: 'Smartphones & Tablets',
                subtitle: 'Latest devices at great prices',
                image: 'https://images.unsplash.com/photo-155170965a-0735a743e1e1?w=800&q=80&auto=format&fit=crop',
                link: '/category/electronics/mobile',
                position: 'category_banners',
                active: true,
                order: 1
            },
            {
                title: 'Men\'s Fashion',
                subtitle: 'Trendy clothes for modern men',
                image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea4f?w=800&q=80&auto=format&fit=crop',
                link: '/category/clothing/men',
                position: 'category_banners',
                active: true,
                order: 2
            },
            {
                title: 'Home Decor',
                subtitle: 'Beautiful items for your home',
                image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&q=80&auto=format&fit=crop',
                link: '/category/home-garden/decor',
                position: 'category_banners',
                active: true,
                order: 3
            }
        ];

        // Insert sample banners
        const insertedBanners = await Banner.insertMany(sampleBanners);
        console.log('🎯 Sample banners created successfully');
        console.log('Inserted banners count:', insertedBanners.length);

        console.log('✅ Banners seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding banners:', error);
        process.exit(1);
    }
};

seedBanners();
