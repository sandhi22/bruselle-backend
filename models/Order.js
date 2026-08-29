const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    name: { type: String, required: true },
    code: { type: String, default: '' },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    items: { type: [orderItemSchema], required: true },
    total: { type: Number, required: true },
    customerName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    // "pending" -> waiting for payment, "paid" -> payment simulated/confirmed, "cancelled"
    status: { type: String, enum: ['pending', 'paid', 'cancelled'], default: 'pending' },
    // Placeholder for when a real gateway is connected later (transaction id, gateway name, etc.)
    paymentMeta: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
