import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Session timeout: 2 hours of inactivity (in milliseconds)
const SESSION_TIMEOUT_MS = 2 * 60 * 60 * 1000;
const LAST_ACTIVITY_KEY = 'lastActivity';

const updateLastActivity = () => {
  localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
};

const isSessionExpired = (): boolean => {
  const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
  if (!lastActivity) return false;
  return Date.now() - parseInt(lastActivity, 10) > SESSION_TIMEOUT_MS;
};

const clearSession = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem(LAST_ACTIVITY_KEY);
};

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Check for session inactivity timeout before making requests
      if (isSessionExpired()) {
        clearSession();
        window.location.href = '/login';
        return Promise.reject(new axios.Cancel('Session expired due to inactivity'));
      }
      config.headers.Authorization = `Bearer ${token}`;
      updateLastActivity();
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearSession();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Initialize last activity on module load if user is logged in
if (localStorage.getItem('token')) {
  updateLastActivity();
}

export { updateLastActivity, isSessionExpired, clearSession, SESSION_TIMEOUT_MS };
export default axiosInstance;
