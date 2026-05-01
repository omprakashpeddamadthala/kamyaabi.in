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
} from '@mui/material';
import { AdminPanelSettings, Person } from '@mui/icons-material';
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
        return 'Your session has expired. Please sign in again.';
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

          {config.devLogin.enabled && !(loading || loginAttempted) && (
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
