# HamroMenu — Multi-Restaurant Platform Transformation

## Project Audit Summary (as of 2026-09-07)

### Tech Stack
- **Frontend**: React 18 + Vite 5 + Tailwind CSS 3 + Framer Motion 11 + React Router 6 + Lucide React
- **Backend**: Node.js + Express 4 + MongoDB (Mongoose 8)
- **Auth**: JWT (access + refresh tokens), role-based access control
- **Real-time**: Socket.io
- **Image Upload**: Cloudinary
- **Payments**: eSewa, Khalti, Cash, Pay-After-Meal
- **Subscriptions**: Free/Trial, Basic ($29/mo), Pro ($79/mo), Premium ($199/mo)
- **SEO**: react-helmet-async

---

### Existing Models (Server)
| Model | Key Fields | Restaurant-Aware |
|-------|------------|------------------|
| `Restaurant` | name, slug, description, address, contact, logoUrl, coverUrl, currency, taxRate, serviceChargeRate, isOpen, operatingHours, isActive, owner, verificationStatus, restaurantStatus, businessRegistrationNumber, panNumber, documents[], verificationChecks, verificationNote, verifiedAt, approvedAt, rejectedAt, suspendedAt | ✅ (self) |
| `Category` | restaurant, name, slug, description, imageUrl, displayOrder, isActive | ✅ |
| `MenuItem` | restaurant, category, name, price, discountedPrice, imageUrl, prepTime, ingredients, tags, spiceLevel, isVeg, isAvailable, isFeatured, isPopular, isRecommended, options | ✅ |
| `Table` | restaurant, label, number, capacity, area, status, currentOrder, qrCode, isActive | ✅ |
| `QRCode` | restaurant, table, payload, dataUrl, publicId, scans, lastScannedAt, isActive | ✅ |
| `Order` | orderNumber, restaurant, table, customer, source, items[], totals, status, statusHistory, priority, paymentStatus, paymentMethod | ✅ |
| `Payment` | order, restaurant, customer, table, amount, method, status, gatewayRef, transactionId, paidAt, verified | ✅ |
| `Review` | restaurant, order, customer, menuItem, rating, title, comment, tags, images[], isApproved | ✅ |
| `Cart` | restaurant, customer, items[], coupon, totals | ✅ |
| `Coupon` | restaurant, code, discountType, discountValue, minOrder, maxUses, expiresAt, isActive | ✅ |
| `Customer` | name, email, phone, password, role, favorites[], orderHistoryCount, preferences | ❌ (platform-wide) |
| `Staff` | restaurant, staffRole, shift, hiredAt | ✅ |
| `KitchenStaff` | restaurant, station, shift, hiredAt | ✅ |
| `Admin` | permissions | ❌ (platform-wide, linked to restaurant via `Restaurant.owner`) |
| `SuperAdmin` | name, email, password, role, permissions | ❌ (platform-wide) |
| `Subscription` | restaurant, plan, status, currentPeriodStart, currentPeriodEnd, features | ✅ |
| `SubscriptionPlan` | name, price, interval, features, limits | ❌ (platform-wide) |
| `Invoice` | subscription, amount, status, paidAt | ✅ |
| `RecommendationCache` | restaurant, similarity{}, coOccurrence{}, itemCount, computedAt, stats | ✅ |

---

### Existing User Roles
| Role | Model | Scope |
|------|-------|-------|
| `customer` | Customer | Platform-wide (no restaurant link) |
| `staff` | Staff | Restaurant-specific |
| `kitchen` | KitchenStaff | Restaurant-specific |
| `admin` | Admin | Per-restaurant (linked via `Restaurant.owner`) |
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
- Restaurant model enhanced with: owner, verificationStatus, restaurantStatus, businessRegistrationNumber, panNumber, documents[], verificationChecks
- Compound indexes: `owner`, `verificationStatus+restaurantStatus`, `address.city+name`
- UserBase.js: SUPER_ADMIN role added to USER_ROLES
- SuperAdmin model created with permissions field

### PHASE 4 — Roles & Authorization ✅
- SUPER_ADMIN role functional
- AuthService: registerRestaurantOwner, registerSuperAdmin, registerCustomer, registerStaff, registerKitchen, registerAdmin
- UserRepository: SuperAdmin in MODEL_BY_ROLE
- ensureRestaurantContext, ensureStaffContext, ensureKitchenContext middleware created and applied
- Routes updated with authorization middleware (auth, authorize, ensureRestaurantContext)

