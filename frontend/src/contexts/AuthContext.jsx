import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';
import { toast } from 'react-toastify';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      const response = await api.get('/auth/me');
      setUser(response.data.data);
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, refreshToken, user } = response.data.data;
      
      // Validate tokens before storing
      if (!token || !refreshToken) {
        throw new Error('Invalid response: missing tokens');
      }
      
      // Store tokens (trim to remove any whitespace)
      localStorage.setItem('token', token.trim());
      localStorage.setItem('refreshToken', refreshToken.trim());
      setUser(user);
      
      toast.success('Login successful');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  };

  const loginWithGmail = () => {
    // Get API URL and ensure it ends with /api/auth/gmail
    let apiUrl = import.meta.env.VITE_API_URL || '/api';
    
    // Remove trailing slashes
    apiUrl = apiUrl.replace(/\/+$/, '');
    
    // Ensure it ends with /api
    if (!apiUrl.endsWith('/api')) {
      if (!apiUrl.includes('/api')) {
        apiUrl = `${apiUrl}/api`;
      }
    }
    
    // Construct Gmail OAuth URL
    const gmailUrl = `${apiUrl}/auth/gmail`;
    window.location.href = gmailUrl;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      setUser(null);
      toast.success('Logged out successfully');
    }
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  const value = {
    user,
    loading,
    login,
    loginWithGmail,
    logout,
    updateUser,
    checkAuth
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

