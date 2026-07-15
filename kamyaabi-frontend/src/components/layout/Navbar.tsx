/*
 * UI REDESIGN AUDIT — PRESERVED FUNCTIONALITY
 * - Preserves all nav links, role-based Admin/Product visibility, cart badge, login/logout, account menu, social links.
 * - Adds a premium mobile Bottom Navigation bar for quick thumb-friendly access (Zepto/Blinkit style).
 * - Desktop remains a sleek, expansive header.
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
  ListItemText,
  ListItemIcon,
  Divider,
  useMediaQuery,
  useTheme,
  Typography,
  BottomNavigation,
  BottomNavigationAction,
  ListItemButton,
} from '@mui/material';
import {
  ShoppingCart,
  Menu as MenuIcon,
  Home,
  Store,
  Receipt,
  Dashboard,
  Logout,
  Info,
  ContactMail,
  Person,
  Article,
  LocalShipping,
  FavoriteBorder,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../hooks/useAppDispatch';
import { logout } from '../../features/auth/authSlice';
import { useFlyToCart } from '../common/useFlyToCart';
import SocialLinks from '../common/SocialLinks';
import { fetchWishlistProductIds } from '../../features/wishlist/wishlistSlice';

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
  const { productIds: wishlistProductIds } = useAppSelector((state) => state.wishlist);
  const { cartIconRef } = useFlyToCart();

  useEffect(() => {
    if (user) {
      dispatch(fetchWishlistProductIds());
    }
  }, [user, dispatch]);

  const [menuOpen, setMenuOpen] = useState(false);
  const [dropUp, setDropUp] = useState(false);
  const avatarWrapRef = useRef<HTMLDivElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  // Determine active bottom nav value
  let bottomNavValue = location.pathname;
  if (bottomNavValue.startsWith('/products')) bottomNavValue = '/products';
  if (bottomNavValue.startsWith('/cart')) bottomNavValue = '/cart';
  if (bottomNavValue.startsWith('/profile') || bottomNavValue.startsWith('/orders')) bottomNavValue = '/profile';

  return (
    <>
      <AppBar
        position={isMobile ? 'fixed' : 'sticky'}
        elevation={0}
        sx={{
          bgcolor: scrolled || isMobile ? 'rgba(255,255,255,0.98)' : 'var(--color-surface-card)',
          borderBottom: '1px solid var(--color-border)',
          backdropFilter: 'blur(16px)',
          boxShadow: scrolled ? 'var(--shadow-sm)' : 'none',
          transition: 'all var(--transition-normal)',
          zIndex: (t) => t.zIndex.appBar,
        }}
      >
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', minHeight: { xs: 60, md: 72 } }}>
            {isMobile && (
              <IconButton onClick={() => setDrawerOpen(true)} edge="start" aria-label="Open menu" sx={{ ml: -1 }}>
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
                transition: 'transform var(--transition-fast)',
                '&:active': { transform: 'scale(0.95)' },
              }}
            >
              <Box
                component="img"
                src="https://res.cloudinary.com/dsibez7to/image/upload/v1782551833/kamyaabi/assets/img/klogo1.webp"
                alt="Kamyaabi"
                sx={{ height: { xs: 36, md: 42 }, width: 'auto' }}
              />
            </Box>

            {!isMobile && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {navLinks.map((link) => {
                  const isActive = location.pathname === link.to || (link.to !== '/' && location.pathname.startsWith(link.to));
                  return (
                    <Button
                      key={link.to}
                      component={Link}
                      to={link.to}
                      sx={{
                        color: isActive ? 'var(--color-brand-primary)' : 'var(--color-text-primary)',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: 'var(--text-sm)',
                        px: 2.5,
                        py: 1,
                        borderRadius: 'var(--radius-full)',
                        transition: 'all var(--transition-fast)',
                        bgcolor: isActive ? 'rgba(29, 78, 216, 0.08)' : 'transparent',
                        '&:hover': {
                          bgcolor: 'rgba(29, 78, 216, 0.05)',
                        },
                      }}
                    >
                      {link.label}
                    </Button>
                  );
                })}
                {user && (
                  <Button component={Link} to="/orders" sx={{
                    color: location.pathname.startsWith('/orders') ? 'var(--color-brand-primary)' : 'var(--color-text-primary)',
                    fontWeight: location.pathname.startsWith('/orders') ? 700 : 500,
                    px: 2.5,
                    py: 1,
                    borderRadius: 'var(--radius-full)',
                    bgcolor: location.pathname.startsWith('/orders') ? 'rgba(29, 78, 216, 0.08)' : 'transparent',
                    '&:hover': { bgcolor: 'rgba(29, 78, 216, 0.05)' },
                  }}>
                    Orders
                  </Button>
                )}
                {user?.role === 'ADMIN' && (
                  <Button component={Link} to="/admin" sx={{
                    color: location.pathname.startsWith('/admin') ? 'var(--color-brand-primary)' : 'var(--color-text-primary)',
                    fontWeight: location.pathname.startsWith('/admin') ? 700 : 500,
                    px: 2.5,
                    py: 1,
                    borderRadius: 'var(--radius-full)',
                    bgcolor: location.pathname.startsWith('/admin') ? 'rgba(29, 78, 216, 0.08)' : 'transparent',
                    '&:hover': { bgcolor: 'rgba(29, 78, 216, 0.05)' },
                  }}>
                    Admin
                  </Button>
                )}
              </Box>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, md: 1.5 } }}>
              {!isMobile && (
                <SocialLinks size={22} color="var(--color-text-secondary)" gap={0.5} sx={{ mr: 1 }} />
              )}
              {!isMobile && user && (
                <IconButton component={Link} to="/wishlist" color="inherit" aria-label="Wishlist">
                  <Badge
                    badgeContent={wishlistProductIds.length}
                    color="primary"
                    invisible={wishlistProductIds.length === 0}
                  >
                    <FavoriteBorder sx={{ color: 'var(--color-text-primary)' }} />
                  </Badge>
                </IconButton>
              )}
              {!isMobile && user && (
                <Box ref={cartIconRef} sx={{ display: 'inline-flex' }}>
                  <IconButton component={Link} to="/cart" color="inherit" aria-label="Cart">
                    <Badge
                      badgeContent={cartItemCount}
                      color="primary"
                      invisible={cartItemCount === 0}
                      sx={{
                        '& .MuiBadge-badge': {
                          bgcolor: 'var(--color-brand-accent)',
                          color: '#fff',
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
                  <IconButton onClick={handleMenuOpen} aria-label="Open account menu" sx={{ p: 0.5 }}>
                    <Avatar
                      src={user.avatarUrl || undefined}
                      alt={user.name}
                      sx={{
                        width: { xs: 32, md: 38 },
                        height: { xs: 32, md: 38 },
                        bgcolor: 'var(--color-surface-hover)',
                        color: 'var(--color-brand-primary)',
                        border: '2px solid transparent',
                        transition: 'border-color var(--transition-fast)',
                        ...(menuOpen && { borderColor: 'var(--color-brand-primary)' }),
                        fontWeight: 700,
                        fontSize: 'var(--text-sm)',
                      }}
                    >
                      {user.name.charAt(0)}
                    </Avatar>
                  </IconButton>
                  {menuOpen && (
                    <Paper
                      elevation={8}
                      className="kamyaabi-fade-up"
                      sx={{
                        position: 'absolute',
                        right: 0,
                        ...(dropUp
                          ? { bottom: 'calc(100% + 8px)' }
                          : { top: 'calc(100% + 8px)' }),
                        minWidth: 240,
                        maxWidth: 'calc(100vw - 16px)',
                        py: 1,
                        zIndex: (t) => t.zIndex.modal,
                        borderRadius: 'var(--radius-lg)',
                        boxShadow: 'var(--shadow-modal)',
                        border: '1px solid var(--color-border)',
                      }}
                    >
                      <Box sx={{ px: 2, py: 1.5 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'var(--color-text-primary)' }} noWrap>{user.name}</Typography>
                        <Typography variant="caption" sx={{ color: 'var(--color-text-secondary)' }} noWrap>{user.email}</Typography>
                      </Box>
                      <Divider sx={{ mb: 1 }} />
                      
                      {isMobile && (
                        <MenuItem onClick={() => { handleMenuClose(); navigate('/wishlist'); }} sx={{ py: 1.5 }}>
                          <ListItemIcon><FavoriteBorder fontSize="small" sx={{ color: 'var(--color-text-primary)' }} /></ListItemIcon>
                          <ListItemText primary="My Wishlist" primaryTypographyProps={{ fontWeight: 600 }} />
                        </MenuItem>
                      )}
                      
                      <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }} sx={{ py: 1.5 }}>
                        <ListItemIcon><Person fontSize="small" sx={{ color: 'var(--color-text-primary)' }} /></ListItemIcon>
                        <ListItemText primary="My Profile" primaryTypographyProps={{ fontWeight: 600 }} />
                      </MenuItem>
                      <MenuItem onClick={() => { handleMenuClose(); navigate('/orders'); }} sx={{ py: 1.5 }}>
                        <ListItemIcon><Receipt fontSize="small" sx={{ color: 'var(--color-text-primary)' }} /></ListItemIcon>
                        <ListItemText primary="My Orders" primaryTypographyProps={{ fontWeight: 600 }} />
                      </MenuItem>
                      {user.role === 'ADMIN' && (
                        <MenuItem onClick={() => { handleMenuClose(); navigate('/admin'); }} sx={{ py: 1.5 }}>
                          <ListItemIcon><Dashboard fontSize="small" sx={{ color: 'var(--color-brand-primary)' }} /></ListItemIcon>
                          <ListItemText primary="Admin Panel" primaryTypographyProps={{ fontWeight: 700, color: 'var(--color-brand-primary)' }} />
                        </MenuItem>
                      )}
                      <Divider sx={{ my: 1 }} />
                      <MenuItem onClick={handleLogout} sx={{ py: 1.5, color: 'var(--color-error)' }}>
                        <ListItemIcon><Logout fontSize="small" sx={{ color: 'inherit' }} /></ListItemIcon>
                        <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 600 }} />
                      </MenuItem>
                    </Paper>
                  )}
                </Box>
              ) : (
                <Button
                  component={Link}
                  to="/login"
                  variant="contained"
                  size={isMobile ? "small" : "medium"}
                  sx={{
                    bgcolor: 'var(--color-brand-primary)',
                    color: '#fff',
                    borderRadius: 'var(--radius-full)',
                    px: { xs: 2, md: 3 },
                    fontWeight: 700,
                    textTransform: 'none',
                    boxShadow: '0 4px 12px rgba(29, 78, 216, 0.2)',
                    '&:hover': { bgcolor: 'var(--color-brand-primary-dark)', boxShadow: '0 6px 16px rgba(29, 78, 216, 0.3)' },
                  }}
                >
                  Sign In
                </Button>
              )}
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Drawer (Left Menu) */}
      <Drawer 
        open={drawerOpen} 
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: { width: 280, borderTopRightRadius: 'var(--radius-xl)', borderBottomRightRadius: 'var(--radius-xl)' }
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <img src="https://res.cloudinary.com/dsibez7to/image/upload/v1782551833/kamyaabi/assets/img/klogo1.webp" alt="Kamyaabi" style={{ height: 42 }} />
          </Box>
          <Divider />
          <List sx={{ flex: 1, px: 2, py: 2 }}>
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to || (link.to !== '/' && location.pathname.startsWith(link.to));
              return (
                <ListItemButton
                  key={link.to}
                  onClick={() => { setDrawerOpen(false); navigate(link.to); }}
                  sx={{ 
                    cursor: 'pointer', 
                    borderRadius: 'var(--radius-md)', 
                    mb: 1,
                    bgcolor: isActive ? 'rgba(29, 78, 216, 0.08)' : 'transparent',
                    color: isActive ? 'var(--color-brand-primary)' : 'var(--color-text-primary)',
                  }}
                >
                  <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>{drawerIcons[link.to]}</ListItemIcon>
                  <ListItemText primary={link.label} primaryTypographyProps={{ fontWeight: isActive ? 700 : 600 }} />
                </ListItemButton>
              );
            })}
            
            <Divider sx={{ my: 2 }} />
            
            <ListItemButton
              onClick={() => { setDrawerOpen(false); navigate('/track-order'); }}
              sx={{ cursor: 'pointer', borderRadius: 'var(--radius-md)', mb: 1, color: 'var(--color-text-primary)' }}
            >
              <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><LocalShipping /></ListItemIcon>
              <ListItemText primary="Track Order" primaryTypographyProps={{ fontWeight: 600 }} />
            </ListItemButton>

            {user?.role === 'ADMIN' && (
              <ListItemButton
                onClick={() => { setDrawerOpen(false); navigate('/admin'); }}
                sx={{ cursor: 'pointer', borderRadius: 'var(--radius-md)', mb: 1, color: 'var(--color-brand-primary)' }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}><Dashboard /></ListItemIcon>
                <ListItemText primary="Admin Panel" primaryTypographyProps={{ fontWeight: 700 }} />
              </ListItemButton>
            )}
          </List>
          
          <Box sx={{ p: 3, bgcolor: 'var(--color-surface-hover)' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'var(--color-text-primary)' }}>
              Follow Us
            </Typography>
            <SocialLinks size={24} color="var(--color-brand-primary)" />
          </Box>
        </Box>
      </Drawer>

      {/* Mobile Bottom Navigation (Zepto/Blinkit Style) */}
      {isMobile && (
        <Paper 
          elevation={0}
          sx={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            zIndex: (t) => t.zIndex.appBar,
            boxShadow: 'var(--shadow-sticky)',
            borderTop: '1px solid var(--color-border)',
            pb: 'env(safe-area-inset-bottom)' // iOS safe area
          }}
        >
          <BottomNavigation
            value={bottomNavValue}
            onChange={(event, newValue) => {
              navigate(newValue);
            }}
            showLabels
            sx={{
              height: 64,
              bgcolor: '#ffffff',
              '& .MuiBottomNavigationAction-root': {
                minWidth: 'auto',
                padding: '6px 0 8px',
                color: 'var(--color-text-muted)',
              },
              '& .Mui-selected': {
                color: 'var(--color-brand-primary)',
              },
              '& .MuiBottomNavigationAction-label': {
                fontSize: '0.65rem',
                fontWeight: 600,
                mt: 0.5,
              },
              '& .Mui-selected .MuiBottomNavigationAction-label': {
                fontSize: '0.7rem',
                fontWeight: 700,
              },
            }}
          >
            <BottomNavigationAction 
              label="Home" 
              value="/" 
              icon={<Home />} 
            />
            <BottomNavigationAction 
              label="Shop" 
              value="/products" 
              icon={<Store />} 
            />
            <BottomNavigationAction 
              label="Cart" 
              value="/cart" 
              icon={
                <Badge badgeContent={cartItemCount} sx={{
                  '& .MuiBadge-badge': {
                    bgcolor: 'var(--color-brand-accent)',
                    color: '#fff',
                    fontWeight: 700,
                  }
                }}>
                  <ShoppingCart />
                </Badge>
              } 
            />
            <BottomNavigationAction 
              label={user ? 'Profile' : 'Sign In'}
              value={user ? '/profile' : '/login'} 
              icon={<Person />} 
            />
          </BottomNavigation>
        </Paper>
      )}
    </>
  );
};

export default Navbar;
