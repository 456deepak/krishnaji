// API Configuration
export const API_URL = import.meta.env.VITE_API_URL;
export const FRONTEND_URL = import.meta.env.VITE_FRONTEND_URL;
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// API Endpoints
export const ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_URL}/auth/login`,
    SIGNUP: `${API_URL}/auth/signup`,
    ADMIN_LOGIN: `${API_URL}/admin/login`,
    ADMIN_SIGNUP: `${API_URL}/admin/signup`,
  },
  TRANSACTIONS: {
    BASE: `${API_URL}/transactions`,
    HISTORY: `${API_URL}/transactions/history`,
    SUMMARY: `${API_URL}/transactions/summary`,
  },
  PAYMENTS: {
    BASE: `${API_URL}/payments`,
    HISTORY: `${API_URL}/payments/history`,
    CREATE: `${API_URL}/payments/create-order`,
    VERIFY: (orderId: string) => `${API_URL}/payments/verify/${orderId}`,
  },
  ADMIN: {
    USERS: `${API_URL}/admin/users`,
    TRANSACTIONS: `${API_URL}/admin/transactions`,
    PAYMENTS: `${API_URL}/admin/payments`,
    STATS: `${API_URL}/admin/stats`,
  },
}; 