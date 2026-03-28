import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  Typography,
  Button,
  Box,
  Divider,
  Alert,
} from '@mui/material';
import { Google, AdminPanelSettings } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { googleLogin } from '../features/auth/authSlice';

const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading, error } = useAppSelector((state) => state.auth);

  const isDev = !import.meta.env.VITE_GOOGLE_CLIENT_ID;

  const handleGoogleLogin = () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

    if (!clientId) {
      dispatch(
        googleLogin({
          email: 'demo@kamyaabi.in',
          name: 'Demo User',
          picture: '',
          sub: 'demo-google-id-123',
        })
      ).then((result) => {
        if (googleLogin.fulfilled.match(result)) {
          navigate('/');
        }
      });
      return;
    }

    const redirectUri = encodeURIComponent(window.location.origin + '/auth/callback');
    const scope = encodeURIComponent('email profile');
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline`;
    window.location.href = authUrl;
  };

  const handleAdminLogin = () => {
    dispatch(
      googleLogin({
        email: 'admin@kamyaabi.in',
        name: 'Kamyaabi Admin',
        picture: '',
        sub: 'admin-google-id',
      })
    ).then((result) => {
      if (googleLogin.fulfilled.match(result)) {
        navigate('/admin');
      }
    });
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
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

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Button
          variant="contained"
          size="large"
          fullWidth
          startIcon={<Google />}
          onClick={handleGoogleLogin}
          disabled={loading}
          sx={{
            py: 1.5,
            bgcolor: '#4285F4',
            '&:hover': { bgcolor: '#3367D6' },
          }}
        >
          {loading ? 'Signing in...' : 'Continue with Google'}
        </Button>

        {isDev && (
          <>
            <Divider sx={{ my: 3 }}>
              <Typography variant="body2" color="text.secondary">Dev Mode</Typography>
            </Divider>
            <Button
              variant="outlined"
              size="large"
              fullWidth
              startIcon={<AdminPanelSettings />}
              onClick={handleAdminLogin}
              disabled={loading}
              sx={{
                py: 1.5,
                borderColor: 'primary.main',
                color: 'primary.main',
                '&:hover': { bgcolor: 'primary.main', color: '#fff' },
              }}
            >
              Login as Admin
            </Button>
          </>
        )}

        <Box sx={{ mt: 4 }}>
          <Typography variant="body2" color="text.secondary">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Typography>
        </Box>
      </Card>
    </Container>
  );
};

export default LoginPage;
