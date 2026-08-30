```javascript
const express = require('express');
const multer = require('multer');
const path = require('path');
const { pool } = require('../db');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// ---------- IMAGE UPLOAD ----------

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },

  filename: function (req, file, cb) {
    const safeName =
      Date.now() + '-' + file.originalname.replace(/\s+/g, '-');

    cb(null, safeName);
  }
});

const upload = multer({
  storage: storage,

  limits: {
    fileSize: 5 * 1024 * 1024
  },

  fileFilter: function (req, file, cb) {
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, or WEBP images are allowed.'));
    }
  }
});

// ---------- API SHAPE ----------

function toApiShape(row) {
  return {
    _id: row.id,
    name: row.name,
    code: row.code,
    price: Number(row.price),
    description: row.description,
    imagePath: row.image_path,
    inStock: row.in_stock
  };
}

// ---------- GET PRODUCTS ----------

router.get('/', async function (req, res) {
  try {
    const result = await pool.query(
      'SELECT * FROM products ORDER BY created_at DESC'
    );

    res.json(result.rows.map(toApiShape));
  } catch (err) {
    console.error('GET products error:', err);

    res.status(500).json({
      error: 'Failed to load products.'
    });
  }
});

// ---------- ADD PRODUCT ----------

router.post(
  '/',
  adminAuth,
  upload.single('image'),
  async function (req, res) {
    try {
      const name = req.body.name;
      const code = req.body.code;
      const price = req.body.price;
      const description = req.body.description;
      const inStock = req.body.inStock;

      if (!name || !code || !price) {
        return res.status(400).json({
          error: 'name, code, and price are required.'
        });
      }

      const imagePath = req.file
        ? '/uploads/' + req.file.filename
        : '';

      const result = await pool.query(
        'INSERT INTO products ' +
        '(name, code, price, description, image_path, in_stock) ' +
        'VALUES ($1, $2, $3, $4, $5, $6) ' +
        'RETURNING *',
        [
          name,
          code,
          Number(price),
          description || '',
          imagePath,
          inStock === undefined ? true : inStock === 'true'
        ]
      );

      res.status(201).json(
        toApiShape(result.rows[0])
      );

    } catch (err) {
      console.error('POST product error:', err);

      res.status(500).json({
        error: err.message || 'Failed to create product.'
      });
    }
  }
);

// ---------- UPDATE PRODUCT ----------

router.put(
  '/:id',
  adminAuth,
  upload.single('image'),
  async function (req, res) {
    try {
      const name = req.body.name;
      const code = req.body.code;
      const price = req.body.price;
      const description = req.body.description;
      const inStock = req.body.inStock;

      const existing = await pool.query(
        'SELECT * FROM products WHERE id = $1',
        [req.params.id]
      );

      if (existing.rows.length === 0) {
        return res.status(404).json({
          error: 'Product not found.'
        });
      }

      const current = existing.rows[0];

      const imagePath = req.file
        ? '/uploads/' + req.file.filename
        : current.image_path;

      const result = await pool.query(
        'UPDATE products SET ' +
        'name = $1, ' +
        'code = $2, ' +
        'price = $3, ' +
        'description = $4, ' +
        'image_path = $5, ' +
        'in_stock = $6 ' +
        'WHERE id = $7 ' +
        'RETURNING *',
        [
          name !== undefined ? name : current.name,
          code !== undefined ? code : current.code,
          price !== undefined ? Number(price) : current.price,
          description !== undefined
            ? description
            : current.description,
          imagePath,
          inStock !== undefined
            ? inStock === 'true'
            : current.in_stock,
          req.params.id
        ]
      );

      res.json(
        toApiShape(result.rows[0])
      );

    } catch (err) {
      console.error('PUT product error:', err);

      res.status(500).json({
        error: err.message || 'Failed to update product.'
      });
    }
  }
);

// ---------- DELETE PRODUCT ----------

router.delete(
  '/:id',
  adminAuth,
  async function (req, res) {
    try {
      const result = await pool.query(
        'DELETE FROM products WHERE id = $1 RETURNING id',
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Product not found.'
        });
      }

      res.json({
        message: 'Product deleted.'
      });

    } catch (err) {
      console.error('DELETE product error:', err);

      res.status(500).json({
        error: 'Failed to delete product.'
      });
    }
  }
);

module.exports = router;
```
