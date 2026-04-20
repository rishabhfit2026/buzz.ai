# Buzz.ai

Buzz.ai is a location-based local commerce platform. It helps neighborhood shops create digital storefronts, helps customers discover nearby stores by city, and lets them place orders from local inventory through a single marketplace experience.

This repository contains the complete MVP codebase:

- `frontend/`: customer and shopkeeper web app built with React, Vite, and Tailwind CSS
- `backend/`: REST API built with Node.js and Express
- `backend/data/db.json`: local JSON fallback datastore for development when MongoDB is not available

## What The Company Does

Buzz.ai is building an AI-powered local marketplace for small and mid-sized offline businesses.

Core business use cases:

- A grocery owner creates a shop, uploads products, and starts receiving orders from nearby customers.
- A PG or hostel operator lists rooms, services, and related nearby businesses.
- A food outlet or neighborhood service provider reaches local demand without building its own app.
- Customers select a city, browse nearby stores, compare inventory, and place orders quickly.

The product direction is to become a local commerce operating system, not just a listing directory.

That means Buzz.ai can grow into:

- local store discovery
- digital catalog management
- ordering and fulfillment
- delivery coordination
- payments and subscriptions
- AI recommendations and local ad placement

## Why This Can Become A Business

The market problem is straightforward:

- most local shops still operate on WhatsApp, phone calls, and walk-ins
- many cannot afford custom software
- customers want nearby delivery and trusted local inventory
- hyperlocal demand is fragmented across many small sellers

Buzz.ai sits between local demand and fragmented supply.

## How Buzz.ai Becomes Profitable

Buzz.ai should not rely on one revenue stream. A durable model is:

1. Commission on every order
   - Take a small percentage from each completed order.
   - Example: 5% to 12% depending on category and delivery involvement.

2. Shopkeeper subscriptions
   - Free plan for basic listing.
   - Paid plan for advanced analytics, better ranking, more product uploads, CRM tools, and promotions.

3. Delivery margin
   - Charge customers a delivery fee and optimize routing or partner delivery operations later.

4. Sponsored listings
   - Shops pay to appear higher in category and location searches.

5. SaaS tooling for merchants
   - Inventory management, demand forecasting, WhatsApp automation, CRM, repeat-customer campaigns.

6. Fintech and payment revenue later
   - Transaction fees, instant settlement, working capital products, merchant lending partnerships.

7. AI recommendation layer
   - Personalized recommendations increase basket size and conversion rate, which raises commission revenue.

## MVP Scope In This Repo

This codebase is intentionally an MVP and focuses on the part that must work first:

- email/password signup and login
- customer and shopkeeper roles
- shop creation with city and state
- product creation with image upload
- city-based marketplace filtering
- cart and basic order placement
- shopkeeper order dashboard

The following are not implemented yet:

- live payments
- real delivery assignment
- live GPS tracking
- admin panel
- advanced AI recommendations
- production-grade notifications

## Tech Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: Node.js + Express
- Auth: JWT
- Uploads: Multer local uploads
- Data:
  - production target: MongoDB
  - current local fallback: JSON datastore for instant development

## Current Backend Behavior

The backend now supports two modes:

1. MongoDB mode
   - If `MONGODB_URI` points to a working MongoDB instance, the app will use MongoDB.

2. Local JSON fallback mode
   - If MongoDB is missing or unreachable, the API automatically falls back to `backend/data/db.json`.
   - This is useful for development, demos, and quick testing.

That fallback is why the app can run locally even if `mongod` is not installed.

## Project Structure

```text
buzz-ai/
  backend/
    data/
    src/
    uploads/
  frontend/
```

## Backend Requirements For Production

For backend deployment, these are the things you need to provide:

1. A running MongoDB database
   - Best option: MongoDB Atlas connection string
   - Example:
     - `MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/buzz-ai`

2. A strong JWT secret
   - Example:
     - `JWT_SECRET=replace-with-a-long-random-secret`

3. The frontend URL
   - Used for CORS
   - Example:
     - `CLIENT_URL=https://your-frontend-domain.vercel.app`

4. Port configuration on the hosting platform
   - Usually supplied automatically by Render, Railway, or similar providers

## Required Backend Environment Variables

Copy `backend/.env.example` to `backend/.env` for local development.

Required variables:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/buzz-ai
JWT_SECRET=replace-with-a-long-secret
CLIENT_URL=http://localhost:5173
```

For production, replace those with real values.

## Frontend Configuration

The frontend can run without extra configuration locally.

Optional frontend environment variables:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SERVER_URL=http://localhost:5000
```

If these are not set, the frontend defaults to local backend URLs.

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Copy the backend env file:

```bash
cp backend/.env.example backend/.env
```

3. Start the backend:

```bash
npm run dev:backend
```

4. Start the frontend:

```bash
npm run dev:frontend
```

5. Open:

```text
http://localhost:5173
```

## API Overview

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/health`
- `GET /api/shops`
- `GET /api/shops/mine`
- `POST /api/shops`
- `GET /api/shops/:shopId/products`
- `POST /api/products`
- `PATCH /api/products/:productId`
- `GET /api/orders/mine`
- `POST /api/orders`
- `PATCH /api/orders/:orderId/status`

## Deployment Recommendation

Do not deploy the full stack on GitHub Pages. GitHub Pages can only host static frontend files. It cannot run the Express backend.

Recommended deployment split:

- Frontend: Vercel
- Backend: Render or Railway
- Database: MongoDB Atlas

Why:

- Vercel is strong for React frontend deployment
- Render or Railway is much better for long-running Node.js APIs
- MongoDB Atlas gives you a managed production database

## Suggested Launch Architecture

- Frontend on `buzz-ai.vercel.app`
- Backend on `api-buzz-ai.onrender.com`
- Database on MongoDB Atlas

Then set:

```env
CLIENT_URL=https://buzz-ai.vercel.app
VITE_API_URL=https://api-buzz-ai.onrender.com/api
VITE_SERVER_URL=https://api-buzz-ai.onrender.com
```

## Launch Strategy

Do not try to launch every category at once.

Start with:

- one city: Bhilai
- one category: grocery or PG
- a small number of trusted merchants
- manual operations behind the scenes

That is how you validate demand before building heavy logistics.

## Long-Term Product Roadmap

After MVP, the strongest next steps are:

1. real merchant onboarding
2. payment integration
3. delivery workflow
4. admin dashboard
5. AI recommendations
6. merchant analytics
7. repeat-order engine
8. referral and loyalty programs

## Notes

- Product images are stored in `backend/uploads` locally.
- The current repository is structured for fast MVP iteration, not enterprise-scale infra yet.
- If you want, the next step should be deployment setup, not more random features.
