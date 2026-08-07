# HamroMenu 2.0

A QR-based smart restaurant ordering & management platform. Scan a table's QR → browse the digital menu → order → track live → pay (eSewa / Khalti / cash / pay-after-meal). Four role-specific dashboards (customer, staff, kitchen, admin) plus a public landing page.

> Built with a monorepo: `/server` (Express + MongoDB, OOP) and `/client` (Next.js App Router + Tailwind).

---

## Tech Stack

| Layer     | Tech                                                              |
| --------- | ----------------------------------------------------------------- |
| Frontend  | Next.js (App Router), React, plain JavaScript, Tailwind CSS        |
| Backend   | Node.js + Express, object-oriented architecture                    |
| Database  | MongoDB + Mongoose                                                |
| Images    | Cloudinary (only `secure_url` + `public_id` stored in DB)          |
| Auth      | JWT (access + refresh), role-based (customer / staff / kitchen / admin) |
| Realtime  | Socket.io (order status push to customer, staff & kitchen)         |
| QR        | `qrcode` (encodes restaurant ID + table ID)                       |
| Payments  | eSewa + Khalti (sandbox), card, cash & pay-after-meal             |

## Repository Layout

```
HamroMenu/
├─ server/                 Express API (OOP: models → repositories → services → controllers → routes)
│  └─ src/
│     ├─ config/           env, db, cloudinary, socket
│     ├─ models/           Mongoose schemas (UserBase + role models, Order, Cart, …)
│     ├─ repositories/     data-access layer (BaseRepository + domain repos)
│     ├─ services/         business logic (Auth, Menu, Cart, Order, Payment, Kitchen, …)
│     ├─ controllers/      HTTP adapters (call services only)
│     ├─ routes/           API routes + role guards
│     ├─ middleware/       auth, validate, error handler
│     ├─ utils/            ApiError, ApiResponse, asyncHandler, jwt
│     └─ seed/             demo data
├─ client/                 Next.js (App Router) customer + staff + kitchen + admin + landing
└─ README.md
```

## Getting Started

### Prerequisites
- Node.js 20+
- MongoDB running locally (`mongodb://127.0.0.1:27017`)

### 1. Backend

```bash
cd server
cp .env.example .env      # add your secrets
npm install
npm run seed              # loads demo restaurant, menu, tables, accounts; use npm run seed:reset to wipe
npm run dev               # http://localhost:5000
```

Demo accounts (password `password123`):

| Role    | Email                            |
| ------- | -------------------------------- |
| Admin   | admin@himalayanflavors.com       |
| Staff   | staff@himalayanflavors.com       |
| Kitchen | kitchen@himalayanflavors.com     |
| Customer| customer@himalayanflavors.com    |

### 2. Frontend

```bash
cd client
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:5000/api
npm install
npm run dev               # http://localhost:3000
```

## Demo Flow
1. Open the landing page (`/`) → "View Menu" or scan a table QR (`/order?r=<restaurantId>&t=<tableId>`). Empty tables get QRs from the admin "Tables → Download QR" action or by hitting `/api/restaurants/:r/tables/:t/qr`.
2. Browse, add to cart, register/login at checkout, place the order.
3. Kitchen sees the order live (Socket.io), accepts & preps; staff confirms & serves; customer tracks status in real time.
4. Admin dashboards (`/admin/*`) show analytics, menu & table management, coupons, QR.

## Env Vars
See `server/.env.example` for all backend secrets (Cloudinary, JWT, eSewa, Khalti, Stripe, SMTP). Never commit real secrets — `.env` is gitignored.

## Notes
- Images upload via `/api/upload` (multipart) → Cloudinary; only `secure_url` / `public_id` are stored.
- If Cloudinary isn't configured, the app still works — uploads fall back gracefully and placeholder imagery is used.
- The AI recommendation layer (collaborative filtering / frequently-bought-together) is scaffolded to be plugged into the recommendation service without touching the ordering pipeline.