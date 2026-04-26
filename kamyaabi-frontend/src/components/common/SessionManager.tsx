import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/useAppDispatch';
import { logout } from '../../features/auth/authSlice';
import { clearCart } from '../../features/cart/cartSlice';
import { isSessionExpired, clearSession } from '../../api/axiosInstance';

const CHECK_INTERVAL_MS = 30 * 1000;

const SessionManager: React.FC = () => {
  const dispatch = useAppDispatch();
  const { token } = useAppSelector((state) => state.auth);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleSessionExpired = useCallback(() => {
    clearSession(true);
    dispatch(logout());
    dispatch(clearCart());
    window.location.href = '/login';
  }, [dispatch]);

  useEffect(() => {
    if (!token) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    if (isSessionExpired()) {
      handleSessionExpired();
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
