const express = require('express');
const Order = require('../models/Order');
const adminAuth = require('../middleware/adminAuth');

const router = express.Router();

// POST /api/orders - customer places an order (status starts as "pending")
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

    const order = await Order.create({
      items,
      total,
      customerName,
      phone,
      address,
      status: 'pending',
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create order.' });
  }
});

// POST /api/orders/:id/simulate-payment
// Stands in for a real payment gateway callback (bKash/SSLCommerz/Stripe webhook).
// Marks the order "paid" instantly instead of talking to a real gateway.
// Swap this out for the real gateway's verify/webhook logic once a merchant account exists.
router.post('/:id/simulate-payment', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    order.status = 'paid';
    order.paymentMeta = {
      simulated: true,
      method: 'demo-gateway',
      confirmedAt: new Date().toISOString(),
    };
    await order.save();

    res.json(order);
  } catch (err) {
    res.status(500).json({ error: 'Failed to confirm payment.' });
  }
});

// GET /api/orders - admin: view all orders
router.get('/', adminAuth, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load orders.' });
  }
});

module.exports = router;
