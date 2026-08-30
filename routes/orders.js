const express = require('express');
const { pool } = require('../db');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

function toApiShape(row) {
  return {
    _id: row.id,
    items: row.items,
    total: Number(row.total),
    customerName: row.customer_name,
    phone: row.phone,
    address: row.address,
    status: row.status,
    paymentMeta: row.payment_meta,
  };
}

router.post('/', async (req, res) => {
  try {
    const { items, customerName, phone, address } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty.' });
    }
    if (!customerName || !phone || !address) {
      return res.status(400).json({ error: 'customerName, phone, and address are required.' });
    }

    const total = items.reduce((sum, item) => sum + item.price * item.qty, 0);

    const result = await pool.query(
      `INSERT INTO orders (items, total, customer_name, phone, address, status)
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
      [JSON.stringify(items), total, customerName, phone, address]
    );

    res.status(201).json(toApiShape(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Failed to create order.' });
  }
});

router.post('/:id/simulate-payment', async (req, res) => {
  try {
    const paymentMeta = {
      simulated: true,
      method: 'demo-gateway',
      confirmedAt: new Date().toISOString(),
    };

    const result = await pool.query(
      `UPDATE orders SET status = 'paid', payment_meta = $1 WHERE id = $2 RETURNING *`,
      [JSON.stringify(paymentMeta), req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Order not found.' });
    res.json(toApiShape(result.rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Failed to confirm payment.' });
  }
});

router.get('/', adminAuth, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
    res.json(result.rows.map(toApiShape));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load orders.' });
  }
});

module.exports = router;