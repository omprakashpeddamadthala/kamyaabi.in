import React, { lazy, useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/layout/Layout';
import AdminLayout from '../components/admin/layout/AdminLayout';
import { useAppSelector, useAppDispatch } from '../hooks/useAppDispatch';
import { isSessionExpired, clearSession } from '../api/axiosInstance';
import { logout } from '../features/auth/authSlice';
import { clearCart } from '../features/cart/cartSlice';

const HomePage = lazy(() => import('../pages/HomePage'));
const ProductsPage = lazy(() => import('../pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('../pages/ProductDetailPage'));
const CartPage = lazy(() => import('../pages/CartPage'));
const CheckoutPage = lazy(() => import('../pages/CheckoutPage'));
const OrdersPage = lazy(() => import('../pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('../pages/OrderDetailPage'));
const LoginPage = lazy(() => import('../pages/LoginPage'));
const AdminPage = lazy(() => import('../pages/AdminPage'));
const AboutPage = lazy(() => import('../pages/AboutPage'));
const ContactPage = lazy(() => import('../pages/ContactPage'));
const ProfilePage = lazy(() => import('../pages/ProfilePage'));
const RefundPolicyPage = lazy(() => import('../pages/RefundPolicyPage'));

const BlogListPage = lazy(() => import('../pages/BlogListPage'));
const BlogPostPage = lazy(() => import('../pages/BlogPostPage'));
const BlogCategoryPage = lazy(() => import('../pages/BlogCategoryPage'));
const BlogTagPage = lazy(() => import('../pages/BlogTagPage'));

const AdminBlogListPage = lazy(() => import('../pages/AdminBlogListPage'));
const AdminBlogEditorPage = lazy(() => import('../pages/AdminBlogEditorPage'));
const AdminBlogCategoriesPage = lazy(() => import('../pages/AdminBlogCategoriesPage'));
const AdminBlogTagsPage = lazy(() => import('../pages/AdminBlogTagsPage'));
const AdminProductTagsPage = lazy(() => import('../pages/AdminProductTagsPage'));
const AdminProductCategoriesPage = lazy(() => import('../pages/AdminProductCategoriesPage'));

const AdminProductFormPage = lazy(() => import('../pages/admin/AdminProductFormPage'));
const AdminCategoryFormPage = lazy(() => import('../pages/admin/AdminCategoryFormPage'));
const AdminCouponFormPage = lazy(() => import('../pages/admin/AdminCouponFormPage'));
const AdminHeroBannerFormPage = lazy(() => import('../pages/admin/AdminHeroBannerFormPage'));
const AdminProductTagFormPage = lazy(() => import('../pages/admin/AdminProductTagFormPage'));
const AdminBlogCategoryFormPage = lazy(() => import('../pages/admin/AdminBlogCategoryFormPage'));
const AdminBlogTagFormPage = lazy(() => import('../pages/admin/AdminBlogTagFormPage'));

function useSessionGuard(): { authenticated: boolean } {
  const dispatch = useAppDispatch();
  const { user, token } = useAppSelector((state) => state.auth);
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    if (user && token && isSessionExpired()) {
      clearSession(true);
      dispatch(logout());
      dispatch(clearCart());
      setExpired(true);
    }
  }, [user, token, dispatch]);

  return { authenticated: Boolean(user && token && !expired) };
}

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authenticated } = useSessionGuard();
  if (!authenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const AdminLayoutRoute: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const { authenticated } = useSessionGuard();
  if (!authenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'ADMIN') return <Navigate to="/" replace />;
  return <AdminLayout />;
};

const CustomerRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAppSelector((state) => state.auth);
  const { authenticated } = useSessionGuard();
  if (!authenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'ADMIN') return <Navigate to="/products" replace />;
  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/products" element={<ProductsPage />} />
        {}
        <Route path="/products/:slug" element={<ProductDetailPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/refund-policy" element={<RefundPolicyPage />} />
        <Route path="/login" element={<LoginPage />} />

        {/* Public Blog Routes */}
        <Route path="/blog" element={<BlogListPage />} />
        <Route path="/blog/category/:slug" element={<BlogCategoryPage />} />
        <Route path="/blog/tag/:slug" element={<BlogTagPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />

        <Route
          path="/cart"
          element={
            <CustomerRoute>
              <CartPage />
            </CustomerRoute>
          }
        />
        <Route
          path="/checkout"
          element={
            <CustomerRoute>
              <CheckoutPage />
            </CustomerRoute>
          }
        />
        <Route
          path="/orders"
          element={
            <CustomerRoute>
              <OrdersPage />
            </CustomerRoute>
          }
        />
        <Route
          path="/orders/:id"
          element={
            <CustomerRoute>
              <OrderDetailPage />
            </CustomerRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>

      {/* Admin panel — dedicated shell (sidebar + top app bar), guarded by role */}
      <Route element={<AdminLayoutRoute />}>
        <Route path="/admin" element={<AdminPage />} />

        <Route path="/admin/products/new" element={<AdminProductFormPage />} />
        <Route path="/admin/products/edit/:id" element={<AdminProductFormPage />} />
        <Route path="/admin/categories/new" element={<AdminCategoryFormPage />} />
        <Route path="/admin/categories/edit/:id" element={<AdminCategoryFormPage />} />
        <Route path="/admin/coupons/new" element={<AdminCouponFormPage />} />
        <Route path="/admin/coupons/edit/:id" element={<AdminCouponFormPage />} />
        <Route path="/admin/hero-banners/new" element={<AdminHeroBannerFormPage />} />
        <Route path="/admin/hero-banners/edit/:id" element={<AdminHeroBannerFormPage />} />

        <Route path="/admin/blog" element={<AdminBlogListPage />} />
        <Route path="/admin/blog/new" element={<AdminBlogEditorPage />} />
        <Route path="/admin/blog/edit/:id" element={<AdminBlogEditorPage />} />
        <Route path="/admin/blog/categories" element={<AdminBlogCategoriesPage />} />
        <Route path="/admin/blog/categories/new" element={<AdminBlogCategoryFormPage />} />
        <Route path="/admin/blog/categories/edit/:id" element={<AdminBlogCategoryFormPage />} />
        <Route path="/admin/blog/tags" element={<AdminBlogTagsPage />} />
        <Route path="/admin/blog/tags/new" element={<AdminBlogTagFormPage />} />
        <Route path="/admin/blog/tags/edit/:id" element={<AdminBlogTagFormPage />} />

        <Route path="/admin/products/tags" element={<AdminProductTagsPage />} />
        <Route path="/admin/products/tags/new" element={<AdminProductTagFormPage />} />
        <Route path="/admin/products/tags/edit/:id" element={<AdminProductTagFormPage />} />
        <Route path="/admin/products/categories" element={<AdminProductCategoriesPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
