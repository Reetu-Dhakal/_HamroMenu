import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ProtectedRoute from './ProtectedRoute';
import { PageLoader } from '../components/ui';

const LandingPage = lazy(() => import('../pages/LandingPage'));
const MenuPage = lazy(() => import('../pages/customer/MenuPage'));
const CartPage = lazy(() => import('../pages/customer/CartPage'));
const CheckoutPage = lazy(() => import('../pages/customer/CheckoutPage'));
const OrderTrackingPage = lazy(() => import('../pages/customer/OrderTrackingPage'));
const OrderHistoryPage = lazy(() => import('../pages/customer/OrderHistoryPage'));
const ProfilePage = lazy(() => import('../pages/customer/ProfilePage'));
const ReviewsPage = lazy(() => import('../pages/customer/ReviewsPage'));
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const StaffDashboardPage = lazy(() => import('../pages/staff/StaffDashboardPage'));
const KitchenDashboardPage = lazy(() => import('../pages/kitchen/KitchenDashboardPage'));
const AdminDashboardPage = lazy(() => import('../pages/admin/AdminDashboardPage'));
const AdminMenuPage = lazy(() => import('../pages/admin/AdminMenuPage'));
const AdminCategoriesPage = lazy(() => import('../pages/admin/AdminCategoriesPage'));
const AdminTablesPage = lazy(() => import('../pages/admin/AdminTablesPage'));
const AdminOrdersPage = lazy(() => import('../pages/admin/AdminOrdersPage'));
const AdminAnalyticsPage = lazy(() => import('../pages/admin/AdminAnalyticsPage'));
const AdminStaffPage = lazy(() => import('../pages/admin/AdminStaffPage'));
const AdminReviewsPage = lazy(() => import('../pages/admin/AdminReviewsPage'));
const NotFound = lazy(() => import('../pages/NotFound'));

function Lazy({ children }) {
  return <Suspense fallback={<PageLoader label="Loading…" />}>{children}</Suspense>;
}

export default function AppRouter() {
  return (
    <>
      <Helmet>
        <meta name="robots" content="index,follow" />
      </Helmet>
      <Routes>
        <Route path="/" element={<Lazy><LandingPage /></Lazy>} />

        <Route path="/menu/table/:tableNumber" element={<Lazy><MenuPage /></Lazy>} />
        <Route path="/menu" element={<Lazy><MenuPage /></Lazy>} />
        <Route path="/cart" element={<Lazy><CartPage /></Lazy>} />
        <Route path="/checkout" element={<ProtectedRoute roles={['customer']}><Lazy><CheckoutPage /></Lazy></ProtectedRoute>} />
        <Route path="/order/:orderId/track" element={<Lazy><OrderTrackingPage /></Lazy>} />

        <Route path="/order-history" element={<ProtectedRoute roles={['customer']}><Lazy><OrderHistoryPage /></Lazy></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute roles={['customer']}><Lazy><ProfilePage /></Lazy></ProtectedRoute>} />
        <Route path="/reviews" element={<ProtectedRoute roles={['customer']}><Lazy><ReviewsPage /></Lazy></ProtectedRoute>} />

        <Route path="/login" element={<Lazy><LoginPage /></Lazy>} />
        <Route path="/register" element={<Lazy><RegisterPage /></Lazy>} />

        <Route path="/staff" element={<ProtectedRoute roles={['staff', 'admin']}><Lazy><StaffDashboardPage /></Lazy></ProtectedRoute>} />
        <Route path="/kitchen" element={<ProtectedRoute roles={['kitchen', 'admin']}><Lazy><KitchenDashboardPage /></Lazy></ProtectedRoute>} />

        <Route path="/admin" element={<ProtectedRoute roles={['admin']}><Lazy><AdminDashboardPage /></Lazy></ProtectedRoute>} />
        <Route path="/admin/menu" element={<ProtectedRoute roles={['admin']}><Lazy><AdminMenuPage /></Lazy></ProtectedRoute>} />
        <Route path="/admin/categories" element={<ProtectedRoute roles={['admin']}><Lazy><AdminCategoriesPage /></Lazy></ProtectedRoute>} />
        <Route path="/admin/tables" element={<ProtectedRoute roles={['admin']}><Lazy><AdminTablesPage /></Lazy></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute roles={['admin']}><Lazy><AdminOrdersPage /></Lazy></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute roles={['admin']}><Lazy><AdminAnalyticsPage /></Lazy></ProtectedRoute>} />
        <Route path="/admin/staff" element={<ProtectedRoute roles={['admin']}><Lazy><AdminStaffPage /></Lazy></ProtectedRoute>} />
        <Route path="/admin/reviews" element={<ProtectedRoute roles={['admin']}><Lazy><AdminReviewsPage /></Lazy></ProtectedRoute>} />

        <Route path="*" element={<Lazy><NotFound /></Lazy>} />
      </Routes>
    </>
  );
}