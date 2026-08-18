import { Router } from 'express';
import authController from '../controllers/AuthController.js';
import restaurantController from '../controllers/RestaurantController.js';
import menuController from '../controllers/MenuController.js';
import cartController from '../controllers/CartController.js';
import orderController from '../controllers/OrderController.js';
import paymentController from '../controllers/PaymentController.js';
import kitchenController from '../controllers/KitchenController.js';
import staffController from '../controllers/StaffController.js';
import adminController from '../controllers/AdminController.js';
import customerController from '../controllers/CustomerController.js';
import superAdminController from '../controllers/SuperAdminController.js';
import staffAdminController from '../controllers/StaffAdminController.js';
import reviewController from '../controllers/ReviewController.js';
import recommendationController from '../controllers/RecommendationController.js';
import { auth, optionalAuth, authorize } from '../middleware/auth.js';
import { ensureRestaurantContext } from '../middleware/restaurantAuth.js';
import { authRateLimiter, orderRateLimiter } from '../middleware/rateLimit.js';
import { USER_ROLES } from '../models/UserBase.js';
import multer from 'multer';
import { body } from 'express-validator';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 6 * 1024 * 1024 } });
const router = Router();

// Health
router.get('/health', (_req, res) => res.json({ success: true, status: 'ok', ts: new Date().toISOString() }));

// Public: restaurant + menu
router.get('/restaurants/by-slug/:slug', restaurantController.getBySlug);
router.get('/restaurants/:restaurantId', restaurantController.getById);
router.get('/restaurants/:restaurantId/menu', menuController.getMenu);
router.get('/restaurants/:restaurantId/tables/number/:number', restaurantController.tableByNumber);
router.post('/qr/scan', body('payload').isString().notEmpty(), restaurantController.scanQR);

// AI recommendations (public read; personalized when a customer token is present)
router.get('/restaurants/:restaurantId/recommendations', optionalAuth, recommendationController.personalized);
router.get('/restaurants/:restaurantId/recommendations/companions', recommendationController.companions);

// Auth routes (validate inline via controller helpers)
router.post('/auth/register/customer', authRateLimiter, authController.registerCustomerRules(), authController.registerCustomer);
router.post('/auth/login', authRateLimiter, body('email').isEmail(), body('password').notEmpty(), authController.login);
router.post('/auth/refresh', authRateLimiter, body('refreshToken').notEmpty(), authController.refresh);
router.post('/auth/logout', auth, authController.logout);
router.get('/auth/me', auth, authController.me);
router.post('/auth/forgot-password', authRateLimiter, authController.forgotPassword);
router.post('/auth/reset-password', authRateLimiter, authController.resetPassword);
router.post('/auth/register/staff', auth, authorize(USER_ROLES.ADMIN, USER_ROLES.STAFF), staffAdminController.registerStaff);
router.post('/auth/register/kitchen', auth, authorize(USER_ROLES.ADMIN), staffAdminController.registerKitchen);
router.post('/auth/register/restaurant-owner', authRateLimiter, authController.registerRestaurantOwner);
router.post('/auth/register/super-admin', authRateLimiter, authController.registerSuperAdmin);

// Restaurant registration with plan selection
router.post('/restaurants', auth, authorize(USER_ROLES.SUPER_ADMIN), restaurantController.registerRestaurant);
router.get('/restaurants', auth, authorize(USER_ROLES.SUPER_ADMIN), restaurantController.listRestaurants);
router.get('/restaurants/:restaurantId', auth, authorize(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.STAFF, USER_ROLES.KITCHEN), restaurantController.getById);
router.get('/restaurants/by-slug/:slug', restaurantController.getBySlug);

// Restaurant verification / status
router.patch('/restaurants/:restaurantId/verify', auth, authorize(USER_ROLES.SUPER_ADMIN), restaurantController.verifyRestaurant);
router.patch('/restaurants/:restaurantId/status', auth, authorize(USER_ROLES.ADMIN), restaurantController.updateRestaurantStatus);