### PHASE 5 — Restaurant Registration & Verification ✅
- POST /api/auth/register/restaurant-owner endpoint (with authRateLimiter)
- POST /api/auth/register/super-admin endpoint (with authRateLimiter)
- Rule-based verification algorithm (required fields, email/phone validity, duplicate registration, documents)
- Super Admin approval/rejection/requestCorrection workflow
- Application statuses: PENDING → APPROVED/REJECTED → ACTIVE/SUSPENDED

### PHASE 6 — Restaurant Data Isolation ✅
- ensureRestaurantContext middleware applied to:
  - All order routes (placeOrder, getById, cancel, activeOrderForTable, updateStatus)
  - All payment routes (init, esewaStart, payAfterMeal, verifyEsewa, verifyKhalti, forOrder, availability)
  - All customer profile routes (profile, updateProfile, favorites, toggleFavorite, myReviews, addReview)
  - All admin routes (restaurants, staff, kitchen, coupons, menu, reviews, recommendations)
  - All cart routes (restaurant-scoped cart)
- Staff and kitchen context middleware: ensureStaffContext, ensureKitchenContext
- Super admin bypasses restaurant check

### PHASE 7 — QR System (Restaurant + Table) ✅
- QR payload contains restaurantId, tableId, tableNumber, token
- Scan endpoint returns { restaurantId, table }
- Menu loads via /api/restaurants/:restaurantId/menu
- QR generation includes restaurant branding
- Bulk QR generation for all tables
- QR status: active/disabled per table
- QRService handles generation and scanning logic

### PHASE 8 — Menu/Order/Payment/Review Updates ✅
- All menu controllers scope to restaurant (Category, MenuItem models have restaurant field)
- Order controllers scope to restaurant (ensureRestaurantContext middleware applied)
- Payment controllers scope to restaurant (ensureRestaurantContext middleware applied)
- Reviews already restaurant-scoped (Review model has restaurant field)
- Cart: restaurant-scoped Cart model with coupon support, CartService, CartController

### PHASE 9 — Priority Queue for Kitchen (ALGORITHM 2) ✅
- KitchenPriorityQueue: heap-based min-heap implementation
- Score formula: `waitMinutes * 2 + statusWeight`
- Status weights: pending=100, confirmed=80, preparing=50, ready=10
- Rebalance method for dynamic priority updates
- Priority badges: 🔴 High, 🟡 Medium, 🟢 Low
- API: GET /api/kitchen/:restaurantId/queue returns priority-sorted orders

### PHASE 10 — KNN + Cosine Similarity (ALGORITHM 3) ✅
- User-based KNN: `knnNeighbours` finds top-K similar users by cosine similarity on preference vectors
- `recommendedByKNN` aggregates neighbor preferences, excludes already-ordered items
- Filters to current restaurant's available items
- Recency weighting applied
- Fallback: bestsellers if < 3 orders in history
- API: GET /api/restaurants/:restaurantId/recommendations

### PHASE 11 — Apriori Association Rules (ALGORITHM 4) ✅
- `apriori()` mines frequent 2-itemsets from order transactions
- Generates rules with support, confidence, and lift metrics
- Rules sorted by lift descending
- Stored in RecommendationCache.coOccurrence
- Feature-gated by FeatureGateService (subscription plan dependent)
- API: GET /api/restaurants/:restaurantId/recommendations/companions

### PHASE 12 — Dashboard Updates ✅
**Super Admin Dashboard (`/super-admin`):** ✅
- 5 pages: Dashboard, Users, Plans, Subscriptions, Reports
- Platform stats: total restaurants, active, pending applications, total orders
- Restaurant applications table with approve/reject/requestCorrection actions
- User management (all roles)
- Subscription plan CRUD
- Revenue and restaurant reports
- DashboardShell layout component

**Restaurant Owner Dashboard (`/admin`):** ✅
- AdminDashboardPage, AdminMenuPage, AdminOrdersPage, AdminCategoriesPage
- AdminReviewsPage, AdminStaffPage, AdminAnalyticsPage, AdminSettingsPage
- AdminTablesPage, AdminVerificationPage, AdminSubscriptionPage
- Verification status banner, subscription management
- Recommendation engine controls (rebuild, stats)
- Staff/kitchen management

