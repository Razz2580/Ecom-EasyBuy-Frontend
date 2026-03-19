/**
 * Profile Page
 * User profile management for all roles
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Store, 
  Truck, 
  ArrowLeft,
  Save,
  Edit2,
  ShoppingBag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { sellerAPI, riderAPI } from '@/services/api';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { UserRole, type SellerDTO, type RiderDTO } from '@/types';

const ProfilePage: React.FC = () => {
  const { user, updateUser, hasRole } = useAuth();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sellerProfile, setSellerProfile] = useState<SellerDTO | null>(null);
  const [riderProfile, setRiderProfile] = useState<RiderDTO | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
    // Seller fields
    storeName: '',
    storeDescription: '',
    // Rider fields
    vehicleType: '',
    vehicleNumber: '',
  });

  // Fetch role-specific profiles
  useEffect(() => {
    if (hasRole(UserRole.SELLER)) {
      fetchSellerProfile();
    }
    if (hasRole(UserRole.RIDER)) {
      fetchRiderProfile();
    }
  }, []);

  // Initialize form data
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.fullName || '',
        phone: user.phone || '',
        address: user.address || '',
      }));
    }
  }, [user]);

  // Update form when profiles load
  useEffect(() => {
    if (sellerProfile) {
      setFormData((prev) => ({
        ...prev,
        storeName: sellerProfile.storeName || '',
        storeDescription: sellerProfile.storeDescription || '',
        address: sellerProfile.address || prev.address,
      }));
    }
  }, [sellerProfile]);

  useEffect(() => {
    if (riderProfile) {
      setFormData((prev) => ({
        ...prev,
        vehicleType: riderProfile.vehicleType || '',
        vehicleNumber: riderProfile.vehicleNumber || '',
      }));
    }
  }, [riderProfile]);

  const fetchSellerProfile = async () => {
    try {
      const profile = await sellerAPI.getProfile();
      setSellerProfile(profile);
    } catch (error) {
      console.error('Failed to fetch seller profile:', error);
    }
  };

  const fetchRiderProfile = async () => {
    try {
      const profile = await riderAPI.getProfile();
      setRiderProfile(profile);
    } catch (error) {
      console.error('Failed to fetch rider profile:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Update basic profile
      await updateUser({
        fullName: formData.fullName,
        phone: formData.phone,
        address: formData.address,
      });

      // Update seller profile if applicable
      if (hasRole(UserRole.SELLER)) {
        await sellerAPI.updateProfile({
          storeName: formData.storeName,
          storeDescription: formData.storeDescription,
          address: formData.address,
        });
      }

      // Update rider profile if applicable
      if (hasRole(UserRole.RIDER)) {
        await riderAPI.updateProfile({
          vehicleType: formData.vehicleType,
          vehicleNumber: formData.vehicleNumber,
        });
      }

      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case UserRole.CUSTOMER:
        return <ShoppingBag className="h-5 w-5" />;
      case UserRole.SELLER:
        return <Store className="h-5 w-5" />;
      case UserRole.RIDER:
        return <Truck className="h-5 w-5" />;
      default:
        return <User className="h-5 w-5" />;
    }
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case UserRole.CUSTOMER:
        return 'Customer';
      case UserRole.SELLER:
        return 'Seller';
      case UserRole.RIDER:
        return 'Rider';
      default:
        return 'User';
    }
  };

  const getDashboardLink = () => {
    switch (user?.role) {
      case UserRole.CUSTOMER:
        return '/customer';
      case UserRole.SELLER:
        return '/seller';
      case UserRole.RIDER:
        return '/rider';
      default:
        return '/dashboard';
    }
  };

  if (!user) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <motion.header
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b"
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate(getDashboardLink())}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            
            <Button
              variant={isEditing ? 'default' : 'outline'}
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              ) : (
                <>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Profile
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto"
        >
          {/* Profile Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="inline-flex items-center justify-center w-24 h-24 bg-primary/10 rounded-full mb-4"
            >
              <User className="h-12 w-12 text-primary" />
            </motion.div>
            <h1 className="text-2xl font-bold">{user.fullName}</h1>
            <div className="flex items-center justify-center gap-2 mt-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                {getRoleIcon()}
                {getRoleLabel()}
              </Badge>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="font-medium text-muted-foreground">Basic Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        value={user.email}
                        disabled
                        className="pl-10 bg-muted"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <textarea
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full min-h-[80px] pl-10 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:bg-muted"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Role-specific Information */}
                {hasRole(UserRole.SELLER) && (
                  <div className="space-y-4">
                    <h3 className="font-medium text-muted-foreground flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      Store Information
                    </h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="storeName">Store Name</Label>
                      <Input
                        id="storeName"
                        name="storeName"
                        value={formData.storeName}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="storeDescription">Store Description</Label>
                      <textarea
                        id="storeDescription"
                        name="storeDescription"
                        value={formData.storeDescription}
                        onChange={handleChange}
                        disabled={!isEditing}
                        className="w-full min-h-[80px] px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none disabled:bg-muted"
                      />
                    </div>
                  </div>
                )}

                {hasRole(UserRole.RIDER) && (
                  <div className="space-y-4">
                    <h3 className="font-medium text-muted-foreground flex items-center gap-2">
                      <Truck className="h-4 w-4" />
                      Vehicle Information
                    </h3>
                    
                    <div className="space-y-2">
                      <Label htmlFor="vehicleType">Vehicle Type</Label>
                      <Input
                        id="vehicleType"
                        name="vehicleType"
                        value={formData.vehicleType}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="vehicleNumber">Vehicle Number</Label>
                      <Input
                        id="vehicleNumber"
                        name="vehicleNumber"
                        value={formData.vehicleNumber}
                        onChange={handleChange}
                        disabled={!isEditing}
                      />
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                {isEditing && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-3"
                  >
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setIsEditing(false)}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1"
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </form>
        </motion.div>
      </main>
    </div>
  );
};

export default ProfilePage;
