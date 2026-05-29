import type { SvgIconComponent } from '@mui/icons-material';
import {
  Dashboard,
  Inventory2Outlined,
  CategoryOutlined,
  LocalOfferOutlined,
  ReceiptLongOutlined,
  ConfirmationNumberOutlined,
  RateReviewOutlined,
  PeopleAltOutlined,
  InsightsOutlined,
  ViewCarouselOutlined,
  ArticleOutlined,
  BookmarksOutlined,
  SettingsOutlined,
} from '@mui/icons-material';

export interface AdminNavItem {
  label: string;
  /** Route path the link points to (may include a query string). */
  to: string;
  icon: SvgIconComponent;
  /** Tab id for `/admin?tab=` driven sections; undefined for standalone routes. */
  tab?: string;
}

export interface AdminNavSection {
  heading: string;
  items: AdminNavItem[];
}

/**
 * Single source of truth for the admin sidebar and breadcrumb labels.
 * Paths mirror the existing route table — no route paths are changed; the
 * `/admin` tabbed sections are addressed via the existing `?tab=` query param.
 */
export const ADMIN_NAV: AdminNavSection[] = [
  {
    heading: 'Overview',
    items: [{ label: 'Dashboard', to: '/admin', icon: Dashboard }],
  },
  {
    heading: 'Catalog',
    items: [
      { label: 'Products', to: '/admin?tab=products', icon: Inventory2Outlined, tab: 'products' },
      { label: 'Categories', to: '/admin?tab=categories', icon: CategoryOutlined, tab: 'categories' },
      { label: 'Product Tags', to: '/admin/products/tags', icon: LocalOfferOutlined },
    ],
  },
  {
    heading: 'Sales',
    items: [
      { label: 'Orders', to: '/admin?tab=orders', icon: ReceiptLongOutlined, tab: 'orders' },
      { label: 'Coupons', to: '/admin?tab=coupons', icon: ConfirmationNumberOutlined, tab: 'coupons' },
    ],
  },
  {
    heading: 'Content',
    items: [
      { label: 'Hero Banners', to: '/admin?tab=hero-banners', icon: ViewCarouselOutlined, tab: 'hero-banners' },
      { label: 'Blog Posts', to: '/admin/blog', icon: ArticleOutlined },
      { label: 'Blog Categories', to: '/admin/blog/categories', icon: CategoryOutlined },
      { label: 'Blog Tags', to: '/admin/blog/tags', icon: BookmarksOutlined },
    ],
  },
  {
    heading: 'Insights & People',
    items: [
      { label: 'Reviews', to: '/admin?tab=reviews', icon: RateReviewOutlined, tab: 'reviews' },
      { label: 'Analytics', to: '/admin?tab=analytics', icon: InsightsOutlined, tab: 'analytics' },
      { label: 'Users', to: '/admin?tab=users', icon: PeopleAltOutlined, tab: 'users' },
    ],
  },
  {
    heading: 'System',
    items: [{ label: 'Settings', to: '/admin?tab=settings', icon: SettingsOutlined, tab: 'settings' }],
  },
];

export const ADMIN_NAV_ITEMS: AdminNavItem[] = ADMIN_NAV.flatMap((s) => s.items);

export interface Crumb {
  label: string;
  to?: string;
}

const STATIC_CRUMB_LABELS: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/blog': 'Blog Posts',
  '/admin/blog/new': 'New Post',
  '/admin/blog/categories': 'Blog Categories',
  '/admin/blog/tags': 'Blog Tags',
  '/admin/products/tags': 'Product Tags',
  '/admin/products/categories': 'Product Categories',
  '/admin/products/new': 'New Product',
  '/admin/categories/new': 'New Category',
  '/admin/coupons/new': 'New Coupon',
  '/admin/hero-banners/new': 'New Hero Banner',
  '/admin/products/tags/new': 'New Product Tag',
  '/admin/blog/categories/new': 'New Blog Category',
  '/admin/blog/tags/new': 'New Blog Tag',
};

const TAB_CRUMB_LABELS: Record<string, string> = {
  products: 'Products',
  categories: 'Categories',
  orders: 'Orders',
  coupons: 'Coupons',
  reviews: 'Reviews',
  users: 'Users',
  analytics: 'Analytics',
  settings: 'Settings',
  'hero-banners': 'Hero Banners',
};

/**
 * Build breadcrumb trail from the current pathname + optional `tab` query value.
 * Always rooted at the Admin dashboard.
 */
export const buildAdminBreadcrumbs = (
  pathname: string,
  tab?: string | null,
  trailingLabel?: string,
): Crumb[] => {
  const crumbs: Crumb[] = [{ label: 'Admin', to: '/admin' }];

  if (pathname === '/admin') {
    if (tab && tab !== 'products' && TAB_CRUMB_LABELS[tab]) {
      crumbs.push({ label: TAB_CRUMB_LABELS[tab] });
    } else {
      crumbs.push({ label: tab && TAB_CRUMB_LABELS[tab] ? TAB_CRUMB_LABELS[tab] : 'Dashboard' });
    }
    return crumbs;
  }

  const known = STATIC_CRUMB_LABELS[pathname];
  if (known) {
    crumbs.push({ label: known });
  } else {
    // Parameterised routes (edit pages): derive a sensible label.
    if (pathname.startsWith('/admin/blog/edit')) {
      crumbs.push({ label: 'Blog Posts', to: '/admin/blog' });
      crumbs.push({ label: trailingLabel ?? 'Edit Post' });
    } else if (pathname.startsWith('/admin/blog/categories/edit')) {
      crumbs.push({ label: 'Blog Categories', to: '/admin/blog/categories' });
      crumbs.push({ label: trailingLabel ?? 'Edit Category' });
    } else if (pathname.startsWith('/admin/blog/tags/edit')) {
      crumbs.push({ label: 'Blog Tags', to: '/admin/blog/tags' });
      crumbs.push({ label: trailingLabel ?? 'Edit Tag' });
    } else if (pathname.startsWith('/admin/products/tags/edit')) {
      crumbs.push({ label: 'Product Tags', to: '/admin/products/tags' });
      crumbs.push({ label: trailingLabel ?? 'Edit Tag' });
    } else if (pathname.startsWith('/admin/products/edit')) {
      crumbs.push({ label: 'Products', to: '/admin?tab=products' });
      crumbs.push({ label: trailingLabel ?? 'Edit Product' });
    } else if (pathname.startsWith('/admin/categories/edit')) {
      crumbs.push({ label: 'Categories', to: '/admin?tab=categories' });
      crumbs.push({ label: trailingLabel ?? 'Edit Category' });
    } else if (pathname.startsWith('/admin/coupons/edit')) {
      crumbs.push({ label: 'Coupons', to: '/admin?tab=coupons' });
      crumbs.push({ label: trailingLabel ?? 'Edit Coupon' });
    } else if (pathname.startsWith('/admin/hero-banners/edit')) {
      crumbs.push({ label: 'Hero Banners', to: '/admin?tab=hero-banners' });
      crumbs.push({ label: trailingLabel ?? 'Edit Hero Banner' });
    } else {
      crumbs.push({ label: trailingLabel ?? 'Admin' });
    }
  }

  if (trailingLabel && known) {
    // e.g. New Product already covered; nothing extra.
  }
  return crumbs;
};
