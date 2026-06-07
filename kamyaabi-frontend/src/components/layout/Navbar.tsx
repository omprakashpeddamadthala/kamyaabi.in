/**
 * AUDIT: Preserves all existing navigation links, user role checks (ADMIN/USER),
 * cart badge count, login/logout, mobile drawer, and social links.
 * Visual-only changes: new color tokens, typography, sticky header style.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Button,
  IconButton,
  Badge,
  Box,
  MenuItem,
  Paper,
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
  ContactMail,
  Person,
  Article,
  LocalShipping,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../hooks/useAppDispatch';
import { logout } from '../../features/auth/authSlice';
import { useFlyToCart } from '../common/FlyToCartAnimation';
import SocialLinks from '../common/SocialLinks';

const navLinks = [
  { label: 'Home', to: '/' },
  { label: 'About Us', to: '/about' },
  { label: 'Products', to: '/products' },
  { label: 'Blog', to: '/blog' },
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
  const { cartIconRef } = useFlyToCart();

  const [menuOpen, setMenuOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const avatarWrapRef = useRef<HTMLDivElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleMenuOpen = () => {
    const el = avatarWrapRef.current;
    if (el) {
      const rect = el.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setDropUp(spaceBelow < 260 && rect.top > 260);
    }
    setMenuOpen(true);
  };

  const handleMenuClose = () => {
    setMenuOpen(false);
  };

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (event: MouseEvent) => {
      const wrap = avatarWrapRef.current;
      if (wrap && !wrap.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleLogout = () => {
    dispatch(logout());
    handleMenuClose();
    navigate('/');
  };

  const cartItemCount = cart?.totalItems || 0;

  const drawerIcons: Record<string, React.ReactNode> = {
    '/': <Home />,
    '/about': <Info />,
    '/products': <Store />,
    '/blog': <Article />,
    '/contact': <ContactMail />,
  };

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'var(--color-surface-card)',
        borderBottom: '1px solid rgba(108,71,255,0.08)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between', minHeight: { xs: 64, md: 72 } }}>
          {isMobile && (
            <IconButton onClick={() => setDrawerOpen(true)} edge="start" aria-label="Open menu">
              <MenuIcon sx={{ color: 'var(--color-text-primary)' }} />
            </IconButton>
          )}

          <Box
            component={Link}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <Box
              component="img"
              src="/assets/img/klogo1.webp"
              alt="Kamyaabi"
              sx={{ height: { xs: 36, sm: 42, md: 50 }, width: 'auto' }}
            />
          </Box>

          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
              {navLinks
                .filter((link) => !(user?.role === 'ADMIN' && link.to === '/products'))
                .map((link) => (
                <Button
                  key={link.to}
                  component={Link}
                  to={link.to}
                  sx={{
                    color: location.pathname === link.to ? 'var(--color-brand-primary)' : 'var(--color-text-primary)',
                    fontWeight: location.pathname === link.to ? 700 : 500,
                    fontSize: '0.9rem',
                    px: 1.5,
                    py: 1,
                    borderRadius: 'var(--radius-sm)',
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 4,
                      left: '50%',
                      transform: location.pathname === link.to ? 'translateX(-50%) scaleX(1)' : 'translateX(-50%) scaleX(0)',
                      width: '60%',
                      height: 2,
                      bgcolor: 'var(--color-brand-primary)',
                      borderRadius: 1,
                      transition: 'var(--transition-base)',
                    },
                    '&:hover': {
                      color: 'var(--color-brand-primary)',
                      bgcolor: 'rgba(108,71,255,0.04)',
                    },
                    '&:hover::after': { transform: 'translateX(-50%) scaleX(1)' },
                  }}
                >
                  {link.label}
                </Button>
              ))}
              {user && user.role !== 'ADMIN' && (
                <Button component={Link} to="/orders" sx={{
                  color: location.pathname === '/orders' ? 'var(--color-brand-primary)' : 'var(--color-text-primary)',
                  fontWeight: location.pathname === '/orders' ? 700 : 500,
                  fontSize: '0.9rem',
                  px: 1.5,
                  py: 1,
                  borderRadius: 'var(--radius-sm)',
                  '&:hover': { color: 'var(--color-brand-primary)', bgcolor: 'rgba(108,71,255,0.04)' },
                }}>
                  Orders
                </Button>
              )}
              {user?.role === 'ADMIN' && (
                <Button component={Link} to="/admin" sx={{
                  color: location.pathname === '/admin' ? 'var(--color-brand-primary)' : 'var(--color-text-primary)',
                  fontWeight: location.pathname === '/admin' ? 700 : 500,
                  fontSize: '0.9rem',
                  px: 1.5,
                  py: 1,
                  borderRadius: 'var(--radius-sm)',
                  '&:hover': { color: 'var(--color-brand-primary)', bgcolor: 'rgba(108,71,255,0.04)' },
                }}>
                  Admin
                </Button>
              )}
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {!isMobile && (
              <SocialLinks size={22} color="var(--color-text-secondary)" gap={0.25} sx={{ mr: 0.5 }} />
            )}
            {user && user.role !== 'ADMIN' && (
              <Box ref={cartIconRef} sx={{ display: 'inline-flex' }}>
                <IconButton component={Link} to="/cart" color="inherit" aria-label="Cart">
                  <Badge
                    badgeContent={cartItemCount}
                    color="primary"
                    invisible={cartItemCount === 0}
                    sx={{
                      '& .MuiBadge-badge': {
                        bgcolor: 'var(--color-brand-primary)',
                        color: '#fff',
                        fontWeight: 700,
                        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      },
                    }}
                  >
                    <ShoppingCart sx={{ color: 'var(--color-text-primary)' }} />
                  </Badge>
                </IconButton>
              </Box>
            )}

            {user ? (
              <Box ref={avatarWrapRef} sx={{ position: 'relative', display: 'inline-flex' }}>
                <IconButton onClick={handleMenuOpen} aria-label="Open account menu">
                  <Avatar
                    src={user.avatarUrl || undefined}
                    alt={user.name}
                    sx={{
                      width: 34,
                      height: 34,
                      border: '2px solid var(--color-brand-primary)',
                      fontSize: '0.85rem',
                    }}
                  >
                    {user.name.charAt(0)}
                  </Avatar>
                </IconButton>
                {menuOpen && (
                  <Paper
                    elevation={8}
                    sx={{
                      position: 'absolute',
                      right: 0,
                      ...(dropUp
                        ? { bottom: 'calc(100% + 8px)' }
                        : { top: 'calc(100% + 8px)' }),
                      minWidth: 220,
                      maxWidth: 'calc(100vw - 16px)',
                      py: 0.5,
                      zIndex: (t) => t.zIndex.modal,
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-modal)',
                    }}
                  >
                    <MenuItem disabled sx={{ opacity: 1 }}>
                      <Typography variant="body2" color="text.secondary" noWrap>{user.name}</Typography>
                    </MenuItem>
                    <Divider />
                    {user.role !== 'ADMIN' && (
                      <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }}>
                        <ListItemIcon><Person fontSize="small" /></ListItemIcon>
                        My Profile
                      </MenuItem>
                    )}
                    {user.role !== 'ADMIN' && (
                      <MenuItem onClick={() => { handleMenuClose(); navigate('/orders'); }}>
                        <ListItemIcon><Receipt fontSize="small" /></ListItemIcon>
                        My Orders
                      </MenuItem>
                    )}
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
                  </Paper>
                )}
              </Box>
            ) : (
              <Button
                component={Link}
                to="/login"
                variant="contained"
                size="small"
                startIcon={<Login />}
                sx={{
                  bgcolor: 'var(--color-brand-primary)',
                  color: '#fff',
                  borderRadius: 'var(--radius-full)',
                  px: 2.5,
                  fontWeight: 600,
                  textTransform: 'none',
                  boxShadow: 'none',
                  '&:hover': { bgcolor: '#5835cc', boxShadow: 'var(--shadow-hover)' },
                }}
              >
                Sign In
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 260 }} onClick={() => setDrawerOpen(false)}>
          <Box sx={{ p: 2 }}>
            <img src="/assets/img/klogo1.webp" alt="Kamyaabi" style={{ height: 40 }} />
          </Box>
          <Divider />
          <List>
            {navLinks
              .filter((link) => !(user?.role === 'ADMIN' && link.to === '/products'))
              .map((link) => (
              <ListItem key={link.to} component={Link} to={link.to}>
                <ListItemIcon>{drawerIcons[link.to]}</ListItemIcon>
                <ListItemText primary={link.label} />
              </ListItem>
            ))}
            <ListItem component={Link} to="/track-order">
              <ListItemIcon><LocalShipping /></ListItemIcon>
              <ListItemText primary="Track Order" />
            </ListItem>
            {user && user.role !== 'ADMIN' && (
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
          <Divider />
          <Box sx={{ p: 2 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: 'var(--color-text-primary)' }}>
              Follow Us
            </Typography>
            <SocialLinks size={22} color="var(--color-text-secondary)" />
          </Box>
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default Navbar;
