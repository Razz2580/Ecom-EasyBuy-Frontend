/**
 * Order Card Component
 * Displays order information with status tracking
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Package, Truck, CheckCircle, Clock, XCircle, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatPrice, formatDate } from '@/services/api';
import { OrderStatus, type OrderDTO } from '@/types';

interface OrderCardProps {
  order: OrderDTO;
  onTrack?: () => void;
  onPay?: () => void;
  index?: number;
}

// Status configuration
const statusConfig: Record<OrderStatus, { color: string; icon: React.ReactNode; label: string }> = {
  [OrderStatus.PENDING]: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: <Clock className="h-4 w-4" />,
    label: 'Pending',
  },
  [OrderStatus.ACCEPTED]: {
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: <CheckCircle className="h-4 w-4" />,
    label: 'Accepted',
  },
  [OrderStatus.SELLER_DELIVERING]: {
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: <Package className="h-4 w-4" />,
    label: 'Seller Delivering',
  },
  [OrderStatus.RIDER_ASSIGNED]: {
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
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

export const OrderCard: React.FC<OrderCardProps> = ({ 
  order, 
  onTrack, 
  onPay,
  index = 0 
}) => {
  const status = statusConfig[order.status];
  const isPending = order.status === OrderStatus.PENDING;
  const isDelivered = order.status === OrderStatus.DELIVERED;
  const canPay = isPending && onPay;

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
              <p className="text-sm text-muted-foreground">Order #{order.id}</p>
              <p className="text-xs text-muted-foreground">
                {formatDate(order.createdAt)}
              </p>
            </div>
            <Badge 
              variant="outline" 
              className={`flex items-center gap-1 ${status.color}`}
            >
              {status.icon}
              {status.label}
            </Badge>
          </div>

          {/* Product Info */}
          <div className="flex gap-4 mb-4">
            {/* Product Image */}
            <div className="h-20 w-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {order.productImage ? (
                <img
                  src={order.productImage}
                  alt={order.productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium line-clamp-1">{order.productName}</h4>
              <p className="text-sm text-muted-foreground">
                Qty: {order.quantity}
              </p>
              <p className="text-lg font-semibold text-primary mt-1">
                {formatPrice(order.totalPrice)}
              </p>
            </div>
          </div>

          {/* Delivery Info */}
          {order.deliveryAddress && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground mb-4">
              <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span className="line-clamp-2">{order.deliveryAddress}</span>
            </div>
          )}

          {/* Rider Info */}
          {order.rider && (
            <div className="bg-muted/50 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium">Delivery Partner</p>
              <p className="text-sm text-muted-foreground">
                {order.rider.riderName}
              </p>
              {order.rider.vehicleType && (
                <p className="text-xs text-muted-foreground">
                  {order.rider.vehicleType} • {order.rider.vehicleNumber}
                </p>
              )}
            </div>
          )}

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Ordered</span>
              <span>Processing</span>
              <span>Delivered</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ 
                  width: isDelivered ? '100%' : isPending ? '20%' : '60%' 
                }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={`h-full rounded-full ${
                  isDelivered 
                    ? 'bg-green-500' 
                    : isPending 
                      ? 'bg-yellow-500' 
                      : 'bg-blue-500'
                }`}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {canPay && (
              <Button 
                size="sm" 
                className="flex-1"
                onClick={onPay}
              >
                Pay Now
              </Button>
            )}
            {onTrack && !isDelivered && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                onClick={onTrack}
              >
                <Truck className="h-4 w-4 mr-2" />
                Track Order
              </Button>
            )}
            {isDelivered && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1"
                disabled
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Completed
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default OrderCard;