// Public: menu + QR
router.get('/restaurants/:restaurantId/menu', auth, restaurantController.getMenu);
router.get('/restaurants/:restaurantId/tables/number/:number', restaurantController.tableByNumber);
router.post('/qr/scan', body('payload').isString().notEmpty(), restaurantController.scanQR);
router.get('/restaurants/:restaurantId/tables/:tableId/qr', auth, restaurantController.qrForTable);
router.post('/restaurants/:restaurantId/tables/:tableId/qr/regenerate', auth, authorize(USER_ROLES.ADMIN, USER_ROLES.STAFF), restaurantController.regenerateQR);

// Uploads (cloudinary)
router.post('/upload', auth, authorize(USER_ROLES.ADMIN, USER_ROLES.STAFF, USER_ROLES.KITCHEN), upload.single('file'), restaurantController.uploadImage);

// Customer flows
router.use('/cart', auth);
router.get('/cart/:restaurantId', cartController.getCart);
router.post('/cart/:restaurantId/items', cartController.addItem);
router.put('/cart/:restaurantId/items/:itemId', cartController.updateItem);
router.delete('/cart/:restaurantId/items/:itemId', cartController.removeItem);
router.delete('/cart/:restaurantId', cartController.clear);
router.post('/cart/:restaurantId/coupon', cartController.applyCoupon);
router.delete('/cart/:restaurantId/coupon', cartController.removeCoupon);

router.post('/orders/restaurant/:restaurantId', auth, ensureRestaurantContext, orderRateLimiter, orderController.placeOrder);
router.get('/orders/my', auth, orderController.myHistory);
router.get('/orders/:id', auth, ensureRestaurantContext, orderController.getById);
router.delete('/orders/:id', auth, ensureRestaurantContext, orderController.cancel);
router.get('/orders/table/:tableId/active', auth, ensureRestaurantContext, orderController.activeOrderForTable);
router.patch('/orders/:id/status', auth, authorize(USER_ROLES.STAFF, USER_ROLES.KITCHEN, USER_ROLES.ADMIN), ensureRestaurantContext, orderController.updateStatus);

router.post('/payments/:orderId/init', auth, ensureRestaurantContext, paymentController.init);
router.post('/payments/:orderId/esewa/start', auth, ensureRestaurantContext, paymentController.esewaStart);
router.post('/payments/:orderId/pay-after-meal', auth, ensureRestaurantContext, paymentController.payAfterMeal);
router.post('/payments/:paymentId/verify/esewa', auth, ensureRestaurantContext, paymentController.verifyEsewa);
router.post('/payments/:paymentId/verify/khalti', auth, ensureRestaurantContext, paymentController.verifyKhalti);
router.get('/payments/order/:orderId', auth, ensureRestaurantContext, paymentController.forOrder);
router.get('/payments/availability', paymentController.availability);

// Customer profile
router.get('/profile', auth, ensureRestaurantContext, customerController.profile);
router.put('/profile', auth, ensureRestaurantContext, customerController.updateProfile);
router.get('/profile/favorites', auth, ensureRestaurantContext, customerController.favorites);
router.post('/profile/favorites/:menuItemId', auth, ensureRestaurantContext, customerController.toggleFavorite);
router.get('/profile/reviews', auth, ensureRestaurantContext, customerController.myReviews);
router.post('/restaurants/:restaurantId/reviews', auth, ensureRestaurantContext, customerController.addReview);

// Public reviews
router.get('/reviews/restaurant/:restaurantId', reviewController.forRestaurant);
router.get('/reviews/menu/:menuItemId', reviewController.forMenuItem);

