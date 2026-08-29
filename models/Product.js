const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true }, // e.g. "No.01 · Oxblood Wash"
    price: { type: Number, required: true, min: 0 },
    description: { type: String, default: '' },
    imagePath: { type: String, default: '' }, // e.g. "/uploads/wildfire-tee.jpg"
    inStock: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Product', productSchema);
