/**
 * EasyBuy API Service
 * Axios instance with interceptors for authentication and error handling
 */

import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Product,
  ProductRequest,
  OrderDTO,
  OrderRequest,
  SellerDTO,
  SellerProfileUpdate,
  RiderDTO,
  RiderProfileUpdate,
  RiderLocationUpdate,
  DeliveryDTO,
  NotificationDTO,
  PaymentResponse,
  PaymentIntentRequest,
  PaymentConfirmRequest,
  UserProfileUpdate,
  UnreadCountResponse
} from '@/types';

// Base API URL from environment variables
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://easybuy-backend-production.up.railway.app';
const API_PREFIX = '/api';

// Create Axios instance
const api: AxiosInstance = axios.create({
  baseURL: `${API_BASE_URL}${API_PREFIX}`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// ============================================
// Request Interceptor - Add JWT Token
// ============================================
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============================================
// Response Interceptor - Handle 401 Errors
// ============================================
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirect to login page
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ============================================
// Token Management
// ============================================
export const getToken = (): string | null => {
  return localStorage.getItem('token');
};

export const setToken = (token: string): void => {
  localStorage.setItem('token', token);
};

export const removeToken = (): void => {
  localStorage.removeItem('token');
};

// ============================================
// Authentication API
// ============================================
export const authAPI = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>('/auth/register', data);
    return response.data;
  },
};

// ============================================
// User API
// ============================================
export const userAPI = {
  getProfile: async (): Promise<AuthResponse> => {
    const response = await api.get<AuthResponse>('/user/profile');
    return response.data;
  },

  updateProfile: async (data: UserProfileUpdate): Promise<AuthResponse> => {
    const response = await api.put<AuthResponse>('/user/profile', data);
    return response.data;
  },
};

// ============================================
// Products API
// ============================================
export const productAPI = {
  getAllProducts: async (): Promise<Product[]> => {
    const response = await api.get<Product[]>('/products');
    return response.data;
  },

  getNearbyProducts: async (
    lat: number,
    lng: number,
    radius: number = 10,
    category?: string
  ): Promise<Product[]> => {
    const params = new URLSearchParams({
      lat: lat.toString(),
      lng: lng.toString(),
      radius: radius.toString(),
    });
    if (category) params.append('category', category);
    
    const response = await api.get<Product[]>(`/products/nearby?${params.toString()}`);
    return response.data;
  },

  searchProducts: async (keyword: string): Promise<Product[]> => {
    const response = await api.get<Product[]>(`/products/search?keyword=${encodeURIComponent(keyword)}`);
    return response.data;
  },

  getProductsByCategory: async (category: string): Promise<Product[]> => {
    const response = await api.get<Product[]>(`/products/category/${encodeURIComponent(category)}`);
    return response.data;
  },

  getProductsBySeller: async (sellerId: number): Promise<Product[]> => {
    const response = await api.get<Product[]>(`/products/seller/${sellerId}`);
    return response.data;
  },

  addProduct: async (data: ProductRequest): Promise<Product> => {
    const response = await api.post<Product>('/products/addProduct', data);
    return response.data;
  },

  updateProduct: async (id: number, data: ProductRequest): Promise<Product> => {
    const response = await api.put<Product>(`/products/${id}`, data);
    return response.data;
  },

  deleteProduct: async (id: number): Promise<void> => {
    await api.delete(`/products/${id}`);
  },
};

// ============================================
// Orders API
// ============================================
export const orderAPI = {
  createOrder: async (data: OrderRequest): Promise<OrderDTO> => {
    const response = await api.post<OrderDTO>('/orders', data);
    return response.data;
  },

  getMyOrders: async (): Promise<OrderDTO[]> => {
    const response = await api.get<OrderDTO[]>('/orders/my-orders');
    return response.data;
  },

  getSellerOrders: async (): Promise<OrderDTO[]> => {
    const response = await api.get<OrderDTO[]>('/orders/seller-orders');
    return response.data;
  },

  acceptOrder: async (orderId: number): Promise<OrderDTO> => {
    const response = await api.put<OrderDTO>(`/orders/${orderId}/accept`);
    return response.data;
  },

  declineOrder: async (orderId: number): Promise<OrderDTO> => {
    const response = await api.put<OrderDTO>(`/orders/${orderId}/decline`);
    return response.data;
  },

  requestRider: async (orderId: number): Promise<OrderDTO> => {
    const response = await api.post<OrderDTO>(`/orders/${orderId}/request-rider`);
    return response.data;
  },
};

