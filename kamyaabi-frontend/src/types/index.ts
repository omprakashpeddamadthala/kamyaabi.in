export interface User {
  id: number;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN';
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

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  discountPrice: number | null;
  imageUrl: string;
  mainImageUrl: string | null;
  images: ProductImage[];
  categoryId: number;
  categoryName: string;
  stock: number;
  weight: string;
  unit: string;
  active: boolean;
  createdAt: string;
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

export interface Order {
  id: number;
  items: OrderItem[];
  totalAmount: number;
  status: string;
  shippingAddress: Address | null;
  payment: Payment | null;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T;
}

/**
 * Mirrors {@code com.kamyaabi.dto.response.ApiErrorResponse} on the backend.
 * Used by admin forms to display per-field validation errors and surface a
 * traceId to the user when something goes wrong.
 */
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
