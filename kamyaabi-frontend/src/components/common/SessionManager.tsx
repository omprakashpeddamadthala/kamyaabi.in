import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { logout } from '../../features/auth/authSlice';
import { clearCart } from '../../features/cart/cartSlice';
import { isSessionExpired, updateLastActivity, clearSession } from '../../api/axiosInstance';

// Check session every 60 seconds
const CHECK_INTERVAL_MS = 60 * 1000;

const SessionManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.auth);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSessionExpired = useCallback(() => {
    clearSession();
    dispatch(logout());
    dispatch(clearCart());
    window.location.href = '/login';
  }, [dispatch]);

  // Track user activity (mouse, keyboard, touch, scroll)
  useEffect(() => {
    if (!token) return;

    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    const handleActivity = () => {
      updateLastActivity();
    };

    activityEvents.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
    };
  }, [token]);

  // Periodically check if session has expired
  useEffect(() => {
    if (!token) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      if (isSessionExpired()) {
        handleSessionExpired();
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [token, handleSessionExpired]);

  return null;
};

export default SessionManager;
