# manilasbkoverdose

Next.js + TypeScript ticketing example app with:
- Next 13+ (app router) frontend
- NextAuth (MongoDB adapter) for authentication (Google & Email)
- MongoDB / Mongoose for persistence
- Server + client cart sync and localStorage fallback
- Minimal order creation + Wise deposit flow
- Simple discount validation API

This README summarizes how the project is organized, required environment variables, available scripts, important APIs, and developer notes.

## Quick start

1. Install deps:
```bash
npm install
# or
pnpm install
```

2. Create a `.env.local` with the variables below.

3. Run the dev server:
```bash
npm run dev
# or
pnpm dev
```

Open http://localhost:3000

## Required environment variables

Create a `.env.local` with at least:

- `MONGODB_URI` — Mongo connection string
- `NEXTAUTH_SECRET` — random secret for NextAuth
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `EMAIL_SERVER` — SMTP URL (for EmailProvider)
- `EMAIL_FROM` — from email for magic links / emails

Optional / additional:
- `DATABASE_NAME` (if you prefer to set DB explicitly)
- `ANY_OTHER_API_KEYS` (e.g. Wise) used by your deployment

## Scripts

- `npm run dev` — start development server
- `npm run build` — build for production
- `npm start` — start production server (after build)
- `npm run lint` — lint project

(Adjust according to package.json if different.)

## File layout (important files)

- `src/app` — Next.js app routes & pages (app router)
- `src/contexts/CartContext.tsx` — cart context: CartItem type, client/localStorage and server sync
- `src/lib/authOptions.ts` — NextAuth configuration and callbacks (MongoDBAdapter, Google & Email providers)
- `src/models/*` — Mongoose models (Ticket schema shown in project)
- `src/app/tickets/main.tsx` — tickets listing and UI (uses TicketType)
- `src/pages/api/*` or `src/app/api/*` — API routes:
  - `/api/tickets` — list/create tickets
  - `/api/cart` — GET/POST/PATCH/DELETE cart operations (server-side cart for logged-in users)
  - `/api/orders` — create orders
  - `/api/discounts/validate` — validate discount codes

## Data types (high level)

Ticket (example):
```ts
type Ticket = {
  _id: string;
  eventId?: string;
  name: string;
  price: number;
  currency: string;
  quantity: number;
  sold: number;
  metadata?: Record<string, unknown>;
  createdAt?: string | Date;
  updatedAt?: string | Date;
};
```

CartItem (example):
```ts
type CartItem = {
  ticketName: string;
  ticketPrice: number;
  ticketCurrency: string;
  ticketId: string;
  quantity: number;
  discountCode?: string | null;
  discountedPrice?: number | null;
};
```

## Auth / User model notes

- NextAuth is configured with MongoDBAdapter and providers (Google, Email).
- authOptions callbacks extend the jwt and session to expose `role` and `profileComplete`. The User type in your app should include `role?: 'user'|'admin'|'vendor'` and `profileComplete?: boolean` to avoid TypeScript errors when the session/user objects are augmented.

## Cart behavior

- Guests: cart saved in localStorage by CartContext.
- Authenticated users: cart persisted via /api/cart (Mongo-backed).
- CartContext merges local and server flows and provides helpers: addToCart, removeFromCart, clearCart, updateQuantity.

## API contract (summary)

/api/cart
- GET — returns `{ items: CartItem[] }`
- /api/cart (POST) — body `{ ticketId, ticketName, ticketPrice, ticketCurrency, quantity, discountCode? }`
- /api/cart (PATCH) — adjust quantity by delta or set absolute depending on implementation
- /api/cart?ticketId=ID (DELETE) — remove item or clear (no ticketId)

Other endpoints:
- /api/tickets — GET tickets list
- /api/orders — POST to create an order; accepts ticketId, quantity, paymentLink, depositInstructions
- /api/discounts/validate — POST `{ ticketId, code }` → returns discountedPrice or error

Check src/pages/api or src/app/api to confirm exact shapes.

## Development notes & tips

- Keep server and client DTOs consistent. CartContext expects complete CartItem objects for local state — when adding a local-only item ensure you populate all required fields (name, price, currency).
- If you augment session.user with custom fields (role, profileComplete), extend NextAuth types in a global.d.ts or next-auth.d.ts to avoid TypeScript complaints.
- Mongoose connect helpers (connectMongoose) are used in NextAuth callbacks — ensure your DB connection is stable to avoid callback errors.
- To seed tickets, create a simple script or POST to /api/tickets in dev.

## Testing & linting

- Add tests under a `tests/` or `__tests__/` folder as needed.
- Use eslint / prettier configs in project root.

## Deployment

- Deploy to Vercel or another Node host. Ensure environment variables are set in the host.
- Use a managed MongoDB instance (Atlas) and set MONGODB_URI accordingly.
- For NextAuth email provider to work in production, configure a real SMTP server and a valid EMAIL_FROM.

## Contributing

- Fork, branch, and submit PRs.
- Keep types in sync between backend models and frontend DTOs.
- Prefer small, focused commits and include tests for changes to API behavior.