// ============================================
// Seller API
// ============================================
export const sellerAPI = {
  getProfile: async (): Promise<SellerDTO> => {
    const response = await api.get<SellerDTO>('/seller/profile');
    return response.data;
  },

  updateProfile: async (data: SellerProfileUpdate): Promise<SellerDTO> => {
    const response = await api.put<SellerDTO>('/seller/profile', data);
    return response.data;
  },

  updateLocation: async (latitude: number, longitude: number): Promise<SellerDTO> => {
    const response = await api.put<SellerDTO>('/seller/location', { latitude, longitude });
    return response.data;
  },

  updateBankDetails: async (data: { accountHolder: string; accountNumber: string; ifsc: string; upiId?: string }): Promise<void> => {
    const response = await api.put('/seller/bank-details', data);
    return response.data;
  },
};

// ============================================
// Rider API
// ============================================
export const riderAPI = {
  getProfile: async (): Promise<RiderDTO> => {
    const response = await api.get<RiderDTO>('/rider/profile');
    return response.data;
  },

  updateProfile: async (data: RiderProfileUpdate): Promise<RiderDTO> => {
    const response = await api.put<RiderDTO>('/rider/profile', data);
    return response.data;
  },

  updateOnlineStatus: async (isOnline: boolean): Promise<RiderDTO> => {
    const response = await api.put<RiderDTO>(`/rider/online-status?isOnline=${isOnline}`);
    return response.data;
  },

  updateLocation: async (data: RiderLocationUpdate): Promise<RiderDTO> => {
    const response = await api.put<RiderDTO>('/rider/location', data);
    return response.data;
  },

  getAvailableDeliveries: async (lat: number, lng: number, radius: number = 10): Promise<DeliveryDTO[]> => {
    const response = await api.get<DeliveryDTO[]>(
      `/rider/available-deliveries?lat=${lat}&lng=${lng}&radius=${radius}`
    );
    return response.data;
  },

  getMyDeliveries: async (): Promise<DeliveryDTO[]> => {
    const response = await api.get<DeliveryDTO[]>('/rider/my-deliveries');
    return response.data;
  },

  acceptDelivery: async (deliveryId: number): Promise<DeliveryDTO> => {
    const response = await api.post<DeliveryDTO>(`/rider/deliveries/${deliveryId}/accept`);
    return response.data;
  },

  updateDeliveryStatus: async (deliveryId: number, status: string): Promise<DeliveryDTO> => {
    const response = await api.put<DeliveryDTO>(`/rider/deliveries/${deliveryId}/status?status=${status}`);
    return response.data;
  },
};

// ============================================
// Deliveries API
// ============================================
export const deliveryAPI = {
  getNearbyDeliveries: async (lat: number, lng: number, radius: number = 10): Promise<DeliveryDTO[]> => {
    const response = await api.get<DeliveryDTO[]>(
      `/deliveries/nearby?lat=${lat}&lng=${lng}&radius=${radius}`
    );
    return response.data;
  },
};

// ============================================
// Payments API
// ============================================
export const paymentAPI = {
  createPaymentIntent: async (data: PaymentIntentRequest): Promise<PaymentResponse> => {
    const response = await api.post<PaymentResponse>('/payments/create-intent', data);
    return response.data;
  },

  confirmPayment: async (data: PaymentConfirmRequest): Promise<void> => {
    await api.post('/payments/confirm', data);
  },

  getPaymentByOrderId: async (orderId: number): Promise<PaymentResponse> => {
    const response = await api.get<PaymentResponse>(`/payments/order/${orderId}`);
    return response.data;
  },
};

// ============================================
// Notifications API
// ============================================
export const notificationAPI = {
  getAllNotifications: async (): Promise<NotificationDTO[]> => {
    const response = await api.get<NotificationDTO[]>('/notifications');
    return response.data;
  },

  getUnreadNotifications: async (): Promise<NotificationDTO[]> => {
    const response = await api.get<NotificationDTO[]>('/notifications/unread');
    return response.data;
  },

  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const response = await api.get<UnreadCountResponse>('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (notificationId: number): Promise<NotificationDTO> => {
    const response = await api.put<NotificationDTO>(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async (): Promise<void> => {
    await api.put('/notifications/read-all');
  },
};

// ============================================
// Utility Functions
// ============================================

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

/**
 * Format price with currency symbol
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(price);
};

/**
 * Format date to readable string
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Format relative time (e.g., "2 hours ago")
 */
export const formatRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  return formatDate(dateString);
};

export default api;
