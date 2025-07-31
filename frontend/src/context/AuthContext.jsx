import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const isDevelopment = process.env.NODE_ENV === 'development';

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    console.log('[AuthContext] Starting auth initialization...');
    
    // Add a timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Auth initialization timeout')), 15000); // 15 second timeout
    });
    
    try {
      const authPromise = async () => {
        const token = localStorage.getItem('access_token');
        console.log('[AuthContext] Token found:', !!token);
        
        if (token) {
          // Set up axios with token
          setupAxiosAuth(token);
          console.log('[AuthContext] Axios auth setup complete');
          
          // Get current user
          console.log('[AuthContext] Attempting to get current user...');
          const userData = await getCurrentUser(token);
          console.log('[AuthContext] getCurrentUser result:', userData);
          
          if (userData) {
            console.log('[AuthContext] Setting user data and authenticating...');
            setUser(userData);
            setIsAuthenticated(true);
          } else {
            console.log('[AuthContext] Token is invalid, clearing...');
            // Token is invalid, clear it
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
          }
        } else {
          console.log('[AuthContext] No token found, user not authenticated');
        }
      };
      
      // Race between the auth promise and timeout
      await Promise.race([authPromise(), timeoutPromise]);
      
    } catch (error) {
      console.error('[AuthContext] Auth initialization error:', error);
      console.error('[AuthContext] Error details:', error.response?.data);
      // Clear any invalid tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    } finally {
      console.log('[AuthContext] Setting loading to false');
      setLoading(false);
    }
  };

  const setupAxiosAuth = (token) => {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  };

  const login = async (email, password) => {
    try {
      console.log('[AuthContext] Starting login process...', { email });
      console.log('[AuthContext] Making login request to:', `${backendUrl}/auth/login`);
      
      const response = await axios.post(`${backendUrl}/auth/login`, {
        email,
        password
      }, {
        timeout: 10000 // 10 second timeout
      });

      console.log('[AuthContext] Login response received:', response.data);
      const { access_token, refresh_token, user: userData } = response.data;
      
      // Store tokens
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      
      // Set up axios
      setupAxiosAuth(access_token);
      
      // Update state
      setUser(userData);
      setIsAuthenticated(true);
      
      console.log('[AuthContext] Login completed successfully');
      return { success: true };
    } catch (error) {
      console.error('[AuthContext] Login error:', error);
      console.error('[AuthContext] Login error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          timeout: error.config?.timeout
        }
      });
      
      let errorMessage = 'Login failed. Please check your credentials.';
      
      if (error.code === 'ECONNREFUSED') {
        errorMessage = `Cannot connect to backend server. Please check if the server is running on ${backendUrl}`;
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.response?.status === 401) {
        errorMessage = error.response.data?.detail || 'Invalid credentials.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.detail || 'Invalid login data.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const register = async (email, password, display_name) => {
    console.log('[AuthContext] Starting registration process...', { email, display_name });
    try {
      console.log('[AuthContext] Making registration request to:', `${backendUrl}/auth/register`);
      
      // First, test connectivity with a ping
      try {
        console.log('[AuthContext] Testing connectivity with ping...');
        const pingResponse = await axios.get(`${backendUrl}/auth/ping`, {
          timeout: 5000
        });
        console.log('[AuthContext] Ping successful:', pingResponse.data);
      } catch (pingError) {
        console.error('[AuthContext] Ping failed:', pingError);
        console.error('[AuthContext] Ping error details:', {
          message: pingError.message,
          code: pingError.code,
          response: pingError.response?.data,
          status: pingError.response?.status
        });
        return { 
          success: false, 
          error: `Cannot connect to backend server. Please check if the server is running on ${backendUrl}` 
        };
      }
      
      const response = await axios.post(`${backendUrl}/auth/register`, {
        email,
        password,
        display_name
      }, {
        timeout: 10000 // 10 second timeout
      });
      console.log('[AuthContext] Registration response received:', response.data);

      // Check if verification is required
      if (response.data.requires_verification) {
        console.log('[AuthContext] Verification required, redirecting to verification page');
        // Store verification data and redirect to verification page
        localStorage.setItem('pending_verification_email', email);
        localStorage.setItem('pending_verification_display_name', display_name);
        
        return { 
          success: true, 
          requiresVerification: true,
          message: response.data.message || 'Registration successful. Please verify your email.'
        };
      }

      // If no verification required, the user is registered but not logged in
      // We need to log them in automatically
      console.log('[AuthContext] Registration successful, attempting auto-login...');
      
      try {
        // Attempt to log in the user automatically
        console.log('[AuthContext] Making login request to:', `${backendUrl}/auth/login`);
        const loginResponse = await axios.post(`${backendUrl}/auth/login`, {
          email,
          password
        }, {
          timeout: 10000 // 10 second timeout
        });
        console.log('[AuthContext] Auto-login response received:', loginResponse.data);

        const { access_token, refresh_token, user: userData } = loginResponse.data;
        
        // Store tokens
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        
        // Set up axios
        setupAxiosAuth(access_token);
        
        // Update state
        setUser(userData);
        setIsAuthenticated(true);
        
        console.log('[AuthContext] Registration and auto-login completed successfully');
        return { success: true };
      } catch (loginError) {
        console.error('[AuthContext] Auto-login failed after registration:', loginError);
        console.error('[AuthContext] Login error response:', loginError.response?.data);
        // Registration succeeded but login failed - user needs to log in manually
        return { 
          success: true, 
          requiresManualLogin: true,
          message: response.data.message || 'Registration successful! Please log in with your new account.'
        };
      }
    } catch (error) {
      console.error('[AuthContext] Registration error:', error);
      console.error('[AuthContext] Registration error details:', {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        status: error.response?.status,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          timeout: error.config?.timeout
        }
      });
      
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.code === 'ECONNREFUSED') {
        errorMessage = `Cannot connect to backend server. Please check if the server is running on ${backendUrl}`;
      } else if (error.code === 'NETWORK_ERROR') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.detail || 'Invalid registration data.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const oauthLogin = async (provider, code, redirect_uri) => {
    try {
      const response = await axios.post(`${backendUrl}/auth/oauth/login`, {
        provider,
        code,
        redirect_uri
      });

      const { access_token, refresh_token, user: userData } = response.data;
      
      // Store tokens
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      
      // Set up axios
      setupAxiosAuth(access_token);
      
      // Update state
      setUser(userData);
      setIsAuthenticated(true);
      
      return { success: true };
    } catch (error) {
      console.error('OAuth login error:', error);
      const errorMessage = error.response?.data?.detail || 'OAuth login failed. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint if user is authenticated
      if (isAuthenticated && user) {
        await axios.post(`${backendUrl}/auth/logout`);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear tokens and state regardless of API call success
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      delete axios.defaults.headers.common['Authorization'];
      
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const getCurrentUser = async (token) => {
    console.log('[AuthContext] Starting getCurrentUser with token:', !!token);
    try {
      console.log('[AuthContext] Making request to:', `${backendUrl}/auth/me`);
      const response = await axios.get(`${backendUrl}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 10000 // 10 second timeout
      });
      console.log('[AuthContext] Response received:', response.data);
      return response.data;
    } catch (error) {
      console.error('[AuthContext] Error:', error);
      console.error('[AuthContext] Error response:', error.response?.data);
      console.error('[AuthContext] Error status:', error.response?.status);
      
      // If it's a 401, the token is invalid
      if (error.response?.status === 401) {
        console.log('[AuthContext] Token is invalid (401), clearing tokens');
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        return null;
      }
      
      // For other errors, log but don't clear tokens (might be temporary network issue)
      console.log('[AuthContext] Non-401 error, keeping tokens for retry');
      return null;
    }
  };

  const getTestUser = async () => {
    try {
      const response = await axios.get(`${backendUrl}/auth/test-user`);
      return response.data;
    } catch (error) {
      console.error('Get test user error:', error);
      return null;
    }
  };

  const verifyEmail = async (email, verificationCode) => {
    try {
      const response = await axios.post(`${backendUrl}/auth/verify-email`, {
        email,
        verification_code: verificationCode
      });
      
      if (response.data.success) {
        // Clear pending verification data
        localStorage.removeItem('pending_verification_email');
        localStorage.removeItem('pending_verification_display_name');
        
        return { success: true, message: response.data.message };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      console.error('Email verification error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.detail || 'Verification failed. Please try again.';
      return { success: false, error: errorMessage };
    }
  };

  const resendVerification = async (email) => {
    try {
      const response = await axios.post(`${backendUrl}/auth/resend-verification`, {
        email
      });
      
      if (response.data.success) {
        return { success: true, message: response.data.message };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error) {
      console.error('Resend verification error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.detail || 'Failed to resend verification email.';
      return { success: false, error: errorMessage };
    }
  };

  const clearPendingVerification = () => {
    localStorage.removeItem('pending_verification_email');
    localStorage.removeItem('pending_verification_display_name');
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    oauthLogin,
    logout,
    getCurrentUser,
    getTestUser,
    verifyEmail,
    resendVerification,
    clearPendingVerification
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 