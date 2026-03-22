/**
 * Seller Order Card Component
 * Display and manage orders for sellers
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  XCircle, 
  MapPin, 
  User,
  Navigation
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice, formatDate, calculateDistance } from '@/services/api';
import { OrderStatus, type OrderDTO } from '@/types';

interface SellerOrderCardProps {
  order: OrderDTO;
  onAccept: () => void;
  onDecline: () => void;
  onRequestRider: () => void;
  sellerLocation?: { lat: number; lng: number };
  index?: number;
}

const statusConfig: Record<OrderStatus, { color: string; icon: React.ReactNode; label: string }> = {
  [OrderStatus.PENDING]: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: <Clock className="h-4 w-4" />,
    label: 'Pending',
  },
  [OrderStatus.ACCEPTED]: {
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    icon: <CheckCircle className="h-4 w-4" />,
    label: 'Accepted',
  },
  [OrderStatus.SELLER_DELIVERING]: {
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: <Package className="h-4 w-4" />,
    label: 'Seller Delivering',
  },
  [OrderStatus.RIDER_ASSIGNED]: {
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: <Truck className="h-4 w-4" />,
    label: 'Rider Assigned',
  },
  [OrderStatus.PICKED_UP]: {
    color: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    icon: <Truck className="h-4 w-4" />,
    label: 'Picked Up',
  },
  [OrderStatus.DELIVERED]: {
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: <CheckCircle className="h-4 w-4" />,
    label: 'Delivered',
  },
  [OrderStatus.CANCELLED]: {
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: <XCircle className="h-4 w-4" />,
    label: 'Cancelled',
  },
};

export const SellerOrderCard: React.FC<SellerOrderCardProps> = ({
  order,
  onAccept,
  onDecline,
  onRequestRider,
  sellerLocation,
  index = 0,
}) => {
  const status = statusConfig[order.status];
  const isPending = order.status === OrderStatus.PENDING;
  const isAccepted = order.status === OrderStatus.ACCEPTED;
  
  // Calculate distance if both locations available
  const distance = sellerLocation && order.customerLatitude && order.customerLongitude
    ? calculateDistance(
        sellerLocation.lat,
        sellerLocation.lng,
        order.customerLatitude,
        order.customerLongitude
      )
    : null;
  
  const showRequestRider = isAccepted && order.deliveryMethod === 'RIDER';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card className="overflow-hidden hover:shadow-md transition-shadow border-0 shadow-sm">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Order #{order.id}</p>
              <p className="text-xs text-gray-400">
                {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {distance && (
                <Badge variant="outline" className="text-xs border-gray-200 text-gray-600">
                  <Navigation className="h-3 w-3 mr-1" />
                  {distance.toFixed(1)} km
                </Badge>
              )}
              <Badge 
                variant="outline" 
                className={`flex items-center gap-1 ${status.color}`}
              >
                {status.icon}
                {status.label}
              </Badge>
            </div>
          </div>

          {/* Product Info */}
          <div className="flex gap-4 mb-4">
            <div className="h-20 w-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              {order.productImage ? (
                <img
                  src={order.productImage}
                  alt={order.productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-gray-900 line-clamp-1">{order.productName}</h4>
              <p className="text-sm text-gray-500">
                Qty: {order.quantity}
              </p>
              <p className="text-lg font-semibold text-indigo-600 mt-1">
                {formatPrice(order.totalPrice)}
              </p>
            </div>
          </div>

          {/* Customer Info */}
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <User className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">{order.customerName}</span>
            </div>
            {order.deliveryAddress && (
              <div className="flex items-start gap-2 text-sm text-gray-500">
                <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span className="line-clamp-2">{order.deliveryAddress}</span>
              </div>
            )}
          </div>

          {/* Rider Info */}
          {order.rider && (
            <div className="bg-indigo-50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-indigo-800">Assigned Rider</p>
              <p className="text-sm text-gray-700">{order.rider.riderName}</p>
              {order.rider.vehicleType && (
                <p className="text-xs text-gray-500">
                  {order.rider.vehicleType} • {order.rider.vehicleNumber}
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {isPending && (
              <>
                <Button 
                  size="sm" 
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-sm"
                  onClick={onAccept}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Accept
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
                  onClick={onDecline}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Decline
                </Button>
              </>
            )}
            
            {showRequestRider && (
              <Button 
                size="sm" 
                variant="secondary"
                className="w-full bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-none"
                onClick={onRequestRider}
              >
                <Truck className="h-4 w-4 mr-2" />
                Request Rider {distance ? `(${distance.toFixed(1)} km)` : ''}
              </Button>
            )}
            
            {isAccepted && !showRequestRider && order.deliveryMethod === 'SELLER' && (
              <Button 
                size="sm" 
                variant="outline"
                className="w-full border-gray-200 text-gray-500"
                disabled
              >
                <Package className="h-4 w-4 mr-2" />
                Self Delivery {distance ? `(${distance.toFixed(1)} km)` : ''}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default SellerOrderCard;
