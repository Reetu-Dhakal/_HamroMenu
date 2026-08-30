# HamroMenu

**Your restaurant. One scan away.**

HamroMenu is a QR-based, multi-restaurant ordering and management platform. A guest scans the QR code on their table, browses the digital menu, orders, watches the kitchen prepare it live, and pays however they like — no app installs, no account required to start ordering. On the restaurant side, staff, kitchen and admin each get a real-time dashboard tuned for their job, plus a super-admin console that runs the whole platform and verifies new restaurants.

- **Customer** → scan, order, pay, live-track
- **Restaurant** → admin menu/QR, staff service, kitchen queue (real time over Socket.io)
- **Platform** → super-admin verifies & manages restaurants and subscriptions

---

## Tech stack

| Layer      | Tech                                                        |
| ---------- | ----------------------------------------------------------- |
| Frontend   | React 18, Vite, Tailwind CSS, Framer Motion, React Router    |
| Backend    | Node.js, Express (layered OOP architecture)                 |
| Database   | MongoDB + Mongoose                                          |
| Auth       | JWT (access + refresh), role-based access control           |
| Real-time  | Socket.io (live order/status updates)                       |
| Images     | Cloudinary (only `secure_url` + `public_id` persisted)      |
| Payments   | eSewa, Khalti (sandbox), Cash, Pay-After-Meal               |
| QR codes   | `qrcode` (per-table, restaurant-branded)                    |

---

## Repository layout

```
HamroMenu/
├─ server/                     Express API (REST + Socket.io)
│  └─ src/
│     ├─ config/               env config, DB, socket, cloudinary
│     ├─ models/               Mongoose schemas
│     ├─ repositories/         data-access layer (BaseRepository + domain repos)
│     ├─ services/             business logic (Auth, Order, Payment, Recommendation…)
│     ├─ controllers/          thin HTTP adapters that only call services
│     ├─ routes/               API routes + role guards
│     ├─ middleware/           auth, restaurant context, validation, error handler
│     ├─ utils/                ApiError, ApiResponse, asyncHandler, JWT helpers
│     ├─ seed/                 demo data + demo accounts
│     └─ server.js             app bootstrap (Express + Socket.io)
├─ client/                     React SPA (Vite)
│  └─ src/
│     ├─ pages/                landing, auth, admin, staff, kitchen, customer, super-admin
│     └─ components/           shared UI
└─ README.md
```

The server follows a strict layered pattern — every layer only talks to the one below it:

```
route → controller → service → repository → Mongoose model → MongoDB
```

**Utilities:** `ApiError` (with machine-readable error codes), `ApiResponse` (unified envelope), `asyncHandler` (async error forwarding), and a global `errorHandler` that maps Mongoose/JWT errors into the same shape.

---

## Roles

| Role          | Scope        | What they can do                                                       |
| ------------- | ------------ | ---------------------------------------------------------------------- |
| `customer`    | Platform     | Scan QR, order, pay, track live, favorites, reviews, profile           |
| `staff`       | Restaurant   | Confirm orders, send to kitchen, serve food, collect cash, tables, QR  |
| `kitchen`     | Restaurant   | Priority cooking queue, accept orders, mark items / orders ready       |
| `admin`       | Restaurant   | Full menu & QR CRUD, orders, coupons, team, analytics, settings, reports |
| `super_admin` | Platform     | Verify restaurants, manage all restaurants & users, platform reports    |

Restaurant data is isolated at the database/query level — an admin, staff or kitchen user only ever sees their own restaurant's data. The `ensureRestaurantContext` middleware derives the restaurant from the authenticated user (or QR scan), never from a client-supplied ID.

---

## Features

