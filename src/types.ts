/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ProductVariant {
  id: string;
  name: string; // e.g., "S", "M", "L" or "Black", "Silver"
  priceModifier: number; // e.g., +0, +50
  stock: number;
  image?: string; // specific image for this variant/size
}

export interface Review {
  id: string;
  productId: string;
  userName: string;
  userAvatar?: string;
  rating: number; // 1-5
  comment: string;
  date: string;
  verified: boolean;
}

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number; // base price in USD
  rating: number;
  ratingCount: number;
  category: string;
  subcategory: string;
  tags: string[];
  image: string; // primary image URL or data-URI
  images: string[]; // gallery images
  brand: string;
  sku: string;
  stock: number;
  isActive: boolean;
  isApproved: boolean; // For vendor products
  vendorId?: string;
  vendorName?: string;
  variants: {
    colors?: ProductVariant[];
    sizes?: ProductVariant[];
  };
  specifications: Record<string, string>;
  isFeatured?: boolean;
  isBestSeller?: boolean;
  isNewArrival?: boolean;
  isFlashDeal?: boolean;
  isTrending?: boolean;
  discountPrice?: number;
  productStory?: string;
}

export interface CartItem {
  id: string; // unique for this selection cart item (productId + color + size)
  productId: string;
  title: string;
  price: number; // calculated full item price including modifiers
  image: string;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  stockLimit: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'returned' | 'refunded';

export interface OrderItem {
  productId: string;
  title: string;
  price: number;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
  image: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shippingCost: number;
  discount: number;
  total: number;
  couponCode?: string;
  paymentMethod: string;
  paymentStatus: 'paid' | 'unpaid' | 'refunded';
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
  };
  status: OrderStatus;
  statusHistory: { status: OrderStatus; timestamp: string; note?: string }[];
  vendorStatuses?: Record<string, OrderStatus>;
  createdAt: string;
  estimatedDelivery: string;
  deliveryMethod?: 'pickup' | 'delivery';
  mobilePayment?: {
    provider: 'zaad' | 'edahab';
    transactionNumber: string;
    senderNumber: string;
    senderName: string;
    dateTime: string;
  };
  deliveryFeeRemittanceStatus?: 'owed' | 'submitted' | 'confirmed';
  deliveryFeeRemittanceDetails?: {
    provider: 'zaad' | 'edahab';
    transactionNumber: string;
    senderNumber: string;
    dateRemitted: string;
  };
}

export type UserRole = 'customer' | 'vendor' | 'admin' | 'superadmin' | 'support' | 'warehouse' | 'delivery_manager' | 'order_manager' | 'general_vendor_user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  language?: 'en' | 'ar' | 'es';
  currency?: 'USD' | 'EUR' | 'AED';
  addresses?: {
    id: string;
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
    isDefault: boolean;
  }[];
  wishlist?: string[]; // product IDs
  vendorName?: string;
  vendorStatus?: 'pending' | 'approved' | 'rejected';
  vendorEarnings?: number;
}

export interface VendorSubUser {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'order_manager' | 'general_vendor_user';
}

export interface Vendor {
  id: string;
  vendorName: string;
  representativeName: string;
  email: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected';
  earnings: number;
  description: string;
  taxId?: string;
  createdAt: string;
  password?: string;
  zaadNumber?: string;
  edahabNumber?: string;
  subUsers?: VendorSubUser[];
  rating?: number;
  reviewsCount?: number;
  productsCount?: number;
  ordersCount?: number;
  banner?: string;
  logo?: string;
  isClosed?: boolean;
}

export interface Coupon {
  code: string;
  discountType: 'percentage' | 'fixed';
  value: number; // e.g., 10 for 10% or $10
  minSpend: number;
  expiryDate: string;
  isActive: boolean;
  vendorId?: string;
  vendorName?: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved';
  messages: { sender: 'user' | 'support'; text: string; timestamp: string }[];
  createdAt: string;
}

export interface SalesReportEntry {
  date: string;
  sales: number;
  orders: number;
  revenue: number;
}

export interface HeroCampaign {
  id: string;
  vendorId: string;
  vendorName: string;
  image: string; // URL or Data-URI
  title: string;
  subtitle: string;
  linkUrl?: string;
  pricingTier: string; // e.g. "Frontpage Premium Hero"
  durationDays: number;
  feeUSD: number;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  approvedAt?: string;
}

export interface ProductCategory {
  id: string;
  name: string;
  subcategories: string[];
}

