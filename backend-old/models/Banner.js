const mongoose = require('mongoose');

const BannerSchema = new mongoose.Schema({
    title: { type: String, required: true },
    image: { type: String, required: true },
    link: { type: String },
    position: { type: String, required: true, enum: ['home', 'category', 'product'] },
    active: { type: Boolean, required: true, default: true },
    order: { type: Number, required: true, default: 0 }
}, { timestamps: true });

const BannerModel = mongoose.models.Banner || mongoose.model('Banner', BannerSchema);

module.exports = { BannerModel };
