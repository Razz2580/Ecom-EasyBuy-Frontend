/**
 * Customer Dashboard
 * Browse products, place orders, and track deliveries
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, 
  ShoppingBag, 
  Package, 
  History, 
  LogOut,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { productAPI, orderAPI } from '@/services/api';
import { webSocketService } from '@/services/webSocketService';
import { NotificationPanel } from '@/components/common/NotificationPanel';
import { CardSkeleton } from '@/components/common/LoadingSpinner';
import { ProductCard } from '@/components/customer/ProductCard';
import { OrderCard } from '@/components/customer/OrderCard';
import { ProductDetail } from '@/components/customer/ProductDetail';
import type { Product, OrderDTO, OrderRequest } from '@/types';

const CustomerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [activeTab, setActiveTab] = useState('browse');

  // Get user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          toast.error('Could not get your location. Showing all products.');
        }
      );
    }
  }, []);

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, [userLocation]);

  // Fetch orders
  useEffect(() => {
    fetchOrders();
  }, []);

  // Subscribe to WebSocket updates
  useEffect(() => {
    if (user?.userId) {
      const unsubscribe = webSocketService.onOrderUpdate((updatedOrder) => {
        setOrders((prev) =>
          prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
        );
        toast.info(`Order #${updatedOrder.id} status updated to ${updatedOrder.status}`);
      });

      return () => unsubscribe();
    }
  }, [user?.userId]);

  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      let data: Product[];
      
      if (userLocation) {
        data = await productAPI.getNearbyProducts(userLocation.lat, userLocation.lng, 10);
      } else {
        data = await productAPI.getAllProducts();
      }
      
      setProducts(data);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      toast.error('Failed to load products');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const fetchOrders = async () => {
    try {
      setIsLoadingOrders(true);
      const data = await orderAPI.getMyOrders();
      setOrders(data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      fetchProducts();
      return;
    }

    try {
      setIsLoadingProducts(true);
      const data = await productAPI.searchProducts(searchQuery);
      setProducts(data);
    } catch (error) {
      console.error('Failed to search products:', error);
      toast.error('Search failed');
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsProductDetailOpen(true);
  };

const handlePlaceOrder = async (
  quantity: number,
  deliveryAddress: string,
  latitude?: number,
  longitude?: number,
  deliveryMethod?: string,
  paymentMethod?: string
) => {
  if (!selectedProduct) return;

  try {
    const orderRequest: OrderRequest = {
      productId: selectedProduct.id,
      quantity,
      deliveryAddress,
      customerLatitude: latitude,
      customerLongitude: longitude,
      deliveryMethod,
      paymentMethod,
    };

    const order = await orderAPI.createOrder(orderRequest);
    setOrders((prev) => [order, ...prev]);
    setIsProductDetailOpen(false);

    if (paymentMethod === 'online') {
      toast.success('Order placed successfully!', {
        description: 'Redirecting to payment...',
      });
      navigate(`/payment/${order.id}`);
    } else {
      toast.success('Order placed successfully!', {
        description: 'You will pay upon delivery.',
      });
      // stay on dashboard
    }
  } catch (error: any) {
    const message = error.response?.data?.message || 'Failed to place order';
    toast.error('Order failed', { description: message });
  }
};
   

  const handlePayOrder = (orderId: number) => {
    navigate(`/payment/${orderId}`);
  };

  // Filter orders
  const activeOrders = orders.filter(
    (o) => !['DELIVERED', 'CANCELLED'].includes(o.status)
  );
  const orderHistory = orders.filter(
    (o) => ['DELIVERED', 'CANCELLED'].includes(o.status)
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold hidden sm:block">EasyBuy</span>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-10"
                />
                <Button
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2"
                  onClick={handleSearch}
                >
                  Search
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <NotificationPanel />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/profile')}
              >
                <User className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold">Welcome, {user?.fullName}!</h1>
          <p className="text-muted-foreground">
            {userLocation ? 'Showing products near you' : 'Discover amazing products'}
          </p>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="browse" className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              <span className="hidden sm:inline">Browse</span>
            </TabsTrigger>
            <TabsTrigger value="orders" className="gap-2">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">My Orders</span>
              {activeOrders.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeOrders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
          </TabsList>

          {/* Browse Tab */}
          <TabsContent value="browse">
            {isLoadingProducts ? (
              <CardSkeleton count={6} />
            ) : products.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <ShoppingBag className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No products found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or location
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onClick={() => handleProductClick(product)}
                    index={index}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Orders Tab */}
          <TabsContent value="orders">
            {isLoadingOrders ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-40 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : activeOrders.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No active orders</h3>
                <p className="text-muted-foreground">
                  Your active orders will appear here
                </p>
                <Button 
                  className="mt-4" 
                  onClick={() => setActiveTab('browse')}
                >
                  Start Shopping
                </Button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeOrders.map((order, index) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onPay={() => handlePayOrder(order.id)}
                    index={index}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history">
            {isLoadingOrders ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-40 bg-muted rounded-lg animate-pulse" />
                ))}
              </div>
            ) : orderHistory.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <History className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No order history</h3>
                <p className="text-muted-foreground">
                  Your completed orders will appear here
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orderHistory.map((order, index) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    index={index}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Product Detail Modal */}
      <ProductDetail
        product={selectedProduct}
        isOpen={isProductDetailOpen}
        onClose={() => setIsProductDetailOpen(false)}
        onOrder={handlePlaceOrder}
        userAddress={user?.address}
      />
    </div>
  );
};

export default CustomerDashboard;
