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
  LocalShippingOutlined,
} from '@mui/icons-material';

export interface AdminNavItem {
  label: string;
  /** Route path the link points to. */
  to: string;
  icon: SvgIconComponent;
}

export interface AdminNavSection {
  heading: string;
  items: AdminNavItem[];
}

/**
 * Single source of truth for the admin sidebar and breadcrumb labels.
 * Every admin section is a dedicated route.
 */
export const ADMIN_NAV: AdminNavSection[] = [
  {
    heading: 'Overview',
    items: [{ label: 'Dashboard', to: '/admin', icon: Dashboard }],
  },
  {
    heading: 'Catalog',
    items: [
      { label: 'Products', to: '/admin/products', icon: Inventory2Outlined },
      { label: 'Categories', to: '/admin/categories', icon: CategoryOutlined },
      { label: 'Product Tags', to: '/admin/products/tags', icon: LocalOfferOutlined },
    ],
  },
  {
    heading: 'Sales',
    items: [
      { label: 'Orders', to: '/admin/orders', icon: ReceiptLongOutlined },
      { label: 'Shipping', to: '/admin/shipping', icon: LocalShippingOutlined },
      { label: 'Coupons', to: '/admin/coupons', icon: ConfirmationNumberOutlined },
      { label: 'Shiprocket', to: '/admin/shiprocket', icon: LocalShippingOutlined },
    ],
  },
  {
    heading: 'Content',
    items: [
      { label: 'Hero Banners', to: '/admin/hero-banners', icon: ViewCarouselOutlined },
      { label: 'Blog Posts', to: '/admin/blog', icon: ArticleOutlined },
      { label: 'Blog Categories', to: '/admin/blog/categories', icon: CategoryOutlined },
      { label: 'Blog Tags', to: '/admin/blog/tags', icon: BookmarksOutlined },
    ],
  },
  {
    heading: 'Insights & People',
    items: [
      { label: 'Reviews', to: '/admin/reviews', icon: RateReviewOutlined },
      { label: 'Analytics', to: '/admin/analytics', icon: InsightsOutlined },
      { label: 'Users', to: '/admin/users', icon: PeopleAltOutlined },
    ],
  },
  {
    heading: 'System',
    items: [{ label: 'Settings', to: '/admin/settings', icon: SettingsOutlined }],
  },
];

export const ADMIN_NAV_ITEMS: AdminNavItem[] = ADMIN_NAV.flatMap((s) => s.items);

export interface Crumb {
  label: string;
  to?: string;
}

const STATIC_CRUMB_LABELS: Record<string, string> = {
  '/admin': 'Dashboard',
  '/admin/products': 'Products',
  '/admin/categories': 'Categories',
  '/admin/orders': 'Orders',
  '/admin/shipping': 'Shipping',
  '/admin/coupons': 'Coupons',
  '/admin/shiprocket': 'Shiprocket',
  '/admin/reviews': 'Reviews',
  '/admin/users': 'Users',
  '/admin/analytics': 'Analytics',
  '/admin/settings': 'Settings',
  '/admin/hero-banners': 'Hero Banners',
  '/admin/blog': 'Blog Posts',
  '/admin/blog/new': 'New Post',
  '/admin/blog/categories': 'Blog Categories',
  '/admin/blog/tags': 'Blog Tags',
  '/admin/products/tags': 'Product Tags',
  '/admin/products/new': 'New Product',
  '/admin/categories/new': 'New Category',
  '/admin/coupons/new': 'New Coupon',
  '/admin/hero-banners/new': 'New Hero Banner',
  '/admin/products/tags/new': 'New Product Tag',
  '/admin/blog/categories/new': 'New Blog Category',
  '/admin/blog/tags/new': 'New Blog Tag',
};

/** Parameterised edit routes -> [parent label, parent path, default leaf label]. */
const EDIT_CRUMBS: { prefix: string; parentLabel: string; parentTo: string; leaf: string }[] = [
  { prefix: '/admin/blog/categories/edit', parentLabel: 'Blog Categories', parentTo: '/admin/blog/categories', leaf: 'Edit Category' },
  { prefix: '/admin/blog/tags/edit', parentLabel: 'Blog Tags', parentTo: '/admin/blog/tags', leaf: 'Edit Tag' },
  { prefix: '/admin/blog/edit', parentLabel: 'Blog Posts', parentTo: '/admin/blog', leaf: 'Edit Post' },
  { prefix: '/admin/products/tags/edit', parentLabel: 'Product Tags', parentTo: '/admin/products/tags', leaf: 'Edit Tag' },
  { prefix: '/admin/products/edit', parentLabel: 'Products', parentTo: '/admin/products', leaf: 'Edit Product' },
  { prefix: '/admin/categories/edit', parentLabel: 'Categories', parentTo: '/admin/categories', leaf: 'Edit Category' },
  { prefix: '/admin/coupons/edit', parentLabel: 'Coupons', parentTo: '/admin/coupons', leaf: 'Edit Coupon' },
  { prefix: '/admin/hero-banners/edit', parentLabel: 'Hero Banners', parentTo: '/admin/hero-banners', leaf: 'Edit Hero Banner' },
];

/**
 * Build breadcrumb trail from the current pathname. Always rooted at the Admin
 * dashboard.
 */
export const buildAdminBreadcrumbs = (
  pathname: string,
  trailingLabel?: string,
): Crumb[] => {
  const crumbs: Crumb[] = [{ label: 'Admin', to: '/admin' }];

  if (pathname === '/admin') {
    crumbs.push({ label: 'Dashboard' });
    return crumbs;
  }

  const known = STATIC_CRUMB_LABELS[pathname];
  if (known) {
    crumbs.push({ label: known });
    return crumbs;
  }

  const edit = EDIT_CRUMBS.find((e) => pathname.startsWith(e.prefix));
  if (edit) {
    crumbs.push({ label: edit.parentLabel, to: edit.parentTo });
    crumbs.push({ label: trailingLabel ?? edit.leaf });
  } else {
    crumbs.push({ label: trailingLabel ?? 'Admin' });
  }
  return crumbs;
};
