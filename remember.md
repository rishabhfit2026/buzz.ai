# Buzz.ai Repository Memory

This file is the working memory for future sessions in this repository.

## Mission

Buzz.ai is being built as a location-based local marketplace for India, starting with Bhilai.

The goal is not to copy Flipkart feature-for-feature right now. The real mission is:

- onboard local shops into digital storefronts
- let customers browse nearby merchants by city
- support ordering from local inventory
- build toward payments, delivery, and AI recommendations later

Current go-to-market focus:

- city-first rollout
- Bhilai first
- local commerce first
- fast MVP execution over heavy infrastructure

## Product Direction

Buzz.ai should evolve toward a local commerce operating system with:

- merchant onboarding
- digital catalogs
- cart and ordering
- repeat ordering
- hyperlocal discovery
- merchant growth tools
- ads / boosts / subscriptions
- payments and delivery later

Do not overbuild enterprise complexity before demand is validated.

## Current State Of The Codebase

The repository already contains:

- React + Vite + Tailwind frontend
- Node.js + Express backend
- JWT auth
- shop creation
- product creation
- city-based marketplace filtering
- customer cart and ordering
- shopkeeper order views
- local JSON datastore fallback when MongoDB is unavailable
- Bhilai shop importer using OpenStreetMap

Important current behavior:

- if MongoDB is not reachable, backend falls back to `backend/data/db.json`
- this fallback is intentional for local development and demos

## Current Data Seeding

There is an importer script:

- `backend/scripts/import-bhilai-shops.mjs`

It currently:

- resolves Bhilai from Nominatim
- queries Overpass API mirrors
- imports discovered shops into the local JSON store
- creates starter products for each imported shop

Reality note:

- this does not guarantee 1000 high-quality shops
- open map data is useful for bootstrap discovery, not full merchant acquisition
- for larger real coverage, use merchant onboarding or a commercial places source such as Google Places API

## UI Direction

The UI should feel like a marketplace, not a form dashboard.

That means:

- stronger e-commerce layout
- discovery-first browsing
- prominent categories and shops
- cleaner product cards
- less “admin panel” feeling on the customer side

Do not drift into generic corporate SaaS styling.

## Business Priorities

The commercial model should grow around:

- order commissions
- merchant subscriptions
- sponsored listings
- merchant software tools
- delivery margin later
- payment / fintech revenue later

## Deployment Direction

Do not try to deploy the full stack on GitHub Pages.

Preferred production split:

- frontend on Vercel
- backend on Render or Railway
- database on MongoDB Atlas

Required production backend inputs:

- `MONGODB_URI`
- `JWT_SECRET`
- `CLIENT_URL`

Optional frontend env:

- `VITE_API_URL`
- `VITE_SERVER_URL`

## What To Do First In Future Sessions

When opening this repo again, prioritize work in this order:

1. Verify local app still runs:
   - `npm run dev:backend`
   - `npm run dev:frontend`
2. Check whether the marketplace is loading Bhilai shops.
3. Preserve the local JSON fallback unless production MongoDB is being introduced.
4. Push the product toward real marketplace behavior, not random feature sprawl.
5. If the user wants more shops, prefer a proper importer or merchant onboarding flow.
6. If the user wants deployment, move to Vercel + Render/Railway + MongoDB Atlas.

## Guardrails

- Do not silently revert user data changes in `backend/data/db.json`.
- Do not claim “Flipkart-scale” readiness; keep the work grounded in MVP reality.
- Do not scrape Google Maps directly.
- If Google data is needed, use Google Places API with a user-provided key.
- Keep README accurate when the architecture or business plan changes.

## Git Notes

Remote repository:

- `https://github.com/rishabhfit2026/buzz.ai`

Branch currently used for direct work:

- `main`

## Intent

This repo should always move toward a better local-commerce startup product:

- better merchant discovery
- better onboarding
- better catalog quality
- better user conversion
- better deployment readiness

If there is ambiguity, choose the action that improves the real product and keeps momentum.
