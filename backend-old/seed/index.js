const mongoose = require('mongoose');
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const { CategoryModel } = require('../models/Category');
const { ProductModel } = require('../models/Product');
const { BannerModel } = require('../models/Banner');

const seedData = async () => {
    try {
        await connectDB();
        
        console.log('Clearing existing data...');
        await User.deleteMany({});
        await CategoryModel.deleteMany({});
        await ProductModel.deleteMany({});
        await BannerModel.deleteMany({});

        console.log('Seeding users...');
        const adminUser = new User({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@trozzy.com',
            password: 'admin123',
            role: 'admin'
        });
        await adminUser.save();

        const testUser = new User({
            firstName: 'Test',
            lastName: 'User',
            email: 'user@trozzy.com',
            password: 'user123',
            role: 'user'
        });
        await testUser.save();

        console.log('Seeding categories...');
        const categories = [
            { name: 'Electronics', shortDescription: 'Latest gadgets and devices', order: 1 },
            { name: 'Clothing', shortDescription: 'Fashion and apparel', order: 2 },
            { name: 'Home & Garden', shortDescription: 'Home improvement items', order: 3 },
            { name: 'Sports', shortDescription: 'Sports equipment and gear', order: 4 },
            { name: 'Books', shortDescription: 'Books and literature', order: 5 }
        ];

        const createdCategories = await CategoryModel.insertMany(categories);

        console.log('Seeding products...');
        const products = [
            {
                slug: 'wireless-headphones-pro',
                name: 'Wireless Headphones Pro',
                sku: 'WHP-001',
                price: 9999,
                stock: 50,
                status: 'active',
                image: 'https://example.com/headphones.jpg',
                galleryImages: ['https://example.com/headphones1.jpg', 'https://example.com/headphones2.jpg'],
                category: 'Electronics',
                description: 'Premium wireless headphones with noise cancellation',
                featured: true,
                createdAt: new Date().toISOString().split('T')[0],
                colors: ['Black', 'White', 'Blue'],
                sizes: [],
                tags: ['wireless', 'headphones', 'audio'],
                brand: 'AudioTech',
                rating: 4.5
            },
            {
                slug: 'smart-watch-ultra',
                name: 'Smart Watch Ultra',
                sku: 'SWU-002',
                price: 14999,
                stock: 30,
                status: 'active',
                image: 'https://example.com/smartwatch.jpg',
                galleryImages: ['https://example.com/watch1.jpg', 'https://example.com/watch2.jpg'],
                category: 'Electronics',
                description: 'Advanced fitness tracking and health monitoring',
                featured: true,
                createdAt: new Date().toISOString().split('T')[0],
                colors: ['Black', 'Silver'],
                sizes: [],
                tags: ['smartwatch', 'fitness', 'health'],
                brand: 'TechWatch',
                rating: 4.3
            },
            {
                slug: 'cotton-t-shirt-premium',
                name: 'Cotton T-Shirt Premium',
                sku: 'CTS-003',
                price: 599,
                stock: 100,
                status: 'active',
                image: 'https://example.com/tshirt.jpg',
                galleryImages: ['https://example.com/tshirt1.jpg', 'https://example.com/tshirt2.jpg'],
                category: 'Clothing',
                description: 'Comfortable 100% cotton t-shirt',
                featured: false,
                createdAt: new Date().toISOString().split('T')[0],
                colors: ['White', 'Black', 'Gray', 'Navy'],
                sizes: ['S', 'M', 'L', 'XL', 'XXL'],
                tags: ['cotton', 'tshirt', 'casual'],
                brand: 'ComfortWear',
                rating: 4.2
            },
            {
                slug: 'yoga-mat-eco',
                name: 'Yoga Mat Eco',
                sku: 'YME-004',
                price: 1299,
                stock: 75,
                status: 'active',
                image: 'https://example.com/yogamat.jpg',
                galleryImages: ['https://example.com/yoga1.jpg', 'https://example.com/yoga2.jpg'],
                category: 'Sports',
                description: 'Eco-friendly non-slip yoga mat',
                featured: false,
                createdAt: new Date().toISOString().split('T')[0],
                colors: ['Purple', 'Blue', 'Green'],
                sizes: [],
                tags: ['yoga', 'fitness', 'eco'],
                brand: 'EcoFit',
                rating: 4.6
            },
            {
                slug: 'bestseller-novel',
                name: 'Bestseller Novel',
                sku: 'BN-005',
                price: 399,
                stock: 200,
                status: 'active',
                image: 'https://example.com/book.jpg',
                galleryImages: ['https://example.com/book1.jpg'],
                category: 'Books',
                description: 'Award-winning fiction novel',
                featured: false,
                createdAt: new Date().toISOString().split('T')[0],
                colors: [],
                sizes: [],
                tags: ['fiction', 'bestseller', 'award'],
                brand: 'BookWorld',
                rating: 4.7
            }
        ];

        await ProductModel.insertMany(products);

        console.log('Seeding banners...');
        const banners = [
            {
                title: 'Summer Sale',
                image: 'https://example.com/summer-sale.jpg',
                link: '/products?onSale=true',
                position: 'home',
                order: 1
            },
            {
                title: 'New Electronics',
                image: 'https://example.com/electronics.jpg',
                link: '/category/electronics',
                position: 'home',
                order: 2
            },
            {
                title: 'Fashion Week',
                image: 'https://example.com/fashion.jpg',
                link: '/category/clothing',
                position: 'category',
                order: 1
            }
        ];

        await BannerModel.insertMany(banners);

        console.log('Database seeded successfully!');
        console.log('Admin login: admin@trozzy.com / admin123');
        console.log('User login: user@trozzy.com / user123');
        
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

seedData();
