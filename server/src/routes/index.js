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
import staffAdminController from '../controllers/StaffAdminController.js';
import reviewController from '../controllers/ReviewController.js';
import recommendationController from '../controllers/RecommendationController.js';
import { auth, optionalAuth, authorize } from '../middleware/auth.js';
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

router.post('/orders/restaurant/:restaurantId', auth, orderRateLimiter, orderController.placeOrder);
router.get('/orders/my', auth, orderController.myHistory);
router.get('/orders/:id', auth, orderController.getById);
router.delete('/orders/:id', auth, orderController.cancel);
router.get('/orders/table/:tableId/active', auth, orderController.activeOrderForTable);
router.patch('/orders/:id/status', auth, authorize(USER_ROLES.STAFF, USER_ROLES.KITCHEN, USER_ROLES.ADMIN), orderController.updateStatus);

router.post('/payments/:orderId/init', auth, paymentController.init);
router.post('/payments/:orderId/esewa/start', auth, paymentController.esewaStart);
router.post('/payments/:orderId/pay-after-meal', auth, paymentController.payAfterMeal);
router.post('/payments/:paymentId/verify/esewa', auth, paymentController.verifyEsewa);
router.post('/payments/:paymentId/verify/khalti', auth, paymentController.verifyKhalti);
router.get('/payments/order/:orderId', auth, paymentController.forOrder);

// Customer profile
router.get('/profile', auth, customerController.profile);
router.put('/profile', auth, customerController.updateProfile);
router.get('/profile/favorites', auth, customerController.favorites);
router.post('/profile/favorites/:menuItemId', auth, customerController.toggleFavorite);
router.get('/profile/reviews', auth, customerController.myReviews);
router.post('/restaurants/:restaurantId/reviews', auth, customerController.addReview);

// Public reviews
router.get('/reviews/restaurant/:restaurantId', reviewController.forRestaurant);
router.get('/reviews/menu/:menuItemId', reviewController.forMenuItem);

// Admin: review moderation
router.get('/admin/:restaurantId/reviews', auth, authorize(USER_ROLES.ADMIN), reviewController.adminList);
router.patch('/admin/reviews/:id', auth, authorize(USER_ROLES.ADMIN), reviewController.adminSetApproved);
router.delete('/admin/reviews/:id', auth, authorize(USER_ROLES.ADMIN), reviewController.adminDelete);

// Admin: recommendation engine
router.post('/admin/:restaurantId/recommendations/rebuild', auth, authorize(USER_ROLES.ADMIN), recommendationController.rebuild);
router.get('/admin/:restaurantId/recommendations/stats', auth, authorize(USER_ROLES.ADMIN), recommendationController.stats);

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
router.get('/admin/restaurants', auth, authorize(USER_ROLES.ADMIN), adminController.restaurants);
router.post('/admin/restaurants', auth, authorize(USER_ROLES.ADMIN), adminController.createRestaurant);
router.patch('/admin/restaurants/:id', auth, authorize(USER_ROLES.ADMIN), adminController.updateRestaurant);
router.get('/admin/:restaurantId/overview', auth, authorize(USER_ROLES.ADMIN), adminController.overview);
router.get('/admin/:restaurantId/reports', auth, authorize(USER_ROLES.ADMIN), adminController.reports);
router.get('/admin/:restaurantId/revenue', auth, authorize(USER_ROLES.ADMIN), adminController.revenue);
router.get('/admin/:restaurantId/payments', auth, authorize(USER_ROLES.ADMIN), paymentController.listForRestaurant);
router.post('/admin/:restaurantId/tables', auth, authorize(USER_ROLES.ADMIN, USER_ROLES.STAFF), adminController.addTable);
router.get('/admin/:restaurantId/tables', auth, authorize(USER_ROLES.ADMIN, USER_ROLES.STAFF), adminController.listTables);
router.get('/admin/:restaurantId/coupons', auth, authorize(USER_ROLES.ADMIN), staffAdminController.listCoupons);
router.post('/admin/:restaurantId/coupons', auth, authorize(USER_ROLES.ADMIN), staffAdminController.createCoupon);
router.patch('/admin/coupons/:id', auth, authorize(USER_ROLES.ADMIN), staffAdminController.updateCoupon);
router.delete('/admin/coupons/:id', auth, authorize(USER_ROLES.ADMIN), staffAdminController.deleteCoupon);
router.get('/admin/:restaurantId/staff', auth, authorize(USER_ROLES.ADMIN), staffAdminController.listStaff);
router.get('/admin/:restaurantId/kitchen', auth, authorize(USER_ROLES.ADMIN), staffAdminController.listKitchen);

// QR
router.get('/admin/:restaurantId/qrcodes', auth, staffAdminController.listQR);
router.get('/restaurants/:restaurantId/tables/:tableId/qr', auth, restaurantController.qrForTable);
router.post('/restaurants/:restaurantId/tables/:tableId/qr/regenerate', auth, authorize(USER_ROLES.ADMIN, USER_ROLES.STAFF), restaurantController.regenerateQR);

// Admin menu management
router.post('/admin/restaurants/:restaurantId/categories', auth, authorize(USER_ROLES.ADMIN), menuController.addCategory);
router.patch('/admin/categories/:id', auth, authorize(USER_ROLES.ADMIN), menuController.updateCategory);
router.delete('/admin/categories/:id', auth, authorize(USER_ROLES.ADMIN), menuController.removeCategory);
router.post('/admin/restaurants/:restaurantId/items', auth, authorize(USER_ROLES.ADMIN), menuController.addItem);
router.put('/admin/items/:id', auth, authorize(USER_ROLES.ADMIN), menuController.updateItem);
router.patch('/admin/items/:id/availability', auth, authorize(USER_ROLES.ADMIN), menuController.toggleAvailability);
router.delete('/admin/items/:id', auth, authorize(USER_ROLES.ADMIN), menuController.removeItem);

export default router;