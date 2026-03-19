/**
 * EasyBuy WebSocket Service
 * STOMP over SockJS for real-time communication
 */

import { Client, type IMessage, type StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getToken } from './api';
import type { OrderDTO, NotificationDTO, DeliveryDTO, RiderLocationMessage } from '@/types';

// WebSocket URL
const WS_URL = (import.meta.env.VITE_API_URL || 'https://easybuy-backend-production.up.railway.app').replace(/^http/, 'ws') + '/ws';

// Callback types
type OrderCallback = (order: OrderDTO) => void;
type NotificationCallback = (notification: NotificationDTO) => void;
type DeliveryCallback = (delivery: DeliveryDTO) => void;
type LocationCallback = (location: RiderLocationMessage) => void;
type ConnectionCallback = (connected: boolean) => void;

class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private orderCallbacks: Set<OrderCallback> = new Set();
  private notificationCallbacks: Set<NotificationCallback> = new Set();
  private deliveryCallbacks: Set<DeliveryCallback> = new Set();
  private locationCallbacks: Set<LocationCallback> = new Set();
  private connectionCallbacks: Set<ConnectionCallback> = new Set();
  private userId: number | null = null;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectDelay: number = 3000;
  private locationInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Connect to WebSocket server
   */
  connect(userId: number): void {
    this.userId = userId;
    const token = getToken();
    
    if (!token) {
      console.error('WebSocket: No authentication token found');
      return;
    }

    // Disconnect existing connection if any
    this.disconnect();

    this.client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      debug: (str) => {
        if (import.meta.env.DEV) {
          console.log('STOMP: ' + str);
        }
      },
      reconnectDelay: this.reconnectDelay,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = () => {
      console.log('WebSocket connected');
      this.reconnectAttempts = 0;
      this.notifyConnectionStatus(true);
      this.subscribeToUserQueues();
    };

    this.client.onDisconnect = () => {
      console.log('WebSocket disconnected');
      this.notifyConnectionStatus(false);
    };

    this.client.onStompError = (frame) => {
      console.error('WebSocket STOMP error:', frame.headers.message);
      this.handleReconnect();
    };

    this.client.onWebSocketError = (event) => {
      console.error('WebSocket error:', event);
      this.handleReconnect();
    };

    this.client.activate();
  }

  /**
   * Handle reconnection with exponential backoff
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
      console.log(`WebSocket: Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => {
        if (this.userId) {
          this.connect(this.userId);
        }
      }, delay);
    } else {
      console.error('WebSocket: Max reconnection attempts reached');
    }
  }

  /**
   * Subscribe to user-specific queues
   */
  private subscribeToUserQueues(): void {
    if (!this.client || !this.client.connected || !this.userId) return;

    // Subscribe to order updates
    this.subscribe(`/user/${this.userId}/queue/orders`, (message: IMessage) => {
      try {
        const order: OrderDTO = JSON.parse(message.body);
        this.notifyOrderUpdate(order);
      } catch (error) {
        console.error('Error parsing order message:', error);
      }
    });

    // Subscribe to notifications
    this.subscribe(`/user/${this.userId}/queue/notifications`, (message: IMessage) => {
      try {
        const notification: NotificationDTO = JSON.parse(message.body);
        this.notifyNotificationUpdate(notification);
      } catch (error) {
        console.error('Error parsing notification message:', error);
      }
    });

    // Subscribe to delivery requests (for riders)
    this.subscribe(`/user/${this.userId}/queue/delivery-requests`, (message: IMessage) => {
      try {
        const delivery: DeliveryDTO = JSON.parse(message.body);
        this.notifyDeliveryUpdate(delivery);
      } catch (error) {
        console.error('Error parsing delivery message:', error);
      }
    });

    // Subscribe to broadcast delivery requests (for riders)
    this.subscribe('/topic/delivery-requests', (message: IMessage) => {
      try {
        const delivery: DeliveryDTO = JSON.parse(message.body);
        this.notifyDeliveryUpdate(delivery);
      } catch (error) {
        console.error('Error parsing broadcast delivery message:', error);
      }
    });
  }

  /**
   * Subscribe to a destination
   */
  private subscribe(destination: string, callback: (message: IMessage) => void): void {
    if (!this.client || !this.client.connected) return;

    const subscription = this.client.subscribe(destination, callback);
    this.subscriptions.set(destination, subscription);
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    // Clear location update interval
    if (this.locationInterval) {
      clearInterval(this.locationInterval);
      this.locationInterval = null;
    }

    // Unsubscribe all
    this.subscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.subscriptions.clear();

    // Deactivate client
    if (this.client) {
      this.client.deactivate();
      this.client = null;
    }

    this.userId = null;
    this.reconnectAttempts = 0;
  }

  /**
   * Send rider location update
   */
  sendRiderLocation(latitude: number, longitude: number): void {
    if (!this.client || !this.client.connected) return;

    const message: RiderLocationMessage = {
      latitude,
      longitude,
      timestamp: Date.now(),
    };

    this.client.publish({
      destination: '/app/rider/location',
      body: JSON.stringify(message),
    });
  }

  /**
   * Start automatic location updates for rider
   */
  startAutomaticLocationUpdates(getLocation: () => Promise<{ latitude: number; longitude: number }>): void {
    // Send initial location
    this.sendLocationUpdate(getLocation);

    // Set up interval for updates every 30 seconds
    this.locationInterval = setInterval(() => {
      this.sendLocationUpdate(getLocation);
    }, 30000);
  }

  /**
   * Stop automatic location updates
   */
  stopAutomaticLocationUpdates(): void {
    if (this.locationInterval) {
      clearInterval(this.locationInterval);
      this.locationInterval = null;
    }
  }

  /**
   * Helper to send location update
   */
  private async sendLocationUpdate(
    getLocation: () => Promise<{ latitude: number; longitude: number }>
  ): Promise<void> {
    try {
      const location = await getLocation();
      this.sendRiderLocation(location.latitude, location.longitude);
    } catch (error) {
      console.error('Error getting location for WebSocket update:', error);
    }
  }

  // ============================================
  // Callback Registration Methods
  // ============================================

  /**
   * Register callback for order updates
   */
  onOrderUpdate(callback: OrderCallback): () => void {
    this.orderCallbacks.add(callback);
    return () => this.orderCallbacks.delete(callback);
  }

  /**
   * Register callback for notification updates
   */
  onNotificationUpdate(callback: NotificationCallback): () => void {
    this.notificationCallbacks.add(callback);
    return () => this.notificationCallbacks.delete(callback);
  }

  /**
   * Register callback for delivery updates
   */
  onDeliveryUpdate(callback: DeliveryCallback): () => void {
    this.deliveryCallbacks.add(callback);
    return () => this.deliveryCallbacks.delete(callback);
  }

  /**
   * Register callback for location updates
   */
  onLocationUpdate(callback: LocationCallback): () => void {
    this.locationCallbacks.add(callback);
    return () => this.locationCallbacks.delete(callback);
  }

  /**
   * Register callback for connection status changes
   */
  onConnectionStatusChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.add(callback);
    return () => this.connectionCallbacks.delete(callback);
  }

  // ============================================
  // Notification Methods
  // ============================================

  private notifyOrderUpdate(order: OrderDTO): void {
    this.orderCallbacks.forEach((callback) => callback(order));
  }

  private notifyNotificationUpdate(notification: NotificationDTO): void {
    this.notificationCallbacks.forEach((callback) => callback(notification));
  }

  private notifyDeliveryUpdate(delivery: DeliveryDTO): void {
    this.deliveryCallbacks.forEach((callback) => callback(delivery));
  }



  private notifyConnectionStatus(connected: boolean): void {
    this.connectionCallbacks.forEach((callback) => callback(connected));
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.client?.connected ?? false;
  }

  /**
   * Get current user ID
   */
  getUserId(): number | null {
    return this.userId;
  }
}

// Export singleton instance
export const webSocketService = new WebSocketService();

// Custom hook for using WebSocket
export const useWebSocket = () => {
  return webSocketService;
};

export default webSocketService;
