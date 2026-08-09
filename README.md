# HamroMenu 2.0

A QR-based smart restaurant ordering & management platform. A customer sits at a restaurant table, scans the table's QR code, browses the digital menu on their phone, orders, watches the progress live, and pays with eSewa / Khalti / card / cash / pay-after-meal. Meanwhile the restaurant gets four role-specific work surfaces — customer, staff, kitchen and admin — plus a public marketing landing page, all update in real time over Socket.io.

This README explains how the whole system works: the architecture, every feature, and how the pieces fit together.

---

## System overview — how it works

```
Customer phone                          Restaurant side
─────────────────                       ───────────────────────────────
1. Scan table QR ──────────┐
   /order?r=<rest>&t=<tab> │
2. Browse menu (search,    │
   veg filter, categories)  │
3. Add to cart             │
4. Apply coupon            │
5. Checkout / pay          │        Staff sees new order (real-time)
6. Place order ────────────┼──────▶ Kitchen sees order in queue
7. Track live status ◄─────┼─────── Staff confirms → sends to kitchen
   (pending→confirmed→     │        Kitchen prepares → marks ready
    preparing→ready→served)│        Staff serves food, generates bill,
8. Pay, review, rate       │        collects cash when ready
                           └────── Admin manages everything
```

The whole thing runs on **two apps** that talk over a REST API:

- **`/server`** — an Express + MongoDB API. All business logic lives here (auth, menus, carts, orders, payments, analytics). It also hosts the Socket.io realtime layer for live order updates.
- **`/client`** — a Next.js (App Router) front-end. Four role dashboards plus the customer ordering experience and a public landing page.

A customer flow runs roughly like this: `menu → cart → checkout → order → live track → pay`, and the restaurant flow mirrors it through `staff confirm → kitchen cook → staff serve → settle the bill`.

---

## Tech Stack

| Layer     | Tech                                                              |
| --------- | ----------------------------------------------------------------- |
| Frontend   | Next.js (App Router), React, plain JavaScript, Tailwind CSS        |
| Backend    | Node.js + Express, object-oriented architecture                    |
| Database   | MongoDB + Mongoose                                                |
| Images     | Cloudinary (only `secure_url` + `public_id` stored in DB)          |
| Auth       | JWT (access + refresh), role-based (customer / staff / kitchen / admin) |
| Realtime   | Socket.io (order status pushed live to customer, staff & kitchen)  |
| QR         | `qrcode` (encodes restaurant ID + table ID)                       |
| Payments   | eSewa + Khalti (sandbox), card (Stripe scaffold), cash & pay-after-meal |

---

## Repository layout

```
HamroMenu/
├─ server/                 Express API
│  └─ src/
│     ├─ config/           env config, MongoDB connection, socket, cloudinary
│     ├─ models/           Mongoose schemas (users, restaurant, menu, order, …)
│     ├─ repositories/     data-access layer (BaseRepository + domain repos)
│     ├─ services/         business logic (Auth, Menu, Cart, Order, Payment, …)
│     ├─ controllers/      thin HTTP adapters that only call services
│     ├─ routes/           API routes + role guards
│     ├─ middleware/       auth, role guard, validation, error handler
│     ├─ utils/            ApiError, ApiResponse, asyncHandler, JWT helpers
│     ├─ seed/             demo data (restaurant, menu, tables, accounts)
│     └─ server.js         app bootstrap (Express + Socket.io)
├─ client/                 Next.js app (customer + all dashboards + landing)
└─ README.md
```

### Backend layered architecture (server-side OOP)

The server follows a strict layered pattern — each layer only talks to the one below it, which keeps the whole thing testable and predictable:

```
route → controller → service → repository → Mongoose model → MongoDB
        (HTTP)        (business    (data
                       logic)       access)
```

