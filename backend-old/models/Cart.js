const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
        addedAt: { type: Date, default: Date.now }
    }],
    totalAmount: { type: Number, default: 0 }
}, { timestamps: true });

const CartModel = mongoose.models.Cart || mongoose.model('Cart', CartSchema);

module.exports = { CartModel };
