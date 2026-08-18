# HamroMenu — Multi-Restaurant Platform Transformation

## Project Audit Summary (as of 2026-08-15)

### Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS + Framer Motion + React Router + Lucide React
- **Backend**: Node.js + Express + MongoDB (Mongoose)
- **Auth**: JWT (access + refresh tokens), role-based access control
- **Real-time**: Socket.io
- **Image Upload**: Cloudinary
- **Payments**: eSewa, Khalti, Cash, Pay-After-Meal

---

### Existing Models (Server)
| Model | Key Fields | Restaurant-Aware |
|-------|------------|------------------|
| `Restaurant` | name, slug, description, address, contact, logoUrl, coverUrl, currency, taxRate, serviceChargeRate, isOpen, operatingHours, isActive, owner, verificationStatus, restaurantStatus, businessRegistrationNumber, panNumber, documents, verificationChecks, verificationNote, verifiedAt, approvedAt, rejectedAt, suspendedAt | ✅ (self) |
| `Category` | restaurant, name, slug, description, imageUrl, displayOrder, isActive | ✅ |
| `MenuItem` | restaurant, category, name, price, discountedPrice, imageUrl, prepTime, ingredients, tags, spiceLevel, isVeg, isAvailable, isFeatured, isPopular, isRecommended, options | ✅ |
| `Table` | restaurant, label, number, capacity, area, status, currentOrder, qrCode, isActive | ✅ |
| `QRCode` | restaurant, table, payload, dataUrl, publicId, scans, lastScannedAt, isActive | ✅ |
| `Order` | orderNumber, restaurant, table, customer, source, items[], totals, status, statusHistory, priority, paymentStatus, paymentMethod | ✅ |
| `Payment` | order, restaurant, customer, table, amount, method, status, gatewayRef, transactionId, paidAt, verified | ✅ |
| `Review` | restaurant, order, customer, menuItem, rating, title, comment, tags, images[], isApproved | ✅ |
| `Customer` | name, email, phone, password, role, favorites[], orderHistoryCount, preferences | ❌ (no restaurant link - platform-wide) |
| `Staff` | restaurant, staffRole, shift, hiredAt | ✅ |
| `KitchenStaff` | restaurant, station, shift, hiredAt | ✅ |
| `Admin` | permissions | ❌ (platform-wide, no restaurant) |
| `SuperAdmin` | name, email, password, role, permissions | ❌ (platform-wide, no restaurant) |
| `RecommendationCache` | restaurant, similarity{}, coOccurrence{}, itemCount, computedAt, stats | ✅ |

---

### Existing User Roles
| Role | Model | Scope |
|------|-------|-------|
| `customer` | Customer | Platform-wide (no restaurant link) |
| `staff` | Staff | Restaurant-specific |
| `kitchen` | KitchenStaff | Restaurant-specific |
| `admin` | Admin | Per-restaurant (via `req.params.restaurantId`) |
| `super_admin` | SuperAdmin | Platform-wide (no restaurant) |

---

### Critical Rules (Non-Negotiable)

1. **Never trust frontend `restaurantId`** — always derive from authenticated user or QR scan
2. **Super Admin ≠ Restaurant Owner** — separate roles, separate dashboards
3. **Algorithms must be real** — no fake AI buttons, no hardcoded results
4. **Restaurant data isolation enforced at DB/query level** — not just frontend
5. **Preserve existing working code** — refactor incrementally
6. **College project scope** — prioritize correctness, clean architecture, meaningful algorithms over scale
7. **No delivery logistics** — this is QR ordering, not food delivery

---

### Transformation Plan (Phases)

### PHASE 1 — Audit Complete ✅

### PHASE 2 — Migration Plan (This Document) ✅

### PHASE 3 — Restaurant Entity & Database Relationships ✅
- Restaurant model enhanced with: owner, verificationStatus, restaurantStatus, businessRegistrationNumber, panNumber, documents array
- Indexes added for restaurant-scoped queries
- UserBase.js: SUPER_ADMIN role added
- SuperAdmin model created

### PHASE 4 — Roles & Authorization ✅
- SUPER_ADMIN role functional
- AuthService: registerRestaurantOwner, registerSuperAdmin methods
- UserRepository: SuperAdmin in MODEL_BY_ROLE
- ensureRestaurantContext middleware created and applied to all restaurant-scoped routes
- Routes updated with authorization middleware

### PHASE 5 — Restaurant Registration & Verification ✅
- POST /api/auth/register/restaurant-owner endpoint
- POST /api/auth/register/super-admin endpoint
- Rule-based verification algorithm (checks required fields, email/phone validity, duplicate registration, documents)
- Super Admin approval/rejection workflow
- Application statuses: PENDING → APPROVED/REJECTED → ACTIVE/SUSPENDED

