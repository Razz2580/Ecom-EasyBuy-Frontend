import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus, MapPin, Store, Package, ShoppingCart } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { formatPrice } from '@/services/api';
import type { Product } from '@/types';

interface ProductDetailProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onOrder: (quantity: number, deliveryAddress: string, latitude?: number, longitude?: number, deliveryMethod?: string, paymentMethod?: string) => void;
  userAddress?: string;
}

export const ProductDetail: React.FC<ProductDetailProps> = ({
  product,
  isOpen,
  onClose,
  onOrder,
  userAddress = '',
}) => {
  const [quantity, setQuantity] = useState(1);
  const [deliveryAddress, setDeliveryAddress] = useState(userAddress);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [deliveryMethod, setDeliveryMethod] = useState<'rider' | 'self'>('rider');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');

  if (!product) return null;

  const totalPrice = product.price * quantity;

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  const handleGetLocation = () => {
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setIsGettingLocation(false);
      }
    );
  };

  const handlePlaceOrder = () => {
    onOrder(
      quantity,
      deliveryAddress,
      location?.lat,
      location?.lng,
      deliveryMethod,
      paymentMethod
    );
    // Reset state
    setQuantity(1);
    setDeliveryAddress(userAddress);
    setLocation(null);
    setDeliveryMethod('rider');
    setPaymentMethod('online');
  };

  const canOrder = quantity > 0 && quantity <= product.stock && deliveryAddress.trim().length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Product Details</DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Product Image */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative aspect-square rounded-lg overflow-hidden bg-muted"
          >
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Package className="h-24 w-24 text-muted-foreground" />
              </div>
            )}
            {product.category && (
              <Badge className="absolute top-2 left-2">{product.category}</Badge>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div>
              <h2 className="text-2xl font-bold">{product.name}</h2>
              <div className="flex items-center gap-2 mt-2 text-muted-foreground">
                <Store className="h-4 w-4" />
                <span>{product.storeName}</span>
              </div>
            </div>

            <p className="text-3xl font-bold text-primary">{formatPrice(product.price)}</p>
            {product.description && <p className="text-muted-foreground">{product.description}</p>}

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span>{product.stock} in stock</span>
              </div>
              {product.distance != null && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{product.distance.toFixed(1)} km away</span>
                </div>
              )}
            </div>

            <Separator />

            {/* Quantity Selector */}
            <div className="space-y-2">
              <Label>Quantity</Label>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="icon" onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                <Button variant="outline" size="icon" onClick={() => handleQuantityChange(1)} disabled={quantity >= product.stock}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Delivery Method */}
            <div className="space-y-2">
              <Label>Delivery Method</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="rider"
                    name="deliveryMethod"
                    value="rider"
                    checked={deliveryMethod === 'rider'}
                    onChange={() => setDeliveryMethod('rider')}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="rider">Rider Delivery</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="self"
                    name="deliveryMethod"
                    value="self"
                    checked={deliveryMethod === 'self'}
                    onChange={() => setDeliveryMethod('self')}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="self">Self Pickup</Label>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <div className="flex gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="online"
                    name="paymentMethod"
                    value="online"
                    checked={paymentMethod === 'online'}
                    onChange={() => setPaymentMethod('online')}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="online">Pay Online Now</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="cod"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="h-4 w-4"
                  />
                  <Label htmlFor="cod">Cash on Delivery</Label>
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="space-y-2">
              <Label htmlFor="deliveryAddress">Delivery Address</Label>
              <textarea
                id="deliveryAddress"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="Enter your delivery address"
                className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGetLocation}
                disabled={isGettingLocation}
                className="w-full"
              >
                <MapPin className="h-4 w-4 mr-2" />
                {isGettingLocation ? 'Getting Location...' : 'Use Current Location'}
              </Button>
              {location && (
                <p className="text-xs text-green-600">
                  Location captured: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </p>
              )}
            </div>

            {/* Total and Order Button */}
            <div className="pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total</span>
                <span className="text-2xl font-bold">{formatPrice(totalPrice)}</span>
              </div>
              <Button size="lg" className="w-full" onClick={handlePlaceOrder} disabled={!canOrder}>
                <ShoppingCart className="h-5 w-5 mr-2" />
                Place Order
              </Button>
            </div>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDetail;