- **Models** (`models/`) — Mongoose schemas. The four user roles (customer, staff, kitchen, admin) are built from one shared `UserBase` schema factory so auth code can treat them consistently.
- **Repositories** (`repositories/`) — a generic `BaseRepository` implementing CRUD + paginate/aggregate/distinct, extended by domain repos (e.g. `OrderRepository` knows how to generate the daily `HMYYMMDD-NNNN` order number).
- **Services** (`services/`) — the business layer. These are singletons (`export default new XService()`). Controllers never touch Mongo directly.
- **Controllers** (`controllers/`) — validate incoming request bodies (express-validator), call one service, and reply with a standard `ApiResponse` envelope.
- **Routes** (`routes/`) — Map URLs to controllers and enforce roles with `authorize(...roles)`. Every route except the public ones (menu/reviews/auth) sits behind `auth`.

**Utilities:** `ApiError` (with machine-readable `ErrorCodes`), `ApiResponse` (unified response shape), `asyncHandler` (async error forwarding), and an `errorHandler` middleware that maps Mongoose/JWT errors into the same envelope.

---

## Users — the four roles

| Role     | What they see / do                                                                 |
| -------- | ---------------------------------------------------------------------------------- |
| Customer | Scan QR, browse menu, order, pay, live-track orders, favorites, reviews, profile   |
| Staff    | Confirm orders, send them to kitchen, serve food, generate bills, collect cash, tables |
| Kitchen  | See the cooking queue, accept orders, mark items / orders ready                      |
| Admin    | Overview analytics, full menu & category CRUD, tables + QR codes, orders, coupons, staff & kitchen team, reports, restaurant settings, payments |

**Demo accounts** (password `password123`):

| Role    | Email                            |
| ------- | -------------------------------- |
| Admin   | admin@himalayanflavors.com       |
| Staff   | staff@himalayanflavors.com       |
| Kitchen | kitchen@himalayanflavors.com     |
| Customer| customer@himalayanflavors.com    |

Auth is JWT-based: a short-lived **access token** (15 min) plus a **refresh token** (7 days) that is stored (rotated on every refresh) and revoked on logout. Passwords are stored bcrypt-hashed; changing or resetting a password invalidates all previously-issued tokens. Login is role-aware: after sign-in the user is routed to their role's dashboard (`/admin`, `/staff`, `/kitchen`, `/account`).

---

## The order lifecycle (the heart of the system)

Every order advances through a fixed status machine. The model (`Order.js`) enforces a whitelist of legal transitions and logs every change into a `statusHistory` audit, so nothing can skip a step:

```
pending → confirmed → preparing → ready → served → completed  (done)
   └───────────────→ cancelled   (any non-terminal step)
```

Your journey through the lifecycle:

1. **Scan QR** — Each table (created in Admin → Tables & QR) has a QR that encodes `/order?r=<restaurantId>&t=<tableId>`. Scanning it loads the exact menu of that restaurant with the table pre-attached.
2. **Customer places an order** — picks dishes from the menu, edits quantities/options, applies a coupon, chooses a payment method, adds kitchen notes, then submits. The server snapshots the whole cart into the Order, computes subtotal / discount / tax (13%) / service charge (10%) / grand total, sets `prepTimeTotal` + `estimatedReadyAt`, marks the **table occupied**, bumps each item's popularity counter, marks the coupon used, clears the cart, and fires an `order:new` socket event to the restaurant.
3. **Staff sees it** — the staff dashboard hears `order:new` live, confirms the order, and sends it to the kitchen.
4. **Kitchen cooks it** — the kitchen queue shows pending/confirmed/preparing/ready orders with elapsed-time and per-item prep times. The kitchen accepts (pending→confirmed→preparing), then marks each item ready; when everything is ready the whole order is marked **ready**.
5. **Staff serves it** — on `ready`, staff serve it → order becomes **served**, which frees the table.
6. **Bill & payment** — staff open a printable bill, collect cash (which completes the order), or the customer already paid online at checkout.
7. **The customer watches all of this live** — the tracking screen shows the 5-step stepper and an ETA (`estimatedReadyAt`), updating in real time over Socket.io.
8. **Rated & reviewed** — the customer can leave a review (1–5 stars) which the admin sees before publishing.

Because the table is coupled to the order, occupancy is always consistent: an order occupies its table, and serving of the order frees it.

---

## Customer features

### Landing page (`/`)
Marketing homepage: hero, "How it works" (Scan → Browse → Order → Track), featured dishes pulled live from the API, and testimonials. The "View Menu" / "Order now" buttons deep-link into the order flow.