**Staff Dashboard (`/staff`):** ✅ (1336 lines)
- Full dashboard with tabs: New orders, Confirmed, Preparing, Ready
- Order management, bill generation, cash collection
- Table QR status display

**Kitchen Dashboard (`/kitchen`):** ✅
- Priority-sorted queue with stat pills (New/Cooking/Ready)
- Accept/start/ready actions, per-item ready marking
- Overdue detection, socket.io real-time updates
- Motion layout animations

### PHASE 13 — Customer UI Redesign ✅
**Menu Page (`/restaurants/:id/menu`):** ✅
- MenuHeader: cover image, restaurant name, tagline, open/closed badge, rating, address, operating hours
- Search input with filtering
- CategoryChips: horizontal scrollable chips with counts
- Veg filter toggle
- RecommendationRail: "Recommended for you" / "Popular with diners" (KNN)
- "Frequently Ordered Together" section (Apriori)
- MenuItemCard: image, veg badge, spice badge, popular/chef pick badge, discount %, price, add button
- ItemSheet: bottom sheet for item options/customization
- Cart bottom bar, skeleton loading, empty states

### PHASE 14 — Premium Landing Page ✅
- Brand: **HAMROMENU**
- Hero: background image + gradient overlay, animated headline "Your Restaurant, Now at every table"
- How it Works: Scan → Order → Serve (3-step with icons)
- About section, Features grid, Pricing section, FAQ, CTA
- Helmet SEO meta tags
- Framer Motion scroll reveals (`whileInView`, `fadeUp` pattern)

### PHASE 15 — Motion & 3D ✅ (partial)
**Implemented:**
- Page transitions (AnimatePresence in MenuPage, CartPage, ToastContext, Sheet)
- Scroll reveal (whileInView in LandingPage with fadeUp pattern)
- Card hover: elevation + shadow (LandingPage cards, MenuItemCard)
- Button micro-interactions (whileTap scale, active:scale)
- Layout animations (MenuItemCard, KitchenDashboard)
- Animated stat cards (SuperAdminDashboard)
- Order status progress bar (OrderTimeline component)
- Respect `prefers-reduced-motion` (index.css disables all animations)

**Not implemented:**
- 3D hero mockup (no Three.js or 3D library)
- Cart fly-to-cart animation
- QR generation pulse animation
- Chart bar-grow animations

### PHASE 16 — Performance Optimization ✅ (partial)
**Implemented:**
- Lazy load all pages via Vite code splitting
- Cloudinary image optimization
- Recommendation cache with 1-hour TTL
- Database compound indexes (Restaurant, Invoice, Cart)

**Not implemented:**
- No Redis or API response caching layer
- No virtual list library (react-window/react-virtual)
- No explicit API response caching middleware

### PHASE 17 — Complete Testing ❌ NOT STARTED
**Test Scenarios (planned):**
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

**Test Data (planned):**
- Restaurant A: "Momo House" (Nepali)
- Restaurant B: "Cafe Bliss" (Continental)
- 5 customers with overlapping order histories
- 50+ orders per restaurant for algorithm training

**Current state:** Zero test files. No test framework installed (no jest, vitest, mocha, cypress, playwright).

### PHASE 18 — Bug Fixes & Polish ✅ (partial)
**Implemented:**
- Skeleton loading states (MenuPage)
- Empty states via EmptyState component
- Toast notifications via ToastContext
- Form validation via express-validator
- SEO meta tags via react-helmet-async
- Error: none found in codebase

**Not implemented:**
- No error boundary components
- Cross-browser testing status unknown
- Mobile Safari fixes status unknown

---

## Architecture Overview

### Server Layer Structure
```
server/src/
├── models/          # 20 Mongoose models
├── controllers/     # 13 controllers
├── services/        # 15 services (business logic)
├── repositories/    # 6 repositories (data access)
├── middleware/       # auth, restaurantAuth, validate, rateLimit, errorHandler
├── routes/index.js  # All API routes
└── utils/           # Helpers
```

