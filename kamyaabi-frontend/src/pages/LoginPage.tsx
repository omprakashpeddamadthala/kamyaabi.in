import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  Typography,
  Box,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { googleLogin } from '../features/auth/authSlice';
import { config } from '../config';
import { logger } from '../utils/logger';

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
        return 'Your session has expired after 4 hours of inactivity. Please sign in again.';
      }
      return null;
    }
  );

  const clientId = config.googleClientId;

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

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <GoogleOAuthProvider clientId={clientId}>
        <Card sx={{ p: 4, textAlign: 'center', '&:hover': { transform: 'none' } }}>
          <Typography
            variant="h3"
            sx={{
              fontFamily: '"Playfair Display", serif',
              color: 'primary.main',
              mb: 1,
            }}
          >
            KAMYAABI
          </Typography>
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

          {!clientId && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              Google Client ID is missing in the environment variables.
            </Alert>
          )}

          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            {(loading || loginAttempted) ? (
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
