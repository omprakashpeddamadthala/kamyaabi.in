/*
 * UI REDESIGN AUDIT — PRESERVED FUNCTIONALITY
 * - Preserves Google OAuth login, dev quick login, session-expired notice, auth error display, and redirect behavior.
 * - Visual-only tokenization of centered auth card, radius, and shadow.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  Typography,
  Box,
  Button,
  Divider,
  Alert,
  CircularProgress,
  TextField,
  Stack,
} from '@mui/material';
import { AdminPanelSettings, Person, WhatsApp, ArrowBack, Refresh } from '@mui/icons-material';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { googleLogin, setSession } from '../features/auth/authSlice';
import { config } from '../config';
import { logger } from '../utils/logger';
import { authApi } from '../api/authApi';
import { parseApiError } from '../utils/apiError';
import { setTokenExpiry } from '../api/axiosInstance';
import type { User } from '../types';

const OTP_RESEND_SECONDS_FALLBACK = 30;

const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { error, loading } = useAppSelector((state) => state.auth);
  const [loginAttempted, setLoginAttempted] = React.useState(false);
  const [sessionExpiredMsg, setSessionExpiredMsg] = React.useState<string | null>(
    () => {
      const flag = sessionStorage.getItem('sessionExpired');
      if (flag) {
        sessionStorage.removeItem('sessionExpired');
        return 'Your session has expired. Please sign in again.';
      }
      return null;
    }
  );
  const [whatsappEnabled, setWhatsappEnabled] = React.useState(false);
  const [whatsappEnabledLoaded, setWhatsappEnabledLoaded] = React.useState(false);
  const [showWhatsappFlow, setShowWhatsappFlow] = React.useState(false);
  const [whatsappStep, setWhatsappStep] = React.useState<'phone' | 'otp'>('phone');
  const [phoneNumber, setPhoneNumber] = React.useState('');
  const [otp, setOtp] = React.useState('');
  const [whatsappMessage, setWhatsappMessage] = React.useState<string | null>(null);
  const [whatsappError, setWhatsappError] = React.useState<string | null>(null);
  const [requestingOtp, setRequestingOtp] = React.useState(false);
  const [verifyingOtp, setVerifyingOtp] = React.useState(false);
  const [resendSeconds, setResendSeconds] = React.useState(0);

  const clientId = config.googleClientId;

  React.useEffect(() => {
    let cancelled = false;
    authApi
      .getWhatsappStatus()
      .then((res) => {
        if (cancelled) return;
        setWhatsappEnabled(Boolean(res.data.data?.enabled));
      })
      .catch((err) => {
        if (cancelled) return;
        logger.warn('Failed to load WhatsApp login status', {
          message: parseApiError(err, 'Failed to load auth settings').message,
        });
        setWhatsappEnabled(false);
      })
      .finally(() => {
        if (!cancelled) setWhatsappEnabledLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    if (resendSeconds <= 0) return undefined;
    const timer = window.setInterval(() => {
      setResendSeconds((current) => Math.max(0, current - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const normalizePhone = React.useCallback((value: string) => value.replace(/\D+/g, ''), []);

  const isValidPhone = React.useCallback((value: string) => /^[1-9]\d{9,14}$/.test(value), []);

  const persistSession = React.useCallback((token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setTokenExpiry();
    dispatch(setSession({ token, user }));
  }, [dispatch]);

  const handleGoogleSuccess = React.useCallback(
    (credentialResponse: { credential?: string }) => {
      if (credentialResponse.credential) {
        setLoginAttempted(true);
        dispatch(
          googleLogin({
            idToken: credentialResponse.credential,
          })
        ).then((result) => {
          if (googleLogin.fulfilled.match(result)) {
            navigate('/');
          }
          setLoginAttempted(false);
        });
      }
    },
    [dispatch, navigate]
  );

  const handleDevLogin = React.useCallback(
    (email: string, displayName: string) => {
      setLoginAttempted(true);
      dispatch(
        googleLogin({
          email,
          name: displayName,
          sub: `dev-${email}`,
          picture: '',
        })
      ).then((result) => {
        if (googleLogin.fulfilled.match(result)) {
          navigate('/');
        }
        setLoginAttempted(false);
      });
    },
    [dispatch, navigate]
  );

  const handleRequestOtp = React.useCallback(async () => {
    const normalizedPhone = normalizePhone(phoneNumber);
    if (!isValidPhone(normalizedPhone)) {
      setWhatsappError('Enter a valid phone number with country code.');
      return;
    }
    setWhatsappError(null);
    setWhatsappMessage(null);
    setRequestingOtp(true);
    try {
      const response = await authApi.requestWhatsappOtp({ phoneNumber: normalizedPhone });
      const data = response.data.data;
      setWhatsappStep('otp');
      setPhoneNumber(normalizedPhone);
      setOtp('');
      setResendSeconds(data?.resendAfterSeconds ?? OTP_RESEND_SECONDS_FALLBACK);
      setWhatsappMessage('OTP sent. Check WhatsApp.');
    } catch (err) {
      const parsed = parseApiError(err, 'Failed to send OTP');
      setWhatsappError(parsed.message);
    } finally {
      setRequestingOtp(false);
    }
  }, [isValidPhone, normalizePhone, phoneNumber]);

  const handleVerifyOtp = React.useCallback(async () => {
    const normalizedPhone = normalizePhone(phoneNumber);
    if (!isValidPhone(normalizedPhone)) {
      setWhatsappError('Enter a valid phone number with country code.');
      return;
    }
    if (!/^\d{6}$/.test(otp.trim())) {
      setWhatsappError('Enter the 6-digit OTP from WhatsApp.');
      return;
    }
    setWhatsappError(null);
    setWhatsappMessage(null);
    setVerifyingOtp(true);
    try {
      const response = await authApi.verifyWhatsappOtp({ phoneNumber: normalizedPhone, otp: otp.trim() });
      const payload = response.data.data;
      if (payload) {
        persistSession(payload.token, payload.user);
        navigate('/');
      }
    } catch (err) {
      const parsed = parseApiError(err, 'Failed to verify OTP');
      setWhatsappError(parsed.message);
    } finally {
      setVerifyingOtp(false);
    }
  }, [isValidPhone, navigate, normalizePhone, otp, persistSession, phoneNumber]);

  const googleBusy = loading || loginAttempted;

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <GoogleOAuthProvider clientId={clientId}>
        <Card sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center', '&:hover': { transform: 'none' }, borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)' }}>
          <Box
            component="img"
            src="/assets/img/klogo1.webp"
            alt="Kamyaabi"
            sx={{ height: 56, width: 'auto', mb: 1, mx: 'auto', display: 'block' }}
          />
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            Premium Dry Fruits Store
          </Typography>

          <Divider sx={{ mb: 4 }} />

          <Typography variant="h5" sx={{ mb: 1 }}>
            Welcome Back
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
            Sign in to continue shopping
          </Typography>

          {sessionExpiredMsg && (
            <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setSessionExpiredMsg(null)}>
              {sessionExpiredMsg}
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {whatsappError && (
            <Alert severity="error" sx={{ mb: 3 }} onClose={() => setWhatsappError(null)}>
              {whatsappError}
            </Alert>
          )}

          {whatsappMessage && (
            <Alert severity="success" sx={{ mb: 3 }} onClose={() => setWhatsappMessage(null)}>
              {whatsappMessage}
            </Alert>
          )}

          {!clientId && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              Google Client ID is missing in the environment variables.
            </Alert>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            {googleBusy ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={32} />
                <Typography variant="body2" color="text.secondary">
                  Signing you in...
                </Typography>
              </Box>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => {
                  logger.error('Google Login failed', { reason: 'OAuth callback onError' });
                }}
                useOneTap
                auto_select
              />
            )}
          </Box>

          {whatsappEnabledLoaded && whatsappEnabled && (
            <Box sx={{ mb: 3 }}>
              <Divider sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  or
                </Typography>
              </Divider>

              {!showWhatsappFlow ? (
                <Button
                  fullWidth
                  variant="outlined"
                  color="success"
                  startIcon={<WhatsApp />}
                  onClick={() => setShowWhatsappFlow(true)}
                >
                  Continue with WhatsApp
                </Button>
              ) : (
                <Stack spacing={2} sx={{ textAlign: 'left' }}>
                  <Button
                    variant="text"
                    size="small"
                    startIcon={<ArrowBack />}
                    onClick={() => {
                      setShowWhatsappFlow(false);
                      setWhatsappStep('phone');
                      setWhatsappError(null);
                      setWhatsappMessage(null);
                    }}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Back
                  </Button>

                  <TextField
                    label="Phone number with country code"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    helperText="Enter a number like +919876543210"
                    fullWidth
                  />

                  {whatsappStep === 'otp' && (
                    <TextField
                      label="OTP"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="123456"
                      inputProps={{ inputMode: 'numeric', maxLength: 6 }}
                      fullWidth
                    />
                  )}

                  <Box sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}>
                    {whatsappStep === 'phone' ? (
                      <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        startIcon={<WhatsApp />}
                        onClick={handleRequestOtp}
                        disabled={requestingOtp}
                      >
                        {requestingOtp ? 'Sending OTP…' : 'Send OTP'}
                      </Button>
                    ) : (
                      <Button
                        fullWidth
                        variant="outlined"
                        onClick={() => {
                          if (resendSeconds > 0) return;
                          setWhatsappStep('phone');
                          handleRequestOtp();
                        }}
                        disabled={requestingOtp || resendSeconds > 0}
                        startIcon={<Refresh />}
                      >
                        {resendSeconds > 0 ? `Resend in ${resendSeconds}s` : 'Resend OTP'}
                      </Button>
                    )}

                    {whatsappStep === 'otp' && (
                      <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        onClick={handleVerifyOtp}
                        disabled={verifyingOtp}
                      >
                        {verifyingOtp ? 'Verifying…' : 'Verify OTP'}
                      </Button>
                    )}
                  </Box>
                </Stack>
              )}
            </Box>
          )}

          {config.devLogin.enabled && !googleBusy && (
            <Box sx={{ mt: 1, mb: 2 }}>
              <Divider sx={{ mb: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Developer Quick Login
                </Typography>
              </Divider>
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  color="primary"
                  startIcon={<AdminPanelSettings />}
                  onClick={() => handleDevLogin(config.devLogin.adminEmail, 'Dev Admin')}
                >
                  Login as Admin
                </Button>
                <Button
                  fullWidth
                  variant="outlined"
                  color="secondary"
                  startIcon={<Person />}
                  onClick={() => handleDevLogin(config.devLogin.userEmail, 'Dev User')}
                >
                  Login as User
                </Button>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                Visible only on localhost. Configure with VITE_DEV_ADMIN_EMAIL / VITE_DEV_USER_EMAIL.
              </Typography>
            </Box>
          )}

          <Box sx={{ mt: 4 }}>
            <Typography variant="body2" color="text.secondary">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Typography>
          </Box>
        </Card>
      </GoogleOAuthProvider>
    </Container>
  );
};

export default LoginPage;