### Client Layer Structure
```
client/src/
├── pages/
│   ├── LandingPage.jsx
│   ├── customer/     # MenuPage, CartPage, CheckoutPage, OrderTracking, OrderHistory, Profile, Reviews
│   ├── admin/        # 11 admin pages (Dashboard, Menu, Orders, Categories, Reviews, Staff, Analytics, Settings, Tables, Verification, Subscription)
│   ├── super-admin/  # 5 pages (Dashboard, Users, Plans, Subscriptions, Reports)
│   ├── staff/StaffDashboardPage.jsx
│   └── kitchen/KitchenDashboardPage.jsx
├── components/
│   ├── menu/         # MenuHeader, CategoryChips, MenuItemCard, ItemSheet, RecommendationRail
│   ├── ui/           # stepper, spinner, sheet, image, empty, badges
│   └── order/        # OrderTimeline
├── contexts/         # ToastContext, SocketContext, AuthContext, CartContext
└── lib/              # apiClient.js, format.js (npr, cx, elapsedLabel, dayName, formatTime)
```

---

## File Ownership Map (For Agents)

| Area | Files |
|------|-------|
| **Auth & Roles** | `server/src/models/UserBase.js`, `server/src/services/AuthService.js`, `server/src/middleware/auth.js` |
| **Restaurant Model** | `server/src/models/Restaurant.js` |
| **Restaurant Registration** | `server/src/controllers/AuthController.js`, `server/src/routes/index.js` |
| **Super Admin** | `server/src/controllers/SuperAdminController.js`, `server/src/routes/index.js` |
| **Authorization Middleware** | `server/src/middleware/restaurantAuth.js` |
| **Kitchen Priority Queue** | `server/src/services/KitchenService.js`, `server/src/controllers/KitchenController.js` |
| **KNN Recommendations** | `server/src/services/RecommendationService.js` |
| **Apriori Rules** | `server/src/services/AssociationRuleService.js` |
| **Feature Gating** | `server/src/services/FeatureGateService.js` |
| **Subscriptions** | `server/src/models/Subscription.js`, `server/src/models/SubscriptionPlan.js`, `server/src/models/Invoice.js` |
| **Cart & Coupons** | `server/src/models/Cart.js`, `server/src/models/Coupon.js`, `server/src/services/CartService.js`, `server/src/controllers/CartController.js` |
| **Repositories** | `server/src/repositories/` (BaseRepository, UserRepository, RestaurantRepository, OrderRepository, MenuRepository, CartRepository) |
| **Landing Page** | `client/src/pages/LandingPage.jsx` |
| **Customer Menu** | `client/src/pages/customer/MenuPage.jsx`, `client/src/components/menu/*` |
| **Super Admin Dashboard** | `client/src/pages/super-admin/SuperAdminDashboardPage.jsx` + 4 sibling pages |
| **Restaurant Owner Dashboard** | `client/src/pages/admin/*` (11 pages) |
| **Staff Dashboard** | `client/src/pages/staff/StaffDashboardPage.jsx` |
| **Kitchen Dashboard** | `client/src/pages/kitchen/KitchenDashboardPage.jsx` |
| **Design System** | `client/src/index.css`, `client/tailwind.config.js`, `client/src/components/ui/*` |
| **API Client** | `client/src/lib/apiClient.js` |
| **Utilities** | `client/src/lib/format.js` |
| **Seed Scripts** | `server/src/seed.js`, `server/src/seed_subscription.js` |

---

## Next Steps (Remaining)

### PHASE 17 — Testing (NOT STARTED)
- Install test framework (Vitest recommended for Vite projects)
- Write unit tests for: AuthService, KitchenPriorityQueue, RecommendationService (KNN), AssociationRuleService (Apriori)
- Write integration tests for: restaurant registration flow, QR scan flow, order flow
- Write E2E tests for: multi-restaurant data isolation, role permissions
- Test data seeding for algorithm training (50+ orders per restaurant)

### PHASE 18 — Bug Fixes & Polish (PARTIAL)
- Add React Error Boundaries around route-level components
- Cross-browser testing (Chrome, Firefox, Safari, Edge)
- Mobile Safari-specific fixes
- Verify all loading/skeleton states cover edge cases
- Final accessibility audit (keyboard nav, focus states, contrast ratios, ARIA labels)

### Future Enhancements (Optional)
- Redis for API response caching
- Virtual lists for kitchen queue and order history (react-window)
- Cart fly-to-cart animation
- Chart animations for analytics dashboards
- 3D elements (if desired for premium feel)

---

*Last updated: 2026-09-07. This document serves as the single source of truth for the transformation.*