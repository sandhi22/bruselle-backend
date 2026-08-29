const express = require('express');
const multer = require('multer');
const path = require('path');
const Product = require('../models/Product');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// ---------- Image upload config ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '..', 'uploads')),
  filename: (req, file, cb) => {
    const safeName = Date.now() + '-' + file.originalname.replace(/\s+/g, '-');
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max per image
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Only JPG, PNG, or WEBP images are allowed.'));
  },
});

// ---------- Public routes ----------

// GET /api/products - list all in-stock products (for the storefront)
router.get('/', async (req, res) => {
  try {
    const products = await Product.find().sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load products.' });
  }
});

// ---------- Admin routes (require x-admin-key header) ----------

// POST /api/products - add a new product with an image
router.post('/', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, code, price, description, inStock } = req.body;
    if (!name || !code || !price) {
      return res.status(400).json({ error: 'name, code, and price are required.' });
    }

    const product = await Product.create({
      name,
      code,
      price: Number(price),
      description: description || '',
      inStock: inStock === undefined ? true : inStock === 'true',
      imagePath: req.file ? `/uploads/${req.file.filename}` : '',
    });

    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to create product.' });
  }
});

// PUT /api/products/:id - update a product (optionally replace the image)
router.put('/:id', adminAuth, upload.single('image'), async (req, res) => {
  try {
    const { name, code, price, description, inStock } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (code !== undefined) update.code = code;
    if (price !== undefined) update.price = Number(price);
    if (description !== undefined) update.description = description;
    if (inStock !== undefined) update.inStock = inStock === 'true';
    if (req.file) update.imagePath = `/uploads/${req.file.filename}`;

    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!product) return res.status(404).json({ error: 'Product not found.' });

    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to update product.' });
  }
});

// DELETE /api/products/:id - remove a product
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    res.json({ message: 'Product deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product.' });
  }
});

module.exports = router;
