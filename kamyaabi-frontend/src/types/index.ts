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
  description: string;
  imageUrl: string;
  productCount: number;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  discountPrice: number | null;
  imageUrl: string;
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

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
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
