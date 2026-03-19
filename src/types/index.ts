/**
 * EasyBuy E-Commerce Application - TypeScript Types
 * All interfaces derived from backend DTOs
 */

// ============================================
// User Roles & Enums
// ============================================

export type UserRole = 'CUSTOMER' | 'SELLER' | 'RIDER';

export const UserRole = {
  CUSTOMER: 'CUSTOMER' as const,
  SELLER: 'SELLER' as const,
  RIDER: 'RIDER' as const,
};

export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'SELLER_DELIVERING' | 'RIDER_ASSIGNED' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED';

export const OrderStatus = {
  PENDING: 'PENDING' as const,
  ACCEPTED: 'ACCEPTED' as const,
  SELLER_DELIVERING: 'SELLER_DELIVERING' as const,
  RIDER_ASSIGNED: 'RIDER_ASSIGNED' as const,
  PICKED_UP: 'PICKED_UP' as const,
  DELIVERED: 'DELIVERED' as const,
  CANCELLED: 'CANCELLED' as const,
};

export type DeliveryMethod = 'SELLER' | 'RIDER';

export const DeliveryMethod = {
  SELLER: 'SELLER' as const,
  RIDER: 'RIDER' as const,
};

export type DeliveryStatus = 'REQUESTED' | 'ACCEPTED' | 'AT_SELLER' | 'PICKED_UP' | 'DELIVERED' | 'CANCELLED';

export const DeliveryStatus = {
  REQUESTED: 'REQUESTED' as const,
  ACCEPTED: 'ACCEPTED' as const,
  AT_SELLER: 'AT_SELLER' as const,
  PICKED_UP: 'PICKED_UP' as const,
  DELIVERED: 'DELIVERED' as const,
  CANCELLED: 'CANCELLED' as const,
};

// ============================================
// Auth Types
// ============================================

export interface AuthResponse {
  token: string;
  type: string;
  userId: number;
  email: string;
  fullName: string;
  role: UserRole;
  sellerId?: number;
  riderId?: number;
  phone?: string;
  address?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  // Seller fields
  storeName?: string;
  storeDescription?: string;
  address?: string;
  // Rider fields
  vehicleType?: string;
  vehicleNumber?: string;
}

// ============================================
// Product Types
// ============================================

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: number;
  category?: string;
  imageUrl?: string;
  stock: number;
  sellerId: number;
  sellerName: string;
  storeName: string;
  sellerLatitude?: number;
  sellerLongitude?: number;
  distance?: number;
  createdAt: string;
}

export interface ProductRequest {
  name: string;
  description?: string;
  price: number;
  category?: string;
  imageUrl?: string;
  stock: number;
}

// ============================================
// Order Types
// ============================================

export interface OrderDTO {
  id: number;
  customerId: number;
  customerName: string;
  productId: number;
  productName: string;
  productImage?: string;
  quantity: number;
  totalPrice: number;
  status: OrderStatus;
  deliveryMethod?: DeliveryMethod;
  customerLatitude?: number;
  customerLongitude?: number;
  deliveryAddress?: string;
  seller: SellerDTO;
  rider?: RiderDTO;
  createdAt: string;
  updatedAt: string;
}

export interface OrderRequest {
  productId: number;
  quantity: number;
  customerLatitude?: number;
  customerLongitude?: number;
  deliveryAddress?: string;
}

// ============================================
// Seller Types
// ============================================

export interface SellerDTO {
  id: number;
  storeName: string;
  storeDescription?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  sellerName: string;
  sellerPhone?: string;
}

export interface SellerProfileUpdate {
  storeName?: string;
  storeDescription?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

// ============================================
// Rider Types
// ============================================

export interface RiderDTO {
  id: number;
  vehicleType?: string;
  vehicleNumber?: string;
  isOnline?: boolean;
  currentLatitude?: number;
  currentLongitude?: number;
  riderName: string;
  riderPhone?: string;
  distance?: number;
}

export interface RiderProfileUpdate {
  vehicleType?: string;
  vehicleNumber?: string;
}

export interface RiderLocationUpdate {
  latitude: number;
  longitude: number;
}

// ============================================
// Delivery Types
// ============================================

export interface DeliveryDTO {
  id: number;
  orderId: number;
  rider?: RiderDTO;
  pickupLatitude?: number;
  pickupLongitude?: number;
  dropLatitude?: number;
  dropLongitude?: number;
  status: DeliveryStatus;
  distance?: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================
// Notification Types
// ============================================

export interface NotificationDTO {
  id: number;
  message: string;
  type: string;
  isRead: boolean;
  relatedOrderId?: number;
  createdAt: string;
}

// ============================================
// Payment Types
// ============================================

export interface PaymentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  status: string;
  publishableKey: string;
}

export interface PaymentIntentRequest {
  orderId: number;
}

export interface PaymentConfirmRequest {
  paymentIntentId: string;
}

// ============================================
// User Profile Types
// ============================================

export interface UserProfileUpdate {
  fullName?: string;
  phone?: string;
  address?: string;
}

// ============================================
// API Response Types
// ============================================

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface UnreadCountResponse {
  count: number;
}

// ============================================
// WebSocket Message Types
// ============================================

export interface WebSocketMessage<T> {
  type: string;
  payload: T;
  timestamp: number;
}

export interface RiderLocationMessage {
  latitude: number;
  longitude: number;
  timestamp: number;
}

// ============================================
// Dashboard Stats Types
// ============================================

export interface SellerStats {
  productsCount: number;
  pendingOrders: number;
  revenue: number;
  totalOrders: number;
}

export interface RiderStats {
  activeDeliveries: number;
  completedDeliveries: number;
  earnings: number;
}

// ============================================
// Location Types
// ============================================

export interface Location {
  latitude: number;
  longitude: number;
  address?: string;
}

// ============================================
// Form Types
// ============================================

export interface ProductFormData {
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  stock: number;
}

export interface OrderFormData {
  productId: number;
  quantity: number;
  deliveryAddress: string;
}

// Status arrays for type safety
export const ORDER_STATUSES = [
  OrderStatus.PENDING,
  OrderStatus.ACCEPTED,
  OrderStatus.SELLER_DELIVERING,
  OrderStatus.RIDER_ASSIGNED,
  OrderStatus.PICKED_UP,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED
] as const;

export const DELIVERY_STATUSES = [
  DeliveryStatus.REQUESTED,
  DeliveryStatus.ACCEPTED,
  DeliveryStatus.AT_SELLER,
  DeliveryStatus.PICKED_UP,
  DeliveryStatus.DELIVERED,
  DeliveryStatus.CANCELLED
] as const;

export const USER_ROLES = [
  UserRole.CUSTOMER,
  UserRole.SELLER,
  UserRole.RIDER
] as const;
