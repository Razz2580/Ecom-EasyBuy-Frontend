/**
 * Register Page
 * User registration with role selection and conditional fields
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, Phone, Store, Truck, Package, ShoppingBag, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

import { useAuth } from '@/context/AuthContext';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { UserRole } from '@/types';

const steps = ['account', 'role', 'details'] as const;
type Step = typeof steps[number];

const Register: React.FC = () => {
  const { register, isLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<Step>('account');
  const [formData, setFormData] = useState<{
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone: string;
    role: UserRole;
    storeName: string;
    storeDescription: string;
    address: string;
    vehicleType: string;
    vehicleNumber: string;
  }>({
    // Account
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    // Role
    role: 'CUSTOMER',
    // Seller details
    storeName: '',
    storeDescription: '',
    address: '',
    // Rider details
    vehicleType: '',
    vehicleNumber: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (step: Step): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 'account') {
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'Full name is required';
      }

      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email';
      }

      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 6) {
        newErrors.password = 'Password must be at least 6 characters';
      }

      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }

      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
        newErrors.phone = 'Please enter a valid 10-digit phone number';
      }
    }

    if (step === 'details') {
      if (formData.role === UserRole.SELLER) {
        if (!formData.storeName.trim()) {
          newErrors.storeName = 'Store name is required';
        }
        if (!formData.address.trim()) {
          newErrors.address = 'Store address is required';
        }
      }

      if (formData.role === UserRole.RIDER) {
        if (!formData.vehicleType.trim()) {
          newErrors.vehicleType = 'Vehicle type is required';
        }
        if (!formData.vehicleNumber.trim()) {
          newErrors.vehicleNumber = 'Vehicle number is required';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (validateStep(currentStep) && currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep('details')) return;

    const registerData: Parameters<typeof register>[0] = {
      email: formData.email,
      password: formData.password,
      fullName: formData.fullName,
      phone: formData.phone,
      role: formData.role,
    };

    if (formData.role === UserRole.SELLER) {
      registerData.storeName = formData.storeName;
      registerData.storeDescription = formData.storeDescription;
      registerData.address = formData.address;
    }

    if (formData.role === UserRole.RIDER) {
      registerData.vehicleType = formData.vehicleType;
      registerData.vehicleNumber = formData.vehicleNumber;
    }

    try {
      await register(registerData);
    } catch (error) {
      // Error is handled by auth context
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const getStepIcon = (step: Step) => {
    switch (step) {
      case 'account':
        return <User className="h-5 w-5" />;
      case 'role':
        return <Store className="h-5 w-5" />;
      case 'details':
        return <Package className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen text="Creating your account..." />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-white p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring' }}
          className="flex justify-center mb-8"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
              <ShoppingBag className="h-7 w-7 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              EasyBuy
            </span>
          </div>
        </motion.div>

        <Card className="border-0 shadow-xl rounded-2xl overflow-hidden">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-2xl text-center">Create an account</CardTitle>
            <CardDescription className="text-center">
              Join EasyBuy and start your journey
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {steps.map((step, index) => (
                <React.Fragment key={step}>
                  <motion.div
                    className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      steps.indexOf(currentStep) >= index
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                    animate={{
                      scale: currentStep === step ? 1.1 : 1,
                    }}
                  >
                    {getStepIcon(step)}
                  </motion.div>
                  {index < steps.length - 1 && (
                    <div
                      className={`w-8 h-0.5 ${
                        steps.indexOf(currentStep) > index ? 'bg-gradient-to-r from-indigo-600 to-purple-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            <form onSubmit={handleSubmit}>
              <AnimatePresence mode="wait">
                {/* Step 1: Account Information */}
                {currentStep === 'account' && (
                  <motion.div
                    key="account"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <Label className="text-gray-700">Full Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="fullName"
                          name="fullName"
                          placeholder="John Doe"
                          value={formData.fullName}
                          onChange={handleChange}
                          className={`pl-10 border-gray-200 focus:border-indigo-300 focus:ring-indigo-200 ${errors.fullName ? 'border-destructive' : ''}`}
                        />
                      </div>
                      {errors.fullName && (
                        <p className="text-sm text-destructive">{errors.fullName}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-700">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="name@example.com"
                          value={formData.email}
                          onChange={handleChange}
                          className={`pl-10 border-gray-200 focus:border-indigo-300 focus:ring-indigo-200 ${errors.email ? 'border-destructive' : ''}`}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-sm text-destructive">{errors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-700">Phone Number</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="phone"
                          name="phone"
                          type="tel"
                          placeholder="9876543210"
                          value={formData.phone}
                          onChange={handleChange}
                          className={`pl-10 border-gray-200 focus:border-indigo-300 focus:ring-indigo-200 ${errors.phone ? 'border-destructive' : ''}`}
                        />
                      </div>
                      {errors.phone && (
                        <p className="text-sm text-destructive">{errors.phone}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-700">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Create a password"
                          value={formData.password}
                          onChange={handleChange}
                          className={`pl-10 pr-10 border-gray-200 focus:border-indigo-300 focus:ring-indigo-200 ${errors.password ? 'border-destructive' : ''}`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-sm text-destructive">{errors.password}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-gray-700">Confirm Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="confirmPassword"
                          name="confirmPassword"
                          type={showPassword ? 'text' : 'password'}
                          placeholder="Confirm your password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          className={`pl-10 border-gray-200 focus:border-indigo-300 focus:ring-indigo-200 ${errors.confirmPassword ? 'border-destructive' : ''}`}
                        />
                      </div>
                      {errors.confirmPassword && (
                        <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                      )}
                    </div>

                    <Button
                      type="button"
                      className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md transition-all"
                      onClick={handleNext}
                    >
                      Next Step
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </motion.div>
                )}

                {/* Step 2: Role Selection */}
                {currentStep === 'role' && (
                  <motion.div
                    key="role"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <Label className="text-gray-700">Select your role</Label>
                    <RadioGroup
                      value={formData.role}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, role: value as UserRole }))
                      }
                      className="grid grid-cols-1 gap-4"
                    >
                      <div>
                        <RadioGroupItem value={UserRole.CUSTOMER} id="customer" className="peer sr-only" />
                        <Label
                          htmlFor="customer"
                          className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg cursor-pointer transition-all peer-data-[state=checked]:border-indigo-500 peer-data-[state=checked]:bg-indigo-50 hover:bg-gray-50"
                        >
                          <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <ShoppingBag className="h-6 w-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">Customer</p>
                            <p className="text-sm text-gray-500">Browse and order products</p>
                          </div>
                        </Label>
                      </div>

                      <div>
                        <RadioGroupItem value={UserRole.SELLER} id="seller" className="peer sr-only" />
                        <Label
                          htmlFor="seller"
                          className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg cursor-pointer transition-all peer-data-[state=checked]:border-indigo-500 peer-data-[state=checked]:bg-indigo-50 hover:bg-gray-50"
                        >
                          <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <Store className="h-6 w-6 text-green-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">Seller</p>
                            <p className="text-sm text-gray-500">Sell your products</p>
                          </div>
                        </Label>
                      </div>

                      <div>
                        <RadioGroupItem value={UserRole.RIDER} id="rider" className="peer sr-only" />
                        <Label
                          htmlFor="rider"
                          className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg cursor-pointer transition-all peer-data-[state=checked]:border-indigo-500 peer-data-[state=checked]:bg-indigo-50 hover:bg-gray-50"
                        >
                          <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <Truck className="h-6 w-6 text-orange-600" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">Rider</p>
                            <p className="text-sm text-gray-500">Deliver orders</p>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 border-gray-300 hover:bg-gray-50"
                        onClick={handleBack}
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button
                        type="button"
                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md transition-all"
                        onClick={handleNext}
                      >
                        Next Step
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  </motion.div>
                )}

                {/* Step 3: Role-specific Details */}
                {currentStep === 'details' && (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <AnimatePresence mode="wait">
                      {formData.role === UserRole.CUSTOMER && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="text-center py-8"
                        >
                          <ShoppingBag className="h-16 w-16 text-indigo-500 mx-auto mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to shop!</h3>
                          <p className="text-gray-500">
                            You're all set. Click the button below to create your account.
                          </p>
                        </motion.div>
                      )}

                      {formData.role === UserRole.SELLER && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label className="text-gray-700">Store Name</Label>
                            <Input
                              id="storeName"
                              name="storeName"
                              placeholder="My Awesome Store"
                              value={formData.storeName}
                              onChange={handleChange}
                              className={`border-gray-200 focus:border-indigo-300 focus:ring-indigo-200 ${errors.storeName ? 'border-destructive' : ''}`}
                            />
                            {errors.storeName && (
                              <p className="text-sm text-destructive">{errors.storeName}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label className="text-gray-700">Store Description</Label>
                            <textarea
                              id="storeDescription"
                              name="storeDescription"
                              placeholder="Tell us about your store..."
                              value={formData.storeDescription}
                              onChange={handleChange}
                              className="w-full min-h-[100px] px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label className="text-gray-700">Store Address</Label>
                            <textarea
                              id="address"
                              name="address"
                              placeholder="Enter your store address"
                              value={formData.address}
                              onChange={handleChange}
                              className={`w-full min-h-[80px] px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 ${
                                errors.address ? 'border-destructive' : ''
                              }`}
                            />
                            {errors.address && (
                              <p className="text-sm text-destructive">{errors.address}</p>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {formData.role === UserRole.RIDER && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="space-y-4"
                        >
                          <div className="space-y-2">
                            <Label className="text-gray-700">Vehicle Type</Label>
                            <Input
                              id="vehicleType"
                              name="vehicleType"
                              placeholder="e.g., Bike, Scooter, Car"
                              value={formData.vehicleType}
                              onChange={handleChange}
                              className={`border-gray-200 focus:border-indigo-300 focus:ring-indigo-200 ${errors.vehicleType ? 'border-destructive' : ''}`}
                            />
                            {errors.vehicleType && (
                              <p className="text-sm text-destructive">{errors.vehicleType}</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label className="text-gray-700">Vehicle Number</Label>
                            <Input
                              id="vehicleNumber"
                              name="vehicleNumber"
                              placeholder="e.g., MH01AB1234"
                              value={formData.vehicleNumber}
                              onChange={handleChange}
                              className={`border-gray-200 focus:border-indigo-300 focus:ring-indigo-200 ${errors.vehicleNumber ? 'border-destructive' : ''}`}
                            />
                            {errors.vehicleNumber && (
                              <p className="text-sm text-destructive">{errors.vehicleNumber}</p>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        className="flex-1 border-gray-300 hover:bg-gray-50"
                        onClick={handleBack}
                      >
                        <ChevronLeft className="mr-2 h-4 w-4" />
                        Back
                      </Button>
                      <Button
                        type="submit"
                        className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md transition-all"
                      >
                        Create Account
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>

            {/* Login Link */}
            <p className="text-center text-sm text-gray-500 mt-6">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-600 hover:text-indigo-700 font-medium">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-gray-500 mt-8"
        >
          By creating an account, you agree to our{' '}
          <Link to="/terms" className="hover:text-indigo-600 hover:underline">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="hover:text-indigo-600 hover:underline">
            Privacy Policy
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Register;
