const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      price NUMERIC NOT NULL,
      description TEXT DEFAULT '',
      image_path TEXT DEFAULT '',
      image_data TEXT DEFAULT '',
      image_type TEXT DEFAULT '',
      in_stock BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);

  // Add image columns to an existing products table
  await pool.query(`
    ALTER TABLE products
    ADD COLUMN IF NOT EXISTS image_data TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS image_type TEXT DEFAULT '';
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      items JSONB NOT NULL,
      total NUMERIC NOT NULL,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      payment_meta JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW()
    );
  `);
}

module.exports = { pool, initDb };