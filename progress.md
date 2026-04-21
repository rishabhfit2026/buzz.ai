# Buzz.ai Progress

This file tracks the current product and engineering state of the repository.

## Current Product State

Buzz.ai is currently positioned as a Bhilai-first local marketplace MVP.

The main customer-facing experience now includes:

- Flipkart-inspired homepage structure
- category browsing
- locality-based Bhilai merchant discovery
- featured seller sections
- storefront-style product browsing
- cart and order placement
- customer order tracking UI
- shopkeeper-side order status updates

## Current Demo State

The application is demoable locally with the current JSON fallback datastore.

Current demoable behavior:

- imported Bhilai-area shops render on the marketplace homepage
- imported seed products can be browsed from selected shops
- customers can add products to cart and place orders
- shopkeepers can update order status from `pending` to `confirmed` to `delivered`
- customer delivery cards react visually to status updates

## Delivery Tracking Status

Delivery tracking is currently a UI-level experience, not a real GPS delivery network.

What exists now:

- route-style delivery visualization
- sidebar delivery preview
- order-level route tracking card
- delivery steps and ETA text based on order status
- bullet-train-style delivery marker for visible motion in demo mode
- fallback demo tracking state when no live customer order exists yet

What does not exist yet:

- rider assignment model
- live location coordinates
- socket-based updates
- map provider integration
- actual navigation routing

## Backend Progress

Current backend behavior:

- Express API is working
- JSON fallback datastore is working
- CORS supports localhost and local-network frontend access
- shop, product, auth, and order routes are active
- order status updates are working for shopkeepers

Current backend work in progress:

- shop branding persistence support has been started
- `logoUrl` and `coverImageUrl` support is partially wired on the backend
- shop branding upload routes are in progress and need full frontend integration before they are considered complete

## Frontend Progress

Completed frontend work:

- homepage redesign
- improved marketplace density and merchandising layout
- seller shelves and discovery sections
- better handling of empty search/filter states
- improved shop card branding with generated initials
- promoted delivery tracker into the main customer flow

Current frontend gap:

- real merchant photos/logos are not populated for most shops
- uploaded branding management is not fully exposed in the seller UI yet

## Data Status

Current Bhilai marketplace data comes primarily from imported OpenStreetMap shop records.

Current limitations:

- merchant records do not include universally approved real logos or cover photos
- some locality inference is heuristic-based from names, descriptions, and addresses
- imported merchant quality depends on source map quality

## Recommended Next Steps

Priority next steps:

1. Finish end-to-end shop branding upload support in backend and frontend.
2. Add seller-side shop media management for logo and cover image.
3. Introduce a rider/delivery entity if real-time delivery simulation is needed.
4. Add polling or websocket updates for order tracking.
5. Integrate official Google Places photos only if a valid API key is provided.

## Validation Snapshot

Most recent local checks completed during this session:

- frontend production build passes
- backend serves Bhilai shop data from JSON fallback
- frontend and backend both run locally for demo usage
