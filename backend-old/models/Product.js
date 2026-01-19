const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, required: true },
    comment: { type: String, required: true },
    customerName: { type: String, required: true },
    customerEmail: { type: String, required: true },
    date: { type: String, required: true },
    verifiedPurchase: { type: Boolean, required: true, default: false },
    helpful: { type: Number, required: true, default: 0 },
    status: { type: String, required: true, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { _id: true });

const ColorVariantSchema = new mongoose.Schema({
    color: { type: String, required: true },
    colorName: { type: String, required: true },
    colorCode: { type: String, required: true },
    images: { type: [String], required: true, default: [] },
    price: { type: Number },
    stock: { type: Number },
    sku: { type: String },
}, { _id: false });

const ProductSchema = new mongoose.Schema({
    slug: { type: String, required: true, trim: true, index: true },
    visibility: { type: String, required: true, enum: ["public", "private"], default: "public" },
    name: { type: String, required: true, trim: true },
    sku: { type: String, required: true, trim: true },
    price: { type: Number, required: true, default: 0 },
    stock: { type: Number, required: true, default: 0 },
    status: { type: String, required: true, enum: ["active", "inactive", "draft"], default: "draft" },
    image: { type: String, default: "" },
    galleryImages: { type: [String], required: true, default: [] },
    category: { type: String, default: "" },
    description: { type: String, default: "" },
    featured: { type: Boolean, required: true, default: false },
    createdAt: { type: String, required: true },
    sizes: { type: [String], required: true, default: [] },
    colors: { type: [String], required: true, default: [] },
    colorVariants: { type: [ColorVariantSchema], required: true, default: [] },
    tags: { type: [String], required: true, default: [] },
    saleEnabled: { type: Boolean, required: true, default: false },
    saleDiscount: { type: Number, required: true, default: 0 },
    saleStartDate: { type: String, default: "" },
    saleEndDate: { type: String, default: "" },
    badge: { type: String, default: "" },
    brand: { type: String, default: "" },
    freeShipping: { type: Boolean, required: true, default: false },
    rating: { type: Number, required: true, default: 0 },
    reviews: { type: [ReviewSchema], required: true, default: [] },
}, { timestamps: true });

const ProductModel = mongoose.models.Product || mongoose.model('Product', ProductSchema);

module.exports = { ProductModel };