// Admin: review moderation
router.get('/admin/:restaurantId/reviews', auth, authorize(USER_ROLES.ADMIN), ensureRestaurantContext, reviewController.adminList);
router.patch('/admin/reviews/:id', auth, authorize(USER_ROLES.ADMIN), ensureRestaurantContext, reviewController.adminSetApproved);
router.delete('/admin/reviews/:id', auth, authorize(USER_ROLES.ADMIN), ensureRestaurantContext, reviewController.adminDelete);

// Admin: recommendation engine
router.post('/admin/:restaurantId/recommendations/rebuild', auth, authorize(USER_ROLES.ADMIN), ensureRestaurantContext, recommendationController.rebuild);
router.get('/admin/:restaurantId/recommendations/stats', auth, authorize(USER_ROLES.ADMIN), ensureRestaurantContext, recommendationController.stats);
router.get('/super-admin/applications', auth, authorize(USER_ROLES.SUPER_ADMIN), superAdminController.applications);
router.get('/super-admin/applications/:id', auth, authorize(USER_ROLES.SUPER_ADMIN), superAdminController.applicationDetail);
router.post('/super-admin/applications/:id/approve', auth, authorize(USER_ROLES.SUPER_ADMIN), superAdminController.approveApplication);
router.post('/super-admin/applications/:id/reject', auth, authorize(USER_ROLES.SUPER_ADMIN), superAdminController.rejectApplication);
router.post('/super-admin/applications/:id/request-correction', auth, authorize(USER_ROLES.SUPER_ADMIN), superAdminController.requestCorrection);
router.get('/super-admin/overview', auth, authorize(USER_ROLES.SUPER_ADMIN), superAdminController.overview);
router.get('/super-admin', auth, authorize(USER_ROLES.SUPER_ADMIN), (req, res) => {
  res.sendFile('super-admin-dashboard.html', { root: './server/public' });
});

// Staff dashboard
router.get('/staff/:restaurantId/dashboard', auth, authorize(USER_ROLES.STAFF, USER_ROLES.ADMIN), staffController.dashboard);
router.get('/staff/:restaurantId/orders', auth, authorize(USER_ROLES.STAFF, USER_ROLES.ADMIN), staffController.activeOrders);
router.get('/staff/:restaurantId/tables', auth, authorize(USER_ROLES.STAFF, USER_ROLES.ADMIN), staffController.tables);
router.post('/staff/orders/:orderId/confirm', auth, authorize(USER_ROLES.STAFF, USER_ROLES.ADMIN), staffController.confirm);
router.post('/staff/orders/:orderId/send-to-kitchen', auth, authorize(USER_ROLES.STAFF, USER_ROLES.ADMIN), staffController.sendToKitchen);
router.post('/staff/orders/:orderId/serve', auth, authorize(USER_ROLES.STAFF, USER_ROLES.ADMIN), staffController.serveFood);
router.get('/staff/orders/:orderId/bill', auth, authorize(USER_ROLES.STAFF, USER_ROLES.ADMIN), staffController.bill);
router.post('/staff/orders/:orderId/collect-cash', auth, authorize(USER_ROLES.STAFF, USER_ROLES.ADMIN), staffController.collectCash);

// Kitchen dashboard
router.get('/kitchen/:restaurantId/queue', auth, authorize(USER_ROLES.KITCHEN, USER_ROLES.ADMIN, USER_ROLES.STAFF), kitchenController.queue);
router.get('/kitchen/:restaurantId/stats', auth, authorize(USER_ROLES.KITCHEN, USER_ROLES.ADMIN), kitchenController.stats);
router.post('/kitchen/orders/:orderId/accept', auth, authorize(USER_ROLES.KITCHEN, USER_ROLES.ADMIN), kitchenController.accept);
router.post('/kitchen/orders/:orderId/ready', auth, authorize(USER_ROLES.KITCHEN, USER_ROLES.ADMIN), kitchenController.readyOrder);
router.post('/kitchen/orders/:orderId/items/:itemId/ready', auth, authorize(USER_ROLES.KITCHEN, USER_ROLES.ADMIN), kitchenController.markItemReady);

