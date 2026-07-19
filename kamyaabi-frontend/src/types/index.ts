export interface User {
  id: number;
  email: string;
  phoneNumber?: string | null;
  name: string;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN';
  status?: 'ACTIVE' | 'BLOCKED' | 'REMOVED';
}

export interface AdminUser {
  id: number;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'BLOCKED' | 'REMOVED';
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
  parentId: number | null;
  parentName: string | null;
  productCount: number;
}

export interface ProductImage {
  id: number;
  imageUrl: string;
  publicId: string;
  isMain: boolean;
  displayOrder: number;
}

export interface ProductVariation {
  id: number;
  slug: string;
  weight: string;
  unit: string;
  price: number;
  discountPrice: number | null;
  stock: number;
  mainImageUrl: string | null;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  discountPrice: number | null;
  imageUrl: string;
  mainImageUrl: string | null;
  images: ProductImage[];
  categoryId: number;
  categoryName: string;
  categorySlug?: string | null;
  stock: number;
  weight: string;
  unit: string;
  shelfLife?: string | null;
  nutritionalInfo?: Record<string, string> | null;
  howToUse?: string[] | null;
  storageTips?: string[] | null;
  tags?: ProductTag[];
  active: boolean;
  createdAt: string;
  seoTitle?: string | null;
  seoDescription?: string | null;
  seoKeywords?: string | null;
  ogImageUrl?: string | null;
  canonicalUrl?: string | null;
  variations?: ProductVariation[] | null;
  variationCount?: number;
}

export interface Review {
  id: number;
  authorName: string;
  title: string | null;
  rating: number;
  text: string | null;
  images: string[];
  userId: number | null;
  createdAt: string;
}

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
  recentBuyersCount: number;
}

export interface Faq {
  id: number;
  question: string;
  answer: string;
  displayOrder: number;
}

export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  productImageUrl: string;
  productPrice: number;
  productDiscountPrice: number | null;
  quantity: number;
  subtotal: number;
}

export interface Cart {
  id: number;
  items: CartItem[];
  totalAmount: number;
  totalItems: number;
}

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productImageUrl: string;
  quantity: number;
  price: number;
  subtotal: number;
  weightKg: number | null;
  productWeight: string | null;
  productUnit: string | null;
}

export interface Address {
  id: number;
  fullName: string;
  phone: string;
  street: string;
  addressLine2: string | null;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export interface Payment {
  id: number;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  amount: number;
  status: string;
  createdAt: string;
}

export type PaymentMethod = 'PREPAID' | 'COD';

export interface TrackingEvent {
  date: string;
  status: string;
  activity: string;
  location: string;
}

export interface TrackingInfo {
  tracking_data?: {
    track_status?: number;
    shipment_status?: number;
    shipment_track?: Array<{
      current_status: string;
      courier_name: string;
      edd: string | null;
      awb_code: string;
    }>;
    shipment_track_activities?: TrackingEvent[];
  };
}

export interface PublicOrderTracking {
  orderId: number;
  orderStatus: string;
  shippingStatus: string | null;
  awbNumber: string | null;
  courierName: string | null;
  placedAt: string | null;
  deliveredAt: string | null;
  trackingData: TrackingInfo | null;
}

export interface Order {
  id: number;
  items: OrderItem[];
  totalAmount: number;
  totalWeightKg: number | null;
  status: string;
  paymentMethod: PaymentMethod;
  shippingAddress: Address | null;
  payment: Payment | null;
  shiprocketOrderId: string | null;
  shiprocketShipmentId: string | null;
  awbNumber: string | null;
  courierName: string | null;
  shippingStatus: string | null;
  pickupScheduledAt: string | null;
  deliveredAt: string | null;
  shiprocketSynced: boolean | null;
  couponCode: string | null;
  discountAmount: number | null;
  invoiceNumber: string | null;
  invoiceUrl: string | null;
  invoiceGenerated: boolean | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShiprocketStats {
  totalSynced: number;
  syncPending: number;
  pickupScheduled: number;
  awbAssigned: number;
  inTransit: number;
  delivered: number;
  cancelled: number;
  codOrders: number;
  shiprocketConfigured: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
}

export interface ApiErrorResponse {
  status: number;
  error: string;
  message: string;
  path?: string;
  traceId?: string;
  fieldErrors?: Record<string, string>;
  timestamp?: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  lowStockCount: number;
}

export interface AnalyticsPoint {
  date: string;
  orders: number;
  revenue: number;
}

export interface AnalyticsResponse {
  startDate: string;
  endDate: string;
  totalOrders: number;
  totalRevenue: number;
  points: AnalyticsPoint[];
}

export interface RazorpayOrder {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  orderId: number;
  keyId: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ── Blog Types ──────────────────────────────────────────────

export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  parentId: number | null;
  parentName: string | null;
  postCount: number;
  createdAt: string;
}

export interface BlogTag {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  postCount: number;
  createdAt: string;
}

export type BlogPostStatus = 'DRAFT' | 'PUBLISHED' | 'SCHEDULED';

export interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  coverImageUrl: string | null;
  coverImageAlt: string | null;
  authorId: number;
  authorName: string | null;
  authorAvatarUrl: string | null;
  status: BlogPostStatus;
  publishedAt: string | null;
  scheduledAt: string | null;
  categories: BlogCategory[];
  tags: BlogTag[];
  seoTitle: string | null;
  seoDescription: string | null;
  seoKeywords: string | null;
  ogImageUrl: string | null;
  canonicalUrl: string | null;
  readingTimeMinutes: number;
  viewCount: number;
  isFeatured: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── Product Tag Types ───────────────────────────────────────

export interface ProductTag {
  id: number;
  name: string;
  slug: string;
  productCount?: number;
  createdAt: string;
}

// ── Wishlist Types ──────────────────────────────────────────

export interface WishlistItem {
  id: number;
  productId: number;
  productName: string;
  productSlug: string;
  categorySlug?: string | null;
  productImageUrl: string;
  productPrice: number;
  productDiscountPrice: number | null;
  inStock: boolean;
  addedAt: string;
}

export interface Wishlist {
  id: number;
  items: WishlistItem[];
  totalItems: number;
}

// ── Coupon Types ────────────────────────────────────────────

export interface Coupon {
  id: number;
  code: string;
  discountType: 'PERCENTAGE' | 'FLAT';
  discountValue: number;
  isActive: boolean;
  expiresAt: string | null;
  usageCount: number;
  uniqueMembers: number;
  createdAt: string;
  updatedAt: string;
}

export interface CouponValidationResult {
  valid: boolean;
  code: string;
  discountType: string | null;
  discountValue: number | null;
  discountAmount: number | null;
  message: string;
}

// ── Order CSV Import Types ──────────────────────────────────

export interface OrderImportResult {
  success: boolean;
  totalRows: number;
  updatedOrders: number;
  skippedRows: number;
  errors: string[];
}

export interface ProductImportResult {
  updated: number;
  created: number;
  errors?: string[];
}

export interface PackageDimensionSetting {
  id: number;
  packageWeightGram: number;
  length: number;
  breadth: number;
  height: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PackageDimensionSettingRequest {
  packageWeightGram: number;
  length: number;
  breadth: number;
  height: number;
  active?: boolean;
}
