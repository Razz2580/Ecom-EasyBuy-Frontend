/**
 * Seller Dashboard
 * Manage products, view orders, and track revenue
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Store, 
  Package, 
  ShoppingCart, 
  DollarSign, 
  TrendingUp,
  Plus,
  MapPin,
  LogOut,
  User,
  Edit2,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { productAPI, orderAPI, sellerAPI, formatPrice } from '@/services/api';
import { webSocketService } from '@/services/webSocketService';
import { NotificationPanel } from '@/components/common/NotificationPanel';
import { CardSkeleton } from '@/components/common/LoadingSpinner';
import { ProductForm } from '@/components/seller/ProductForm';
import { SellerOrderCard } from '@/components/seller/SellerOrderCard';
import type { Product, OrderDTO, ProductRequest, SellerDTO } from '@/types';

const SellerDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [sellerProfile, setSellerProfile] = useState<SellerDTO | null>(null);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sellerLocation, setSellerLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [activeTab, setActiveTab] = useState('products');

  // Stats
  const [stats, setStats] = useState({
    productsCount: 0,
    pendingOrders: 0,
    revenue: 0,
    totalOrders: 0,
  });

  // Fetch data on mount
  useEffect(() => {
    fetchSellerProfile();
    fetchProducts();
    fetchOrders();
  }, []);

  // Subscribe to WebSocket updates
  useEffect(() => {
    if (user?.userId) {
      const unsubscribe = webSocketService.onOrderUpdate((updatedOrder) => {
        setOrders((prev) =>
          prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o))
        );
        toast.info(`Order #${updatedOrder.id} updated`);
        calculateStats();
      });

      return () => unsubscribe();
    }
  }, [user?.userId]);

  const fetchSellerProfile = async () => {
    try {
      const profile = await sellerAPI.getProfile();
      setSellerProfile(profile);
      if (profile.latitude && profile.longitude) {
        setSellerLocation({ lat: profile.latitude, lng: profile.longitude });
      }
    } catch (error) {
      console.error('Failed to fetch seller profile:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const data = await productAPI.getProductsBySeller(user?.sellerId || 0);
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
      const data = await orderAPI.getSellerOrders();
      setOrders(data);
      calculateStats(data);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const calculateStats = (ordersData: OrderDTO[] = orders) => {
    const deliveredOrders = ordersData.filter((o) => o.status === 'DELIVERED');
    const revenue = deliveredOrders.reduce((sum, o) => sum + o.totalPrice, 0);

    setStats({
      productsCount: products.length,
      pendingOrders: ordersData.filter((o) => o.status === 'PENDING').length,
      revenue,
      totalOrders: ordersData.length,
    });
  };

  // Update stats when products change
  useEffect(() => {
    calculateStats();
  }, [products]);

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsProductFormOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsProductFormOpen(true);
  };

  const handleDeleteProduct = async (productId: number) => {
    if (!confirm('Are you sure you want to delete this product?')) return;

    try {
      await productAPI.deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      toast.success('Product deleted successfully');
    } catch (error) {
      console.error('Failed to delete product:', error);
      toast.error('Failed to delete product');
    }
  };

  const handleProductSubmit = async (data: ProductRequest) => {
    try {
      setIsSubmitting(true);

      if (selectedProduct) {
        // Update existing product
        const updated = await productAPI.updateProduct(selectedProduct.id, data);
        setProducts((prev) =>
          prev.map((p) => (p.id === updated.id ? updated : p))
        );
        toast.success('Product updated successfully');
      } else {
        // Add new product
        const created = await productAPI.addProduct(data);
        setProducts((prev) => [created, ...prev]);
        toast.success('Product added successfully');
      }

      setIsProductFormOpen(false);
    } catch (error) {
      console.error('Failed to save product:', error);
      toast.error('Failed to save product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAcceptOrder = async (orderId: number) => {
    try {
      const updated = await orderAPI.acceptOrder(orderId);
      setOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? updated : o))
      );
      toast.success('Order accepted');
    } catch (error) {
      console.error('Failed to accept order:', error);
      toast.error('Failed to accept order');
    }
  };

  const handleDeclineOrder = async (orderId: number) => {
    try {
      const updated = await orderAPI.declineOrder(orderId);
      setOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? updated : o))
      );
      toast.success('Order declined');
    } catch (error) {
      console.error('Failed to decline order:', error);
      toast.error('Failed to decline order');
    }
  };

  const handleRequestRider = async (orderId: number) => {
    try {
      const updated = await orderAPI.requestRider(orderId);
      setOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? updated : o))
      );
      toast.success('Rider requested successfully');
    } catch (error) {
      console.error('Failed to request rider:', error);
      toast.error('Failed to request rider');
    }
  };

  const handleUpdateLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          await sellerAPI.updateLocation(latitude, longitude);
          setSellerLocation({ lat: latitude, lng: longitude });
          toast.success('Location updated successfully');
        } catch (error) {
          console.error('Failed to update location:', error);
          toast.error('Failed to update location');
        }
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Could not get your location');
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                <Store className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">{sellerProfile?.storeName || 'My Store'}</h1>
                <p className="text-xs text-gray-500">Seller Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <NotificationPanel />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/profile')}
                className="hover:bg-gray-100"
              >
                <User className="h-5 w-5 text-gray-600" />
              </Button>
              <Button variant="ghost" size="icon" onClick={logout} className="hover:bg-gray-100">
                <LogOut className="h-5 w-5 text-gray-600" />
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Products</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.productsCount}</p>
                </div>
                <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.pendingOrders}</p>
                </div>
                <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.revenue)}</p>
                </div>
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
                <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Location Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-orange-100 rounded-lg flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Store Location</p>
                    <p className="text-sm text-gray-500">
                      {sellerLocation 
                        ? `${sellerLocation.lat.toFixed(4)}, ${sellerLocation.lng.toFixed(4)}`
                        : 'Location not set'}
                    </p>
                  </div>
                </div>
                <Button onClick={handleUpdateLocation} variant="outline" className="border-gray-300 hover:bg-gray-50">
                  <MapPin className="h-4 w-4 mr-2" />
                  Update Location
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-100 p-1 rounded-xl">
            <TabsTrigger 
              value="products" 
              className="gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-lg"
            >
              <Package className="h-4 w-4" />
              Products
            </TabsTrigger>
            <TabsTrigger 
              value="orders" 
              className="gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-lg"
            >
              <ShoppingCart className="h-4 w-4" />
              Orders
              {stats.pendingOrders > 0 && (
                <Badge variant="secondary" className="ml-1 bg-indigo-100 text-indigo-600">
                  {stats.pendingOrders}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-900">My Products</h2>
              <Button onClick={handleAddProduct} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md">
                <Plus className="h-4 w-4 mr-2" />
                Add Product
              </Button>
            </div>

            {isLoadingProducts ? (
              <CardSkeleton count={4} />
            ) : products.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700">No products yet</h3>
                <p className="text-gray-500 mb-4">
                  Start adding products to your store
                </p>
                <Button onClick={handleAddProduct} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Product
                </Button>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product, index) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group"
                  >
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow border-0 shadow-sm">
                      <div className="relative h-40 bg-gray-100">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-12 w-12 text-gray-400" />
                          </div>
                        )}

                        {/* Actions Overlay */}
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="secondary"
                            size="icon"
                            className="h-8 w-8 bg-white/80 hover:bg-white"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit2 className="h-4 w-4 text-gray-700" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="icon"
                            className="h-8 w-8 bg-white/80 hover:bg-white"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>

                      <CardContent className="p-4">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">{product.name}</h3>
                        {product.category && (
                          <Badge variant="secondary" className="mt-1 bg-gray-100 text-gray-600">
                            {product.category}
                          </Badge>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-lg font-bold text-indigo-600">
                            {formatPrice(product.price)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Stock: {product.stock}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Incoming Orders</h2>

            {isLoadingOrders ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-40 bg-gray-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700">No orders yet</h3>
                <p className="text-gray-500">
                  Orders will appear here when customers place them
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {orders.map((order, index) => (
                  <SellerOrderCard
                    key={order.id}
                    order={order}
                    onAccept={() => handleAcceptOrder(order.id)}
                    onDecline={() => handleDeclineOrder(order.id)}
                    onRequestRider={() => handleRequestRider(order.id)}
                    sellerLocation={sellerLocation || undefined}
                    index={index}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Product Form Modal */}
      <ProductForm
        product={selectedProduct}
        isOpen={isProductFormOpen}
        onClose={() => setIsProductFormOpen(false)}
        onSubmit={handleProductSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
};

export default SellerDashboard;
