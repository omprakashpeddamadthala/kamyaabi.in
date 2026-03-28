import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
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
} from '@mui/material';
import {
  ShoppingCart,
  Person,
  Menu as MenuIcon,
  Home,
  Store,
  Receipt,
  Dashboard,
  Logout,
  Login,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../hooks/useAppDispatch';
import { logout } from '../../features/auth/authSlice';

const Navbar: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { user } = useAppSelector((state) => state.auth);
  const { cart } = useAppSelector((state) => state.cart);

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

  return (
    <AppBar position="sticky" elevation={0}>
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
          {isMobile && (
            <IconButton onClick={() => setDrawerOpen(true)} edge="start">
              <MenuIcon />
            </IconButton>
          )}

          <Typography
            variant="h5"
            component={Link}
            to="/"
            sx={{
              textDecoration: 'none',
              color: 'primary.main',
              fontFamily: '"Playfair Display", serif',
              fontWeight: 700,
              letterSpacing: 1,
            }}
          >
            KAMYAABI
          </Typography>

          {!isMobile && (
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <Button component={Link} to="/" color="inherit">Home</Button>
              <Button component={Link} to="/products" color="inherit">Products</Button>
              {user && (
                <Button component={Link} to="/orders" color="inherit">Orders</Button>
              )}
              {user?.role === 'ADMIN' && (
                <Button component={Link} to="/admin" color="inherit">Admin</Button>
              )}
            </Box>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {user && (
              <IconButton component={Link} to="/cart" color="inherit">
                <Badge badgeContent={cartItemCount} color="primary">
                  <ShoppingCart />
                </Badge>
              </IconButton>
            )}

            {user ? (
              <>
                <IconButton onClick={handleMenuOpen}>
                  <Avatar
                    src={user.avatarUrl || undefined}
                    alt={user.name}
                    sx={{ width: 32, height: 32 }}
                  >
                    {user.name.charAt(0)}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">
                      {user.name}
                    </Typography>
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
              <Button
                component={Link}
                to="/login"
                variant="contained"
                color="primary"
                startIcon={<Login />}
                size="small"
              >
                Login
              </Button>
            )}
          </Box>
        </Toolbar>
      </Container>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 250 }} onClick={() => setDrawerOpen(false)}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" color="primary" fontFamily='"Playfair Display", serif'>
              KAMYAABI
            </Typography>
          </Box>
          <Divider />
          <List>
            <ListItem component={Link} to="/">
              <ListItemIcon><Home /></ListItemIcon>
              <ListItemText primary="Home" />
            </ListItem>
            <ListItem component={Link} to="/products">
              <ListItemIcon><Store /></ListItemIcon>
              <ListItemText primary="Products" />
            </ListItem>
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