### Digital menu (`MenuBrowser`)
- Searchable, veg-only toggle
- Category chips with scroll-spy
- Dish cards with one-tap quick-add, veg/spicy badges, popularity tags
- Dish detail modal: required options (with price deltas), quantity stepper, special instructions

### Cart (`CartSheet`)
A slide-over that shows each line item with quantity/remove, coupon input (server-validated), and a full totals breakdown (subtotal → discount → tax → service charge → grand total). Guests get a temporary local cart in `localStorage`; signed-in customers get a server-side cart.

### Checkout (`Checkout`)
Review summary, pick a payment method (pay-after-meal, eSewa, Khalti, cash), add kitchen notes, and place the order. If not signed in you're prompted to log in / register first (orders are per-customer).

### Live order tracking (`OrderTracker`)
After placing the order the UI swaps to a live tracker: 5-step stepper (pending → confirmed → preparing → ready → served), a pulsing "Updating live", a countdown to `estimatedReadyAt`, per-item breakdown and total, toasts on `ready` and `served`, and a reorder/profile screen once completed.

### Account (`/account`)
Any logged-in role. A profile card plus tabs:
- **Orders** — order history (paginated)
- **Favorites** — menu items you've hearted
- **Reviews** — reviews you've written
- **Profile** (`/account/profile`) — update name/phone/password

---

## Staff dashboard (`/staff`)

A live board (socket-fed) with two sections:

- **Orders** — cards per status with the right action:
  - Confirm an order
  - *Send to kitchen* (pending → confirmed → preparing)
  - *Serve food* (ready → served, frees the table)
  - **Collect cash** — records a cash payment and completes a served order
  - **Bill** — opens a printable receipt (window.print) on the `/staff/billing` page
- **Tables** — a grid showing every table (free / occupied) at a glance.

Staff also get the dashboard "tables with active orders" map to see which tables currently have a live order.

`RoleGuard` allows `admin` onto the staff dashboard too (an admin can act as staff).

---

## Kitchen dashboard (`/kitchen`)

- **Queue** — all _pending / confirmed / preparing / ready_ orders sorted oldest-first, with elapsed wait time, per-item prep time, special instructions, priority, and ETA.
- **Accept order** — `pending` → `confirmed` → `preparing` (auto-confirms + stamps `acceptedBy`).
- **Mark items ready** — per-line-item readiness; when every item is ready the order flips to `ready` automatically (and the staff/customer are notified).
- **Mark order ready** — for a manual "done" path, sends the order to **served-ready**.
- **Stats** — live pending / preparing / ready counts for a quick digest.

Admins are allowed onto the kitchen queue as well (`RoleGuard` accepts `admin`).

---

## Admin dashboard (`/admin`)

The control room, with these sub-pages (nav: Overview, Menu, Tables & QR, Orders, Coupons, Reports, Team, Settings):

### Overview
Six stat cards from `GET /admin/:id/overview`: total & today's revenue, total & active orders, total distinct customers, avg rating. Plus top-selling items and latest orders.

### Menu & Items
Full item and category CRUD: create/edit/delete dishes (name, price, prep time, veg, availability, spice level, featured/popular, options), manage categories, and upload images to Cloudinary.

### Tables & QR
List/add tables (label, number, capacity, area), and for each table **download / regenerate** its QR code (PNG). This is how customers get to `order?r=…&t=…`.

### Orders
All orders of the restaurant, filterable by status, with the ability to advance/cancel an order status directly through the flow.

### Coupons
Create discount codes (percentage or flat, with `minOrder`, `maxDiscount`, expiry) and edit/delete them. Applied server-side at cart time, snapshotted and marked _used_ when an order is placed.

### Team
Create staff and kitchen accounts (each with a role, restaurant, staffRole/station) that can then log in.

### Reports & analytics
In-file analytics, no plugins, all powered by `GET /admin/:id/reports`:
- Revenue by day (bar)
- Order-status breakdown (bar)
- Peak hours (24-hour heatmap of order frequency)
- Table turnover (orders + revenue per table)

### Settings
Edit the restaurant profile (name, tagline, description, contact, address, logo/cover) and flip the "Open now" toggle — the "open status" shown to customers on the menu header.

---