// Admin
router.get('/admin/restaurants', auth, authorize(USER_ROLES.ADMIN), ensureRestaurantContext, adminController.restaurants);
router.post('/admin/restaurants', auth, authorize(USER_ROLES.ADMIN), ensureRestaurantContext, adminController.createRestaurant);
router.patch('/admin/restaurants/:id', auth, authorize(USER_ROLES.ADMIN), ensureRestaurantContext, adminController.updateRestaurant);
router.get('/admin/:restaurantId/overview', auth, authorize(USER_ROLES.ADMIN), ensureRestaurantContext, adminController.overview);
router.get('/admin/:restaurantId/reports', auth, authorize(USER_ROLES.ADMIN), ensureRestaurantContext, adminController.reports);
router.get('/admin/:restaurantId/revenue', auth, authorize(USER_ROLES.ADMIN), ensureRestaurantContext, adminController.revenue);
router.get('/admin/:restaurantId/payments', auth, authorize(USER_ROLES.ADMIN), ensureRestaurantContext, paymentController.listForRestaurant);
router.post('/admin/:restaurantId/tables', auth, authorize(USER_ROLES.ADMIN, USER_ROLES.STAFF), ensureRestaurantContext, adminController.addTable);
router.get('/admin/:restaurantId/tables', auth, authorize(USER_ROLES.ADMIN, USER_ROLES.STAFF), ensureRestaurantContext, adminController.listTables);
router.get('/admin/:restaurantId/coupons', auth, authorize(USER_ROLES.ADMIN), ensureRestaurantContext, staffAdminController.listCoupons);
router.post('/admin/:restaurantId/coupons', auth, authorize(USER_ROLES.ADMIN), ensureRestaurantContext, staffAdminController.createCoupon);
router.patch('/admin/coupons/:id', auth, authorize(USER_ROLES.ADMIN), ensureRestaurantContext, staffAdminController.updateCoupon);
router.delete('/admin/coupons/:id', auth, authorize(USER_ROLES.ADMIN), ensureRestaurantContext, staffAdminController.deleteCoupon);
router.get('/admin/:restaurantId/staff', auth, authorize(USER_ROLES.ADMIN), ensureRestaurantContext, staffAdminController.listStaff);
router.get('/admin/:restaurantId/kitchen', auth, authorize(USER_ROLES.ADMIN), ensureRestaurantContext, staffAdminController.listKitchen);

// QR
router.get('/admin/:restaurantId/qrcodes', auth, staffAdminController.listQR);
router.get('/restaurants/:restaurantId/tables/:tableId/qr', auth, restaurantController.qrForTable);
router.post('/restaurants/:restaurantId/tables/:tableId/qr/regenerate', auth, authorize(USER_ROLES.ADMIN, USER_ROLES.STAFF), restaurantController.regenerateQR);

// Admin menu management
router.post('/admin/restaurants/:restaurantId/categories', auth, authorize(USER_ROLES.ADMIN), ensureRestaurantContext, menuController.addCategory);
router.patch('/admin/categories/:id', auth, authorize(USER_ROLES.ADMIN), ensureRestaurantContext, menuController.updateCategory);
router.delete('/admin/categories/:id', auth, authorize(USER_ROLES.ADMIN), ensureRestaurantContext, menuController.removeCategory);
router.post('/admin/restaurants/:restaurantId/items', auth, authorize(USER_ROLES.ADMIN), ensureRestaurantContext, menuController.addItem);
router.put('/admin/items/:id', auth, authorize(USER_ROLES.ADMIN), ensureRestaurantContext, menuController.updateItem);
router.patch('/admin/items/:id/availability', auth, authorize(USER_ROLES.ADMIN), ensureRestaurantContext, menuController.toggleAvailability);
router.delete('/admin/items/:id', auth, authorize(USER_ROLES.ADMIN), ensureRestaurantContext, menuController.removeItem);

export default router;