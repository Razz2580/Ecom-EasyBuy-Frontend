/**
 * EasyBuy E-Commerce Application
 * Main App Component with Routing
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider, useAuth, ProtectedRoute } from '@/context/AuthContext';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';

// Pages
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import CustomerDashboard from '@/pages/customer/CustomerDashboard';
import SellerDashboard from '@/pages/seller/SellerDashboard';
import RiderDashboard from '@/pages/rider/RiderDashboard';
import Payment from '@/pages/Payment';
import ProfilePage from '@/pages/ProfilePage';

// Types
import { UserRole } from '@/types';

// ============================================
// Role-based Redirect Component
// ============================================
const RoleBasedRedirect: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Redirect based on role
  switch (user?.role) {
    case UserRole.CUSTOMER:
      return <Navigate to="/customer" replace />;
    case UserRole.SELLER:
      return <Navigate to="/seller" replace />;
    case UserRole.RIDER:
      return <Navigate to="/rider" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

// ============================================
// Main App Component
// ============================================
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AnimatePresence mode="wait">
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes */}
              <Route
                path="/customer"
                element={
                  <ProtectedRoute allowedRoles={[UserRole.CUSTOMER]}>
                    <CustomerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/seller"
                element={
                  <ProtectedRoute allowedRoles={[UserRole.SELLER]}>
                    <SellerDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rider"
                element={
                  <ProtectedRoute allowedRoles={[UserRole.RIDER]}>
                    <RiderDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payment/:orderId"
                element={
                  <ProtectedRoute allowedRoles={[UserRole.CUSTOMER]}>
                    <Payment />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />

              {/* Default Routes */}
              <Route path="/dashboard" element={<RoleBasedRedirect />} />
              <Route path="/" element={<RoleBasedRedirect />} />
              
              {/* 404 Fallback */}
              <Route
                path="*"
                element={
                  <div className="min-h-screen flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold mb-4">404</h1>
                      <p className="text-muted-foreground mb-4">Page not found</p>
                      <a href="/" className="text-primary hover:underline">
                        Go to Dashboard
                      </a>
                    </div>
                  </div>
                }
              />
            </Routes>
          </AnimatePresence>

          {/* Toast Notifications */}
          <Toaster 
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              duration: 5000,
            }}
          />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;