### Customer
- **QR ordering** — scan a table QR (`/order?r=<restaurantId>&t=<tableId>`) and the exact restaurant's menu loads with your table pre-attached.
- **Menu** — search, veg/spice/filter, category chips, dish options, one-tap add to cart.
- **Cart & checkout** — coupon codes, tax + service charge, choose payment method.
- **Live tracking** — 5-step stepper (`pending → confirmed → preparing → ready → served`) that updates over Socket.io with an estimated ready time.
- **Recommendations** — *Recommended for you* (KNN + cosine similarity) and *Frequently ordered together* (Apriori association rules).
- **Reviews & favorites**, plus order history and profile in the account area.

### Staff dashboard (`/staff`)
Live socket-fed board: confirm orders, send to kitchen, serve, collect cash, printable bills, and a table-status grid (free / occupied).

### Kitchen dashboard (`/kitchen`)
A **priority queue** that ranks orders by `waitMinutes × 2 + statusWeight` (High / Medium / Low priority) and rebalances every 30 seconds. Kitchen accepts orders, marks items/orders ready, and auto-notifies staff + customer via sockets.

### Admin dashboard (`/admin`)
Overview analytics, menu & category CRUD, tables + QR generation/regeneration, orders, coupons, team (staff/kitchen accounts), reports (revenue by day, peak hours, table turnover), and restaurant settings with an open/closed toggle.

### Super-admin (`/super-admin`)
Platform-wide: total & pending restaurants, active/suspended status, verify restaurants via a rule-based checklist (business registration, PAN, documents), manage all users, and platform reports.

---

## Algorithms

Real, runnable algorithms — no hardcoded results:

1. **Kitchen priority queue** — scores orders by wait time + status weight.
2. **KNN + cosine similarity** — finds similar customers on preference vectors, aggregates their favorites, filters to the restaurant's available items, and ranks by weighted score. Falls back to bestsellers when there isn't enough order history.
3. **Apriori association rules** — mines *frequently ordered together* pairs from completed orders using support, confidence and lift. Results are cached per restaurant (1-hour TTL).

---

## Payments

- **eSewa** — HMAC-SHA256 signature verified server-side from `total_amount`, `transaction_uuid`, `product_code`.
- **Khalti** — server verifies the token against the Khalti API; only `Completed`/`Verified` states mark the order paid.
- **Cash** — staff "collect cash" creates/completes the payment.
- **Pay-After-Meal** — default; order stays unpaid until settled later.

On success the payment service marks the order paid and emits `payment:success` to the restaurant and customer rooms.

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
npm run seed              # demo data (or: npm run seed:reset to wipe & reseed)
npm run dev               # http://localhost:5000
```

### 2. Frontend

```bash
cd client
cp .env.example .env.local   # optional; dev proxies /api and /socket.io to :5000
npm install
npm run dev                  # http://localhost:5173
```

### Demo flow
1. Open the landing page at `/`, or scan a table QR from the admin "Tables & QR" tab.
2. Browse the menu, add to cart, sign in at checkout, place the order.
3. Kitchen accepts & prepares; staff confirms, serves and collects the bill; the customer tracks each status live.
4. Admins manage everything at `/admin`; the platform owner uses `/super-admin`.

> Demo accounts (`password` = `password123`): `admin@himalayanflavors.com`, `staff@himalayanflavors.com`, `kitchen@himalayanflavors.com`, `customer@himalayanflavors.com`.

---

## Environment variables

- **Server** — see `server/.env.example` (Mongo URI, JWT secrets, Cloudinary, eSewa, Khalti, Stripe, SMTP).
- **Client** — see `client/.env.example` (`VITE_API_URL`, `VITE_SOCKET_URL`, `VITE_KHALTI_PUBLIC_KEY`). In development these can be left empty because Vite proxies `/api` and `/socket.io` to `localhost:5000`.

**.env files are gitignored — never commit real secrets.**

---

## Scripts

| Action                | Command                              |
| --------------------- | ------------------------------------ |
| Server dev            | `cd server && npm run dev`           |
| Server seed / reseed  | `cd server && npm run seed` / `npm run seed:reset` |
| Client dev            | `cd client && npm run dev`           |
| Client build          | `cd client && npm run build`         |
