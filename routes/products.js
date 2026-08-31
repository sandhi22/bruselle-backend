const express = require('express');
const multer = require('multer');
const { pool } = require('../db');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// Store uploaded image in memory instead of Render's filesystem
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ];

    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, or WEBP images are allowed.'));
    }
  },
});

// Convert database row to frontend format
function toApiShape(row) {
  let imagePath = '';

  // New method: image stored directly in PostgreSQL
  if (row.image_data && row.image_type) {
    imagePath = `data:${row.image_type};base64,${row.image_data}`;
  }

  // Old method: keep existing image path as fallback
  else if (row.image_path) {
    imagePath = row.image_path;
  }

  return {
    _id: row.id,
    name: row.name,
    code: row.code,
    price: Number(row.price),
    description: row.description || '',
    imagePath,
    inStock: row.in_stock,
  };
}

// ---------- GET ALL PRODUCTS ----------

router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products ORDER BY created_at DESC'
    );

    res.json(result.rows.map(toApiShape));
  } catch (err) {
    console.error('GET products error:', err);

    res.status(500).json({
      error: 'Failed to load products.',
    });
  }
});

// ---------- CREATE PRODUCT ----------

router.post(
  '/',
  adminAuth,
  upload.single('image'),
  async (req, res) => {
    try {
      const {
        name,
        code,
        price,
        description,
        inStock,
      } = req.body;

      if (!name || !code || !price) {
        return res.status(400).json({
          error: 'name, code, and price are required.',
        });
      }

      let imageData = '';
      let imageType = '';

      if (req.file) {
        imageData = req.file.buffer.toString('base64');
        imageType = req.file.mimetype;
      }

      const result = await pool.query(
        `INSERT INTO products
        (
          name,
          code,
          price,
          description,
          image_path,
          image_data,
          image_type,
          in_stock
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
        [
          name,
          code,
          Number(price),
          description || '',
          '',
          imageData,
          imageType,
          inStock === undefined
            ? true
            : inStock === 'true',
        ]
      );

      res.status(201).json(
        toApiShape(result.rows[0])
      );

    } catch (err) {
      console.error('POST product error:', err);

      res.status(500).json({
        error:
          err.message ||
          'Failed to create product.',
      });
    }
  }
);

// ---------- UPDATE PRODUCT ----------

router.put(
  '/:id',
  adminAuth,
  upload.single('image'),
  async (req, res) => {
    try {
      const {
        name,
        code,
        price,
        description,
        inStock,
      } = req.body;

      const existing = await pool.query(
        'SELECT * FROM products WHERE id = $1',
        [req.params.id]
      );

      if (existing.rows.length === 0) {
        return res.status(404).json({
          error: 'Product not found.',
        });
      }

      const current = existing.rows[0];

      let imageData = current.image_data || '';
      let imageType = current.image_type || '';
      let imagePath = current.image_path || '';

      // If a new image is uploaded, replace the old image
      if (req.file) {
        imageData = req.file.buffer.toString('base64');
        imageType = req.file.mimetype;
        imagePath = '';
      }

      const result = await pool.query(
        `UPDATE products
         SET
           name = $1,
           code = $2,
           price = $3,
           description = $4,
           image_path = $5,
           image_data = $6,
           image_type = $7,
           in_stock = $8
         WHERE id = $9
         RETURNING *`,
        [
          name !== undefined
            ? name
            : current.name,

          code !== undefined
            ? code
            : current.code,

          price !== undefined
            ? Number(price)
            : current.price,

          description !== undefined
            ? description
            : current.description,

          imagePath,
          imageData,
          imageType,

          inStock !== undefined
            ? inStock === 'true'
            : current.in_stock,

          req.params.id,
        ]
      );

      res.json(
        toApiShape(result.rows[0])
      );

    } catch (err) {
      console.error('PUT product error:', err);

      res.status(500).json({
        error:
          err.message ||
          'Failed to update product.',
      });
    }
  }
);

// ---------- DELETE PRODUCT ----------

router.delete(
  '/:id',
  adminAuth,
  async (req, res) => {
    try {
      const result = await pool.query(
        `DELETE FROM products
         WHERE id = $1
         RETURNING id`,
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'Product not found.',
        });
      }

      res.json({
        message: 'Product deleted.',
      });

    } catch (err) {
      console.error('DELETE product error:', err);

      res.status(500).json({
        error: 'Failed to delete product.',
      });
    }
  }
);

module.exports = router;