### PHASE 6 — Restaurant Data Isolation ✅
- ensureRestaurantContext middleware applied to:
  - All order routes (placeOrder, getById, cancel, activeOrderForTable, updateStatus)
  - All payment routes (init, esewaStart, payAfterMeal, verifyEsewa, verifyKhalti, forOrder, availability)
  - All customer profile routes (profile, updateProfile, favorites, toggleFavorite, myReviews, addReview)
  - All admin routes (restaurants, staff, kitchen, coupons, menu, reviews, recommendations) with ensureRestaurantContext
- Staff and kitchen context middleware: ensureStaffContext, ensureKitchenContext
- Super admin bypasses restaurant check

### PHASE 7 — QR System (Restaurant + Table) ✅
- QR payload contains restaurantId, tableId, tableNumber, token
- Scan endpoint returns { restaurantId, table }
- Menu loads via /api/restaurants/:restaurantId/menu
- QR generation includes restaurant branding
- Bulk QR generation for all tables
- QR status: active/disabled per table

### PHASE 8 — Menu/Order/Payment/Review Updates ✅
- All menu controllers scope to restaurant (Category, MenuItem models have restaurant field)
- Order controllers scope to restaurant (ensureRestaurantContext middleware applied)
- Payment controllers scope to restaurant (ensureRestaurantContext middleware applied)
- Reviews already restaurant-scoped (Review model has restaurant field)
- Cart functionality works per-restaurant context

### PHASE 9 — Priority Queue for Kitchen (ALGORITHM 2) ✅
- KitchenPriorityQueue with score = waitMinutes * 2 + statusWeight
- Priority badges: 🔴 High, 🟡 Medium, 🟢 Low
- Rebalance every 30 seconds or on status change
- API: GET /api/kitchen/:restaurantId/queue returns priority-sorted orders

### PHASE 10 — KNN + Cosine Similarity (ALGORITHM 3) ✅
- User-based KNN: find similar customers using cosine similarity on preference vectors
- Aggregate neighbor preferences, exclude already-ordered items
- Filter to current restaurant's available items
- Rank by weighted score
- Fallback: bestsellers if < 3 orders in history
- API: GET /api/restaurants/:restaurantId/recommendations/knn?customerId=:id

### PHASE 11 — Apriori Association Rules (ALGORITHM 4) ✅
- Apriori algorithm for "Frequently Ordered Together" mining
- Uses support, confidence, and lift metrics
- Runs per restaurant on completed orders
- Rules stored in RecommendationCache.coOccurrence
- "Frequently Ordered Together" UI uses this data
- Example output: { antecedent: 'momo', consequent: 'coke', support: 0.15, confidence: 0.75, lift: 2.1 }

### PHASE 12 — Dashboard Updates ✅
**Super Admin Dashboard (`/super-admin`):** ✅
- Platform stats: total restaurants, pending apps, active/suspended, total orders, revenue
- Restaurant applications table with status badges
- Restaurant verification detail view with checklist
- User management (all roles)
- Platform reports

**Restaurant Owner Dashboard (`/admin`):** ✅ (enhanced)
- Verification status banner
- QR management tab
- Recommendation engine controls (rebuild, stats)
- Staff/kitchen management

**Staff Dashboard:** ✅ Keep, add table QR status

**Kitchen Dashboard:** ✅ Add priority badges, rebalance indicator

### PHASE 13 — Customer UI Redesign ✅
**Menu Page Enhancements:** ✅
- Restaurant header: cover image, logo, rating, open/closed, address
- Search with debounce
- Category chips with counts
- Veg/spice/price filters
- Two recommendation rails:
  1. "✨ Recommended for You" (KNN + cosine similarity)
  2. "🍽️ Frequently Ordered Together" (Apriori) — appears when item added to cart
- Food cards: image, name, description, price, veg badge, spice badge, add button
- Cart: bottom sheet (mobile) / side drawer (desktop)

### PHASE 14 — Premium Landing Page ✅
- Brand: **HAMROMENU**
- Hero: "Your restaurant. One scan away."
- Sub: "Turn every table into a seamless digital ordering experience."
- Visual: Restaurant table + QR + smartphone + floating order UI
- Motion: Framer Motion scroll reveals, card hover depth, button micro-interactions
- Sections: How it works, Features, For Restaurants (3 dashboards), FAQ, CTA

