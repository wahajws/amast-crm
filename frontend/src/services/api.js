import axios from 'axios';

// Get API base URL from environment or use relative path
// Use relative path by default so it works with any origin
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes for long-running operations
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Include cookies for CORS
});

// Request interceptor - Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Clean token (remove any whitespace)
      const cleanToken = token.trim();
      config.headers.Authorization = `Bearer ${cleanToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Track refresh attempts to prevent infinite loops
let isRefreshing = false;
let refreshSubscribers = [];

const subscribeTokenRefresh = (cb) => {
  refreshSubscribers.push(cb);
};

const onTokenRefreshed = (token) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Skip refresh logic for auth endpoints to prevent loops
    if (originalRequest.url?.includes('/auth/')) {
      return Promise.reject(error);
    }

    // Handle 401 Unauthorized - token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If already refreshing, wait for it to complete
      if (isRefreshing) {
        return new Promise((resolve) => {
          subscribeTokenRefresh((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      // Try to refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          // Use plain axios to avoid interceptor loop
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          }, {
            headers: {
              'Content-Type': 'application/json',
            },
          });

          const { token, refreshToken: newRefreshToken } = response.data.data;
          
          if (token && newRefreshToken) {
            localStorage.setItem('token', token);
            localStorage.setItem('refreshToken', newRefreshToken);
            
            // Notify all waiting requests
            onTokenRefreshed(token);
            
            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${token}`;
            isRefreshing = false;
            return api(originalRequest);
          } else {
            throw new Error('Invalid token response');
          }
        } catch (refreshError) {
          isRefreshing = false;
          // Refresh failed - clear tokens and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          
          // Only redirect if not already on login page
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      } else {
        isRefreshing = false;
        // No refresh token - clear and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        
        // Only redirect if not already on login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export { api };
export default api;
