/**
 * Delivery Card Component
 * Display delivery information for riders
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  MapPin, 
  Navigation, 
  Package, 
  User,
  CheckCircle,
  Truck,
  Store,
  Clock
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/services/api';
import { DeliveryStatus, type DeliveryDTO, type OrderDTO } from '@/types';

interface DeliveryCardProps {
  delivery: DeliveryDTO;
  order?: OrderDTO;
  onAccept?: () => void;
  onUpdateStatus?: (status: DeliveryStatus) => void;
  riderLocation?: { lat: number; lng: number };
  index?: number;
  isAvailable?: boolean;
}

const statusConfig: Record<DeliveryStatus, { color: string; icon: React.ReactNode; label: string }> = {
  [DeliveryStatus.REQUESTED]: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: <Clock className="h-4 w-4" />,
    label: 'Available',
  },
  [DeliveryStatus.ACCEPTED]: {
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: <CheckCircle className="h-4 w-4" />,
    label: 'Accepted',
  },
  [DeliveryStatus.AT_SELLER]: {
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: <Store className="h-4 w-4" />,
    label: 'At Seller',
  },
  [DeliveryStatus.PICKED_UP]: {
    color: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    icon: <Package className="h-4 w-4" />,
    label: 'Picked Up',
  },
  [DeliveryStatus.DELIVERED]: {
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: <CheckCircle className="h-4 w-4" />,
    label: 'Delivered',
  },
  [DeliveryStatus.CANCELLED]: {
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: <Clock className="h-4 w-4" />,
    label: 'Cancelled',
  },
};

export const DeliveryCard: React.FC<DeliveryCardProps> = ({
  delivery,
  order,
  onAccept,
  onUpdateStatus,
  riderLocation,
  index = 0,
  isAvailable = false,
}) => {
  const status = statusConfig[delivery.status];
  const isRequested = delivery.status === DeliveryStatus.REQUESTED;
  const isAccepted = delivery.status === DeliveryStatus.ACCEPTED;
  const isAtSeller = delivery.status === DeliveryStatus.AT_SELLER;
  const isPickedUp = delivery.status === DeliveryStatus.PICKED_UP;

  // Calculate distance to pickup if rider location available
  const distanceToPickup = riderLocation && delivery.pickupLatitude && delivery.pickupLongitude
    ? Math.sqrt(
        Math.pow(delivery.pickupLatitude - riderLocation.lat, 2) +
        Math.pow(delivery.pickupLongitude - riderLocation.lng, 2)
      ) * 111 // Rough conversion to km
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card className="overflow-hidden hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground">Delivery #{delivery.id}</p>
              <p className="text-xs text-muted-foreground">
                Order #{delivery.orderId}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {distanceToPickup && (
                <Badge variant="outline" className="text-xs">
                  <Navigation className="h-3 w-3 mr-1" />
                  {distanceToPickup.toFixed(1)} km
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

          {/* Order Info */}
          {order && (
            <div className="flex gap-4 mb-4">
              <div className="h-16 w-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                {order.productImage ? (
                  <img
                    src={order.productImage}
                    alt={order.productName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-medium line-clamp-1">{order.productName}</h4>
                <p className="text-sm text-muted-foreground">
                  Qty: {order.quantity}
                </p>
                <p className="text-sm font-semibold text-primary">
                  {formatPrice(order.totalPrice)}
                </p>
              </div>
            </div>
          )}

          {/* Pickup Location */}
          <div className="bg-muted/50 rounded-lg p-3 mb-3">
            <div className="flex items-center gap-2 mb-1">
              <Store className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Pickup</span>
            </div>
            {order?.seller && (
              <div className="text-sm">
                <p>{order.seller.storeName}</p>
                <p className="text-muted-foreground text-xs">{order.seller.address}</p>
              </div>
            )}
            {delivery.pickupLatitude && (
              <p className="text-xs text-muted-foreground mt-1">
                {delivery.pickupLatitude.toFixed(4)}, {delivery.pickupLongitude?.toFixed(4)}
              </p>
            )}
          </div>

          {/* Dropoff Location */}
          <div className="bg-primary/5 rounded-lg p-3 mb-4">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Dropoff</span>
            </div>
            {order?.customerName && (
              <div className="flex items-center gap-2 text-sm">
                <User className="h-3 w-3" />
                <span>{order.customerName}</span>
              </div>
            )}
            {order?.deliveryAddress && (
              <p className="text-sm text-muted-foreground mt-1">
                {order.deliveryAddress}
              </p>
            )}
            {delivery.dropLatitude && (
              <p className="text-xs text-muted-foreground mt-1">
                {delivery.dropLatitude.toFixed(4)}, {delivery.dropLongitude?.toFixed(4)}
              </p>
            )}
          </div>

          {/* Earnings */}
          {order && (
            <div className="flex items-center justify-between mb-4 p-2 bg-green-50 rounded-lg">
              <span className="text-sm text-green-700">Your Earning (10%)</span>
              <span className="font-semibold text-green-700">
                {formatPrice(order.totalPrice * 0.1)}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {isAvailable && isRequested && onAccept && (
              <Button 
                size="sm" 
                className="flex-1"
                onClick={onAccept}
              >
                <Truck className="h-4 w-4 mr-2" />
                Accept Delivery
              </Button>
            )}
            
            {isAccepted && onUpdateStatus && (
              <Button 
                size="sm" 
                variant="secondary"
                className="flex-1"
                onClick={() => onUpdateStatus(DeliveryStatus.AT_SELLER)}
              >
                <Store className="h-4 w-4 mr-2" />
                At Seller
              </Button>
            )}
            
            {isAtSeller && onUpdateStatus && (
              <Button 
                size="sm" 
                variant="secondary"
                className="flex-1"
                onClick={() => onUpdateStatus(DeliveryStatus.PICKED_UP)}
              >
                <Package className="h-4 w-4 mr-2" />
                Picked Up
              </Button>
            )}
            
            {isPickedUp && onUpdateStatus && (
              <Button 
                size="sm" 
                className="flex-1"
                onClick={() => onUpdateStatus(DeliveryStatus.DELIVERED)}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Mark Delivered
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default DeliveryCard;