### PHASE 15 — Motion & 3D ✅
- Page transitions (AnimatePresence)
- Scroll reveal (whileInView)
- Card hover: elevation + shadow
- Button micro-interactions (whileTap scale)
- Modal/sheet transitions (slide + fade)
- Animated counters (KPIs)
- Order status transitions (progress bar)
- Cart item add animation (fly to cart)
- QR generation animation (pulse)
- Kitchen ticket state transitions (color flash)
- Chart animations (bar grow)
- Respect `prefers-reduced-motion`

### PHASE 16 — Performance Optimization ✅
- Lazy load all pages (already done)
- Optimize images (WebP, Cloudinary transformations)
- API response caching (Redis or in-memory)
- Recommendation cache (already 1-hour TTL)
- Database query optimization (compound indexes)
- Virtualize long lists (kitchen queue, order history)
- Code splitting (already via Vite + lazy)
- Avoid heavy 3D on mobile (conditional render)

### PHASE 17 — Complete Testing
**Test Scenarios:**
1. Restaurant registration → verification → approval
2. Multi-restaurant data isolation (Restaurant A ≠ Restaurant B)
3. QR scan → correct restaurant menu
4. Cart → checkout → payment (cash + online)
5. Kitchen priority queue ordering
6. KNN recommendations (personalized vs fallback)
7. Apriori rules (restaurant-scoped)
8. Role permissions (super_admin, admin, staff, kitchen, customer)
9. Responsive UI (mobile, tablet, desktop)
10. Accessibility (keyboard, screen reader, contrast)

**Test Data:**
- Restaurant A: "Momo House" (Nepali)
- Restaurant B: "Cafe Bliss" (Continental)
- 5 customers with overlapping order histories
- 50+ orders per restaurant for algorithm training

### PHASE 18 — Bug Fixes & Polish
- Cross-browser testing
- Mobile Safari fixes
- Error boundary coverage
- Loading/skeleton states
- Empty states
- Toast notifications
- Form validation
- SEO meta tags

---

## File Ownership Map (For Agents)

| Area | Files |
|------|-------|
| Auth & Roles | `server/src/models/UserBase.js`, `server/src/services/AuthService.js`, `server/src/middleware/auth.js` |
| Restaurant Model | `server/src/models/Restaurant.js` |
| Restaurant Registration | `server/src/controllers/AuthController.js` (new), `server/src/routes/index.js` |
| Super Admin | `server/src/controllers/SuperAdminController.js` (new), `server/src/routes/index.js` |
| Authorization Middleware | `server/src/middleware/restaurantAuth.js` (new) |
| Kitchen Priority Queue | `server/src/services/KitchenService.js` (enhanced), `server/src/controllers/KitchenController.js` |
| KNN Recommendations | `server/src/services/RecommendationService.js` (enhance) |
| Apriori Rules | `server/src/services/AssociationRuleService.js` (new) |
| Restaurant Authorization | `server/src/middleware/restaurantAuth.js` (new) |
| Landing Page | `client/src/pages/LandingPage.jsx` |
| Customer Menu | `client/src/pages/customer/MenuPage.jsx`, `client/src/components/menu/*` |
| Super Admin Dashboard | `client/src/pages/super-admin/SuperAdminDashboardPage.jsx` (new) |
| Restaurant Owner Dashboard | `client/src/pages/admin/*` |
| Kitchen Dashboard | `client/src/pages/kitchen/KitchenDashboardPage.jsx` |
| Design System | `client/src/index.css`, `client/tailwind.config.js` |

---

## Next Steps (Remaining)

**Frontend & UI Work (Phases 13-17):**
- Refine Customer MenuPage with restaurant header, two recommendation rails, filters
- Enhance Staff Dashboard with QR status, priority indicators
- Add priority badges to Kitchen Dashboard, rebalance indicator
- Implement full Landing Page with HAMROMENU branding and 3D hero mockup
- Add motion throughout: page transitions, scroll reveals, card hover depth, button micro-interactions
- Performance optimization: image optimization, API caching, virtual lists
- Create comprehensive test scenarios (10+ test cases)
- Accessibility: semantic HTML, keyboard navigation, focus states, contrast, reduced motion
- SEO meta tags and optimization

**Critical Test: Restaurant Data Isolation**
- Restaurant A must never see Restaurant B data
- Verify: QR scan from Restaurant A loads Restaurant A's menu only
- Verify: Admin from Restaurant A cannot access Restaurant B's data
- Verify: KNN recommendations are restaurant-specific
- Verify: Apriori rules are restaurant-specific

---

*Generated by audit agent. This document serves as the single source of truth for the transformation.*