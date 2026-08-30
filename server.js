require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { pool, initDb } = require('./db');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');

const app = express();
const PORT = process.env.PORT || 4000;

// ---------- Middleware ----------
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
  })
);
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// ---------- Routes ----------
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ---------- Start ----------
async function start() {
  try {
    await pool.query('SELECT NOW()');
    console.log('Connected to PostgreSQL');
    await initDb();
    console.log('Database tables ready');
    app.listen(PORT, () => console.log(`Bruselle backend running on port ${PORT}`));
  } catch (err) {
    console.error('Database connection failed:', err.message);
    process.exit(1);
  }
}

start();