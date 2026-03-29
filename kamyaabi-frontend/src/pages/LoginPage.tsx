import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Card,
  Typography,
  Box,
  Divider,
  Alert,
} from '@mui/material';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { googleLogin } from '../features/auth/authSlice';

const LoginPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { error } = useAppSelector((state) => state.auth);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

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
            <GoogleLogin
              onSuccess={(credentialResponse) => {
                if (credentialResponse.credential) {
                  dispatch(
                    googleLogin({
                      idToken: credentialResponse.credential,
                    })
                  ).then((result) => {
                    if (googleLogin.fulfilled.match(result)) {
                      navigate('/');
                    }
                  });
                }
              }}
              onError={() => {
                console.error('Login Failed');
              }}
              useOneTap
            />
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
