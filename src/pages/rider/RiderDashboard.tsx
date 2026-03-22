/**
 * Rider Dashboard
 * Manage deliveries, track earnings, and update location
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Truck, 
  MapPin, 
  DollarSign, 
  CheckCircle, 
  LogOut,
  User,
  Power,
  Navigation,
  Package
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { riderAPI, orderAPI, formatPrice } from '@/services/api';
import { webSocketService } from '@/services/webSocketService';
import { NotificationPanel } from '@/components/common/NotificationPanel';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { DeliveryCard } from '@/components/rider/DeliveryCard';
import { DeliveryStatus, type DeliveryDTO, type OrderDTO, type RiderDTO } from '@/types';

const RiderDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // State
  const [riderProfile, setRiderProfile] = useState<RiderDTO | null>(null);
  const [availableDeliveries, setAvailableDeliveries] = useState<DeliveryDTO[]>([]);
  const [myDeliveries, setMyDeliveries] = useState<DeliveryDTO[]>([]);
  const [orders, setOrders] = useState<Record<number, OrderDTO>>({});
  const [isOnline, setIsOnline] = useState(false);
  const [riderLocation, setRiderLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');
  const [stats, setStats] = useState({
    activeDeliveries: 0,
    completedDeliveries: 0,
    earnings: 0,
  });

  // Fetch rider profile
  const fetchRiderProfile = async () => {
    try {
      const profile = await riderAPI.getProfile();
      setRiderProfile(profile);
      setIsOnline(profile.isOnline || false);
      if (profile.currentLatitude && profile.currentLongitude) {
        setRiderLocation({
          lat: profile.currentLatitude,
          lng: profile.currentLongitude,
        });
      }
    } catch (error) {
      console.error('Failed to fetch rider profile:', error);
    }
  };

  // Fetch available deliveries
  const fetchAvailableDeliveries = async () => {
    if (!riderLocation) return;
    try {
      const data = await riderAPI.getAvailableDeliveries(
        riderLocation.lat,
        riderLocation.lng,
        10
      );
      setAvailableDeliveries(data);
    } catch (error) {
      console.error('Failed to fetch available deliveries:', error);
    }
  };

  // Fetch my deliveries
  const fetchMyDeliveries = async () => {
    try {
      const data = await riderAPI.getMyDeliveries();
      setMyDeliveries(data);
      
      const orderIds = data.map((d) => d.orderId);
      const uniqueOrderIds = [...new Set(orderIds)];
      
      for (const orderId of uniqueOrderIds) {
        if (!orders[orderId]) {
          try {
            const order = await orderAPI.getMyOrders().then(
              (orders) => orders.find((o) => o.id === orderId)
            );
            if (order) {
              setOrders((prev) => ({ ...prev, [orderId]: order }));
            }
          } catch (error) {
            console.error(`Failed to fetch order ${orderId}:`, error);
          }
        }
      }
      calculateStats(data);
    } catch (error) {
      console.error('Failed to fetch my deliveries:', error);
    }
  };

  // Calculate stats
  const calculateStats = (deliveries: DeliveryDTO[] = myDeliveries) => {
    const active = deliveries.filter(
      (d) => !['DELIVERED', 'CANCELLED'].includes(d.status)
    );
    const completed = deliveries.filter((d) => d.status === 'DELIVERED');
    let earnings = 0;
    completed.forEach((d) => {
      const order = orders[d.orderId];
      if (order) {
        earnings += order.totalPrice * 0.1;
      }
    });
    setStats({
      activeDeliveries: active.length,
      completedDeliveries: completed.length,
      earnings,
    });
  };

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await fetchRiderProfile();
      setIsLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (riderLocation) {
      fetchAvailableDeliveries();
      fetchMyDeliveries();
    }
  }, [riderLocation]);

  useEffect(() => {
    if (user?.userId) {
      const unsubscribe = webSocketService.onDeliveryUpdate((delivery) => {
        setMyDeliveries((prev) => {
          const exists = prev.find((d) => d.id === delivery.id);
          if (exists) {
            return prev.map((d) => (d.id === delivery.id ? delivery : d));
          }
          return [delivery, ...prev];
        });
        setAvailableDeliveries((prev) =>
          prev.filter((d) => d.id !== delivery.id)
        );
        toast.info(`New delivery request #${delivery.id}`);
      });
      return () => unsubscribe();
    }
  }, [user?.userId]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isOnline && riderLocation) {
      interval = setInterval(() => {
        updateLocation();
      }, 30000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOnline, riderLocation]);

  const updateLocation = async () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          await riderAPI.updateLocation({ latitude, longitude });
          setRiderLocation({ lat: latitude, lng: longitude });
          webSocketService.sendRiderLocation(latitude, longitude);
        } catch (error) {
          console.error('Failed to update location:', error);
        }
      },
      (error) => {
        console.error('Error getting location:', error);
      }
    );
  };

  const handleManualLocationUpdate = async () => {
    toast.info('Updating location...');
    await updateLocation();
    toast.success('Location updated');
  };

  const handleToggleOnline = async () => {
    try {
      const newStatus = !isOnline;
      await riderAPI.updateOnlineStatus(newStatus);
      setIsOnline(newStatus);
      if (newStatus) {
        toast.success('You are now online');
        await updateLocation();
      } else {
        toast.info('You are now offline');
      }
    } catch (error) {
      console.error('Failed to toggle online status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleAcceptDelivery = async (deliveryId: number) => {
    try {
      const updated = await riderAPI.acceptDelivery(deliveryId);
      setMyDeliveries((prev) => [updated, ...prev]);
      setAvailableDeliveries((prev) =>
        prev.filter((d) => d.id !== deliveryId)
      );
      toast.success('Delivery accepted');
    } catch (error) {
      console.error('Failed to accept delivery:', error);
      toast.error('Failed to accept delivery');
    }
  };

  const handleUpdateDeliveryStatus = async (
    deliveryId: number,
    status: DeliveryStatus
  ) => {
    try {
      const updated = await riderAPI.updateDeliveryStatus(deliveryId, status);
      setMyDeliveries((prev) =>
        prev.map((d) => (d.id === updated.id ? updated : d))
      );
      toast.success(`Status updated to ${status}`);
    } catch (error) {
      console.error('Failed to update delivery status:', error);
      toast.error('Failed to update status');
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Loading..." />;
  }

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
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-gray-900">{riderProfile?.riderName || 'Rider'}</h1>
                <p className="text-xs text-gray-500">Delivery Partner</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Online Toggle */}
              <div className="flex items-center gap-2 mr-4">
                <span className={`text-sm ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
                <Switch
                  checked={isOnline}
                  onCheckedChange={handleToggleOnline}
                />
              </div>
              
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
          className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6"
        >
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Active</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.activeDeliveries}</p>
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
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.completedDeliveries}</p>
                </div>
                <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2 md:col-span-1 border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Earnings</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPrice(stats.earnings)}</p>
                </div>
                <div className="h-10 w-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-5 w-5 text-yellow-600" />
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
                    <p className="font-medium text-gray-700">Current Location</p>
                    <p className="text-sm text-gray-500">
                      {riderLocation 
                        ? `${riderLocation.lat.toFixed(4)}, ${riderLocation.lng.toFixed(4)}`
                        : 'Location not available'}
                    </p>
                  </div>
                </div>
                <Button onClick={handleManualLocationUpdate} variant="outline" className="border-gray-300 hover:bg-gray-50">
                  <Navigation className="h-4 w-4 mr-2" />
                  Update
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Vehicle Info */}
        {riderProfile?.vehicleType && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6"
          >
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Truck className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-700">Vehicle</p>
                    <p className="text-sm text-gray-500">
                      {riderProfile.vehicleType} • {riderProfile.vehicleNumber}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6 bg-gray-100 p-1 rounded-xl">
            <TabsTrigger 
              value="available" 
              className="gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-lg"
            >
              <Navigation className="h-4 w-4" />
              Available
              {availableDeliveries.length > 0 && (
                <Badge variant="secondary" className="ml-1 bg-indigo-100 text-indigo-600">
                  {availableDeliveries.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="active" 
              className="gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-lg"
            >
              <Package className="h-4 w-4" />
              My Deliveries
              {stats.activeDeliveries > 0 && (
                <Badge variant="secondary" className="ml-1 bg-indigo-100 text-indigo-600">
                  {stats.activeDeliveries}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="completed" 
              className="gap-2 data-[state=active]:bg-white data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm rounded-lg"
            >
              <CheckCircle className="h-4 w-4" />
              Completed
            </TabsTrigger>
          </TabsList>

          {/* Available Deliveries Tab */}
          <TabsContent value="available">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Available Deliveries Near You</h2>
            
            {!isOnline ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Power className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700">You are offline</h3>
                <p className="text-gray-500 mb-4">
                  Go online to see available deliveries
                </p>
                <Button onClick={handleToggleOnline} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md">
                  <Power className="h-4 w-4 mr-2" />
                  Go Online
                </Button>
              </motion.div>
            ) : availableDeliveries.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Navigation className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700">No deliveries available</h3>
                <p className="text-gray-500">
                  Check back later for new delivery requests
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableDeliveries.map((delivery, index) => (
                  <DeliveryCard
                    key={delivery.id}
                    delivery={delivery}
                    order={orders[delivery.orderId]}
                    onAccept={() => handleAcceptDelivery(delivery.id)}
                    riderLocation={riderLocation || undefined}
                    index={index}
                    isAvailable
                  />
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Deliveries Tab */}
          <TabsContent value="active">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Active Deliveries</h2>
            
            {stats.activeDeliveries === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700">No active deliveries</h3>
                <p className="text-gray-500">
                  Accept a delivery to get started
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myDeliveries
                  .filter((d) => !['DELIVERED', 'CANCELLED'].includes(d.status))
                  .map((delivery, index) => (
                    <DeliveryCard
                      key={delivery.id}
                      delivery={delivery}
                      order={orders[delivery.orderId]}
                      onUpdateStatus={(status) =>
                        handleUpdateDeliveryStatus(delivery.id, status)
                      }
                      riderLocation={riderLocation || undefined}
                      index={index}
                    />
                  ))}
              </div>
            )}
          </TabsContent>

          {/* Completed Tab */}
          <TabsContent value="completed">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Completed Deliveries</h2>
            
            {stats.completedDeliveries === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-16"
              >
                <CheckCircle className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-700">No completed deliveries</h3>
                <p className="text-gray-500">
                  Your completed deliveries will appear here
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {myDeliveries
                  .filter((d) => d.status === 'DELIVERED')
                  .map((delivery, index) => (
                    <DeliveryCard
                      key={delivery.id}
                      delivery={delivery}
                      order={orders[delivery.orderId]}
                      index={index}
                    />
                  ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default RiderDashboard;
