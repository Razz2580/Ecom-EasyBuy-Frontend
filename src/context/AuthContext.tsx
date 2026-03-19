/**
 * EasyBuy Authentication Context
 * Manages user authentication state and provides auth-related functions
 */

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { authAPI, userAPI, setToken, removeToken } from '@/services/api';
import { webSocketService } from '@/services/webSocketService';
import type { AuthResponse, LoginRequest, RegisterRequest, UserProfileUpdate, UserRole } from '@/types';

// ============================================
// Auth Context Types
// ============================================

interface AuthContextType {
  user: AuthResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateUser: (data: UserProfileUpdate) => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (role: UserRole) => boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

// ============================================
// Create Context
// ============================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================
// Auth Provider Component
// ============================================

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser) as AuthResponse;
          setUser(parsedUser);
          setToken(token);
          
          // Connect WebSocket
          webSocketService.connect(parsedUser.userId);
          
          // Verify token is still valid by fetching profile
          await userAPI.getProfile();
        } catch (error) {
          console.error('Session validation failed:', error);
          handleLogout();
        }
      }
      
      setIsLoading(false);
    };

    initAuth();

    // Cleanup on unmount
    return () => {
      webSocketService.disconnect();
    };
  }, []);

  // ============================================
  // Authentication Methods
  // ============================================

  /**
   * Login user
   */
  const login = useCallback(async (data: LoginRequest): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authAPI.login(data);
      
      // Save token and user data
      setToken(response.token);
      localStorage.setItem('user', JSON.stringify(response));
      setUser(response);

      // Connect WebSocket
      webSocketService.connect(response.userId);

      toast.success('Login successful!', {
        description: `Welcome back, ${response.fullName}!`,
      });

      // Redirect based on role
      redirectBasedOnRole(response.role);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed. Please try again.';
      toast.error('Login failed', { description: message });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  /**
   * Register new user
   */
  const register = useCallback(async (data: RegisterRequest): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authAPI.register(data);
      
      // Save token and user data
      setToken(response.token);
      localStorage.setItem('user', JSON.stringify(response));
      setUser(response);

      // Connect WebSocket
      webSocketService.connect(response.userId);

      toast.success('Registration successful!', {
        description: `Welcome, ${response.fullName}!`,
      });

      // Redirect based on role
      redirectBasedOnRole(response.role);
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error('Registration failed', { description: message });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  /**
   * Logout user
   */
  const logout = useCallback((): void => {
    handleLogout();
    toast.success('Logged out successfully');
    navigate('/login');
  }, [navigate]);

  /**
   * Handle logout (internal)
   */
  const handleLogout = (): void => {
    // Disconnect WebSocket
    webSocketService.disconnect();
    
    // Clear storage
    removeToken();
    localStorage.removeItem('user');
    
    // Clear state
    setUser(null);
  };

  /**
   * Update user profile
   */
  const updateUser = useCallback(async (data: UserProfileUpdate): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await userAPI.updateProfile(data);
      
      // Merge with existing user data
      const updatedUser = { ...user!, ...response };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      toast.success('Profile updated successfully');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update profile.';
      toast.error('Update failed', { description: message });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Refresh user data from server
   */
  const refreshUser = useCallback(async (): Promise<void> => {
    try {
      const response = await userAPI.getProfile();
      
      // Merge with existing user data to preserve token
      const updatedUser = { ...user!, ...response };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error: any) {
      console.error('Failed to refresh user:', error);
      if (error.response?.status === 401) {
        handleLogout();
        navigate('/login');
      }
    }
  }, [user, navigate]);

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Check if user has specific role
   */
  const hasRole = useCallback((role: UserRole): boolean => {
    return user?.role === role;
  }, [user]);

  /**
   * Redirect user based on their role
   */
  const redirectBasedOnRole = (role: UserRole): void => {
    switch (role) {
      case 'CUSTOMER':
        navigate('/customer');
        break;
      case 'SELLER':
        navigate('/seller');
        break;
      case 'RIDER':
        navigate('/rider');
        break;
      default:
        navigate('/dashboard');
    }
  };

  // ============================================
  // Context Value
  // ============================================

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================
// Custom Hook
// ============================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// ============================================
// Protected Route Component
// ============================================

import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  allowedRoles 
}) => {
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

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

export default AuthContext;
