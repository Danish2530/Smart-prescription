import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
});

// Attach JWT token automatically to every request if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('smartmed_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercept responses to handle 401 unauthorized gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired or invalid, clear localStorage and redirect to login
      if (window.location.pathname !== '/login' && window.location.pathname !== '/register' && window.location.pathname !== '/') {
        localStorage.removeItem('smartmed_token');
        localStorage.removeItem('smartmed_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