## Payments — how each method works

The payment design has two paths: **online, verified via gateway** and **on-premise, offline**.

- **eSewa** — the client initializes a payment, the customer is taken to the gateway, and on return the server recomputes the HMAC-SHA256 signature from `total_amount, transaction_uuid, product_code` (sandbox) and marks the order paid only if it matches.
- **Khalti** — the client uses the Khalti widget with the public key; the server verifies the token against Khalti's API and only marks paid for `Completed`/`Verified` states.
- **Card (Stripe)** — currently a scaffold returning the publishable key; server-side capture is not implemented.
- **Cash** — the staff "Collect cash" action (`/staff/orders/:id/collect-cash`) creates a Payment record (if missing), the Payment is marked `cash`, and the order is completed.
- **Pay-after-meal** — default; the order stays `unpaid` and the invoice Payment is `pending` until settled later.

On success the payment service marks the order `paid`, and emits `payment:success` to both restaurant and customer rooms.

---

## Realtime (Socket.io)

- **`join`** — clients join `restaurant:<id>` (also `kitchen:<id>`) or `customer:<id>` rooms.
- **Events** (server → client): `order:new`, `order:status`, `order:item-status`, `payment:success`.
- The customer tracker, staff board, and kitchen queue all listen for these and re-render live without refreshing the page.

---

## Auth, security & validation

- `auth` middleware extracts the Bearer token and attaches the user; `authorize(role…)` checks roles; `optionalAuth` allows anonymous access to public endpoints.
- Registration is role-specific (`/auth/register/customer`, `/auth/register/staff`, `/auth/register/kitchen`), each guarded for who may create whom.
- Password reset: forgot-password issues a one-time, 10-minute reset token (SHA-256 stored); the reset flow probes all role collections for it.
- Uploads are validated (whitelisted image types, ≤5MB) before going to Cloudinary.
- Validation errors, JWT errors, and duplicate keys are normalized by a global error handler into one response model.

---

## Seed data

Run `npm run seed` once (or `npm run seed:reset` to wipe and reseed) and you get:

- **Himalayan Flavors** restaurant (Thamel, Kathmandu; 13% tax / 10% service charge; 7-day hours) with Unsplash logo/cover
- **7 categories / 30 real dishes** with prices (NPR 90–650), prep times, veg flags, spice levels, featured/popular tags
- **12 tables** with generated QR codes (Terrace / Main Hall / Garden)
- **4 demo users** (admin/staff/kitchen/customer) + a second demo customer
- **3 coupons**: `WELCOME10`, `MOMO50`, `FEAST20`

---

## Getting started

### Prerequisites
- Node 20+
- MongoDB running locally (`mongodb://127.0.0.1:27017`)

### 1. Backend

```bash
cd server
cp .env.example .env      # add your secrets
npm install
npm run seed              # demo data (or npm run seed:reset to wipe)
npm run dev               # http://localhost:5000
```

### 2. Frontend

```bash
cd client
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm install
npm run dev               # http://localhost:3000
```

### Demo flow
1. Open the landing page (`/`) → "View Menu", or scan a table QR from the admin "Tables → Download QR" (URL `order?r=<restaurantId>&t=<tableId>`).
2. Browse, add to cart, register/login at checkout, place the order.
3. Kitchen accepts & preps, staff confirms, sends to kitchen, serves; the customer tracks status live.
4. Admins manage everything via `/admin`.

---

## Env vars

See `server/.env.example` for backend secrets (Cloudinary, JWT, eSewa, Khalti, Stripe, SMTP) and `client/.env.local.example` for the frontend (API + socket URLs, seed restaurant slug). **Never commit real secrets** — `.env*` is gitignored.

---

## Notes

- Images upload via `/api/upload` (multipart) → Cloudinary; only `secure_url` / `public_id` are stored. Without Cloudinary configured the app falls back to placeholders and Unsplash demo imagery.
- Order numbers are unique per restaurant and date, generated as `HMYYMMDD-NNNN` (e.g. `HM260809-0003`).
- `emitToKitchen` / `emitToTable` rooms exist as helpers but aren't used by the current page flows.
- The admin "Open now" toggle and all analytics are driven by the real-time REST data stored in MongoDB.