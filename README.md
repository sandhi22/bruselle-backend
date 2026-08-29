# Bruselle Backend

Node.js + Express API for the Bruselle store: products (with photo upload), and
a simulated checkout/payment flow you can later swap for a real gateway
(bKash, Nagad, SSLCommerz, Stripe).

## What this does right now

- Add / edit / delete products with a photo, via `public/admin.html`
- Public `GET /api/products` for the storefront to fetch products
- `POST /api/orders` — customer places an order (status: `pending`)
- `POST /api/orders/:id/simulate-payment` — stands in for a real payment
  gateway callback. Marks the order `paid` immediately. **No real money moves.**

## 1. Install dependencies

```bash
npm install
```

## 2. Get a free MongoDB database

1. Go to https://www.mongodb.com/cloud/atlas and create a free account.
2. Create a free "M0" cluster.
3. Under **Database Access**, create a database user + password.
4. Under **Network Access**, allow access from anywhere (`0.0.0.0/0`) for now.
5. Click **Connect → Drivers**, copy the connection string.

## 3. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in:
- `MONGODB_URI` — the connection string from step 2
- `ADMIN_KEY` — any secret string you choose; this is your admin password
- `ALLOWED_ORIGINS` — the URL(s) your frontend will run on

## 4. Run it locally

```bash
npm run dev
```

Visit `http://localhost:4000/admin.html` to add your first products.

## 5. Deploy for free

[Render](https://render.com) has a free tier for small Node apps:

1. Push this `bruselle-backend` folder to its own GitHub repo.
2. On Render: **New → Web Service** → connect the repo.
3. Build command: `npm install`. Start command: `npm start`.
4. Add the same environment variables from your `.env` file in Render's dashboard.
5. Once deployed, your API lives at something like
   `https://bruselle-api.onrender.com`.

Free-tier note: Render's free web services "sleep" after inactivity and take
a few seconds to wake up on the next request — fine for a portfolio/demo, not
for a live paying store.

## 6. Connect the frontend

In the storefront's `index.html`, set the `API_BASE` constant near the top of
the `<script>` block to your deployed backend URL, e.g.:

```js
const API_BASE = 'https://bruselle-api.onrender.com';
```

## Adding a real payment gateway later

Replace the logic in `routes/orders.js` (`/simulate-payment`) with the real
gateway's flow:

1. Open a merchant account with SSLCommerz, bKash Merchant, or Stripe
   (requires business/KYC verification — this has to be done by you, the
   business owner, not by a developer or AI on your behalf).
2. They'll give you API keys and a webhook/callback URL format.
3. On checkout, call their "create payment" API instead of
   `simulate-payment`, then verify their webhook and set
   `order.status = 'paid'` only after they confirm the transaction.
