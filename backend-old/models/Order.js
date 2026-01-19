const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    orderNumber: { type: String, required: true, unique: true },
    status: { 
        type: String, 
        required: true, 
        enum: ["new", "processing", "paid", "shipped", "delivered", "cancelled", "returned"],
        default: "new"
    },
    currency: { type: String, required: true, default: "INR" },
    subtotal: { type: Number, required: true, default: 0 },
    shipping: { type: Number, required: true, default: 0 },
    tax: { type: Number, required: true, default: 0 },
    total: { type: Number, required: true, default: 0 },
    items: [{
        productId: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        image: { type: String }
    }],
    customer: {
        name: { type: String, required: true },
        email: { type: String, required: true },
        phone: { type: String }
    },
    address: {
        line1: { type: String, required: true },
        line2: { type: String },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true }
    },
    createdAtIso: { type: String, required: true }
}, { timestamps: true });

const OrderModel = mongoose.models.Order || mongoose.model('Order', OrderSchema);

module.exports = { OrderModel };
