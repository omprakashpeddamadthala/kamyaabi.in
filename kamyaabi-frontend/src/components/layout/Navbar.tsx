import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Button,
  IconButton,
  Badge,
  Box,
  Menu,
  MenuItem,
  Avatar,
  Container,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  useMediaQuery,
  useTheme,
  Typography,
} from '@mui/material';
import {
  ShoppingCart,
  Menu as MenuIcon,
  Home,
  Store,
  Receipt,
  Dashboard,
  Logout,
  Login,
  Info,
  Build,
  ContactMail,
} from '@mui/icons-material';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { useAppSelector, useAppDispatch } from '../../hooks/useAppDispatch';
import { logout, googleLogin } from '../../features/auth/authSlice';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'About Us', to: '/about' },
  { label: 'Service', to: '/service' },
  { label: 'Products', to: '/products' },
  { label: 'Contact', to: '/contact' },
];

const Navbar: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const { user } = useAppSelector((state) => state.auth);
  const { cart } = useAppSelector((state) => state.cart);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    dispatch(logout());
    handleMenuClose();
    navigate('/');
  };

  const cartItemCount = cart?.totalItems || 0;

  const drawerIcons: Record<string, React.ReactNode> = {
    '/': <Home />,
    '/about': <Info />,
    '/service': <Build />,
    '/products': <Store />,
    '/contact': <ContactMail />,
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{ bgcolor: '#FFFFFF', borderBottom: '1px solid #eee' }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between', minHeight: { xs: 64, md: 72 } }}>
          {isMobile && (
            <IconButton onClick={() => setDrawerOpen(true)} edge="start">
              <MenuIcon />
            </IconButton>
          )}

          <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            <img src="/assets/img/klogo1.webp" alt="Kamyaabi" style={{ height: 50 }} />
          </Box>

          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              {navLinks.map((link) => (
                <Button
                  key={link.to}
                  component={Link}
                  to={link.to}
                  sx={{
                    color: location.pathname === link.to ? 'primary.main' : '#1A1A1A',
                    fontWeight: location.pathname === link.to ? 700 : 500,
                    fontSize: '0.95rem',
                    px: 2,
                    '&:hover': { color: 'primary.main', bgcolor: 'transparent' },
                  }}
                >
                  {link.label}
                </Button>
              ))}
              {user && (
                <Button component={Link} to="/orders" sx={{ color: '#1A1A1A', fontWeight: 500, fontSize: '0.95rem', px: 2 }}>
                  Orders
                </Button>
              )}
              {user?.role === 'ADMIN' && (
                <Button component={Link} to="/admin" sx={{ color: '#1A1A1A', fontWeight: 500, fontSize: '0.95rem', px: 2 }}>
                  Admin
                </Button>
              )}
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {user && (
              <IconButton component={Link} to="/cart" color="inherit">
                <Badge badgeContent={cartItemCount} color="primary">
                  <ShoppingCart sx={{ color: '#1A1A1A' }} />
                </Badge>
              </IconButton>
            )}

            {user ? (
              <>
                <IconButton onClick={handleMenuOpen}>
                  <Avatar src={user.avatarUrl || undefined} alt={user.name} sx={{ width: 32, height: 32 }}>
                    {user.name.charAt(0)}
                  </Avatar>
                </IconButton>
                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                  <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">{user.name}</Typography>
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={() => { handleMenuClose(); navigate('/orders'); }}>
                    <ListItemIcon><Receipt fontSize="small" /></ListItemIcon>
                    My Orders
                  </MenuItem>
                  {user.role === 'ADMIN' && (
                    <MenuItem onClick={() => { handleMenuClose(); navigate('/admin'); }}>
                      <ListItemIcon><Dashboard fontSize="small" /></ListItemIcon>
                      Admin Panel
                    </MenuItem>
                  )}
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
                    Logout
                  </MenuItem>
                </Menu>
              </>
            ) : (
              <GoogleOAuthProvider clientId={clientId}>
                <GoogleLogin
                  onSuccess={(credentialResponse) => {
                    if (credentialResponse.credential) {
                      dispatch(
                        googleLogin({
                          idToken: credentialResponse.credential,
                        })
                      );
                    }
                  }}
                  onError={() => {
                    console.error('Login Failed');
                  }}
                  type="standard"
                  theme="outline"
                  size="medium"
                  text="signin_with"
                  shape="pill"
                />
              </GoogleOAuthProvider>
            )}
          </Box>
        </Toolbar>
      </Container>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 250 }} onClick={() => setDrawerOpen(false)}>
          <Box sx={{ p: 2 }}>
            <img src="/assets/img/klogo1.webp" alt="Kamyaabi" style={{ height: 40 }} />
          </Box>
          <Divider />
          <List>
            {navLinks.map((link) => (
              <ListItem key={link.to} component={Link} to={link.to}>
                <ListItemIcon>{drawerIcons[link.to]}</ListItemIcon>
                <ListItemText primary={link.label} />
              </ListItem>
            ))}
            {user && (
              <ListItem component={Link} to="/orders">
                <ListItemIcon><Receipt /></ListItemIcon>
                <ListItemText primary="Orders" />
              </ListItem>
            )}
            {user?.role === 'ADMIN' && (
              <ListItem component={Link} to="/admin">
                <ListItemIcon><Dashboard /></ListItemIcon>
                <ListItemText primary="Admin" />
              </ListItem>
            )}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default Navbar;
