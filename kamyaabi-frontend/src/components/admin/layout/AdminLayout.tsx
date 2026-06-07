import React, { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Drawer,
  Breadcrumbs,
  Link as MuiLink,
  Typography,
  Avatar,
  Badge,
  Tooltip,
  Paper,
  MenuItem,
  ListItemIcon,
  Divider,
  Popover,
  List,
  ListItem,
  ListItemText,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  MenuOpen as MenuOpenIcon,
  ChevronRight as ChevronRightIcon,
  NotificationsNoneOutlined,
  Logout,
  StorefrontOutlined,
  WarningAmberOutlined,
} from '@mui/icons-material';
import { useAppSelector, useAppDispatch } from '../../../hooks/useAppDispatch';
import { logout } from '../../../features/auth/authSlice';
import { adminApi } from '../../../api/adminApi';
import AdminSidebar from './AdminSidebar';
import { buildAdminBreadcrumbs } from './adminNav';

const DRAWER_WIDTH = 248;
const DRAWER_WIDTH_COLLAPSED = 72;

const AdminLayout: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const { user } = useAppSelector((state) => state.auth);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const [menuOpen, setMenuOpen] = useState(false);
  const avatarWrapRef = useRef<HTMLDivElement>(null);

  const [notifAnchor, setNotifAnchor] = useState<HTMLElement | null>(null);
  const [lowStockCount, setLowStockCount] = useState(0);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.search]);

  // Surface existing low-stock data (dashboard endpoint) in the top bar.
  useEffect(() => {
    let active = true;
    adminApi
      .getDashboardStats()
      .then((res) => {
        if (active) setLowStockCount(res.data.data?.lowStockCount ?? 0);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handler = (event: MouseEvent) => {
      const wrap = avatarWrapRef.current;
      if (wrap && !wrap.contains(event.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleLogout = () => {
    dispatch(logout());
    setMenuOpen(false);
    navigate('/');
  };

  const sidebarWidth = collapsed ? DRAWER_WIDTH_COLLAPSED : DRAWER_WIDTH;
  const crumbs = buildAdminBreadcrumbs(location.pathname);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'var(--color-surface-bg)' }}>
      {/* Desktop: permanent (collapsible) sidebar */}
      {!isMobile && (
        <Box
          component="aside"
          sx={{
            width: sidebarWidth,
            flexShrink: 0,
            transition: theme.transitions.create('width', { duration: theme.transitions.duration.shorter }),
          }}
        >
          <Box
            sx={{
              position: 'fixed',
              top: 0,
              left: 0,
              bottom: 0,
              width: sidebarWidth,
              borderRight: '1px solid',
              borderColor: 'divider',
              transition: theme.transitions.create('width', { duration: theme.transitions.duration.shorter }),
              zIndex: theme.zIndex.appBar - 1,
            }}
          >
            <AdminSidebar collapsed={collapsed} />
          </Box>
        </Box>
      )}

      {/* Mobile: off-canvas overlay drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}
        >
          <AdminSidebar collapsed={false} onNavigate={() => setMobileOpen(false)} />
        </Drawer>
      )}

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{ bgcolor: 'var(--color-surface-card)', color: 'var(--color-text-primary)', borderBottom: '1px solid rgba(108,71,255,0.08)' }}
        >
          <Toolbar sx={{ gap: 1, minHeight: { xs: 56, md: 64 } }}>
            <IconButton
              edge="start"
              onClick={() => (isMobile ? setMobileOpen(true) : setCollapsed((c) => !c))}
              aria-label={isMobile ? 'Open navigation menu' : 'Toggle sidebar'}
              aria-expanded={isMobile ? mobileOpen : !collapsed}
            >
              {isMobile ? <MenuIcon /> : collapsed ? <MenuIcon /> : <MenuOpenIcon />}
            </IconButton>

            <Breadcrumbs
              separator={<ChevronRightIcon fontSize="small" sx={{ color: 'text.secondary' }} />}
              aria-label="Breadcrumb"
              sx={{ flex: 1, minWidth: 0, '& ol': { flexWrap: 'nowrap' } }}
            >
              {crumbs.map((c, idx) => {
                const last = idx === crumbs.length - 1;
                if (last || !c.to) {
                  return (
                    <Typography
                      key={`${c.label}-${idx}`}
                      variant="body2"
                      color={last ? 'text.primary' : 'text.secondary'}
                      sx={{ fontWeight: last ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {c.label}
                    </Typography>
                  );
                }
                return (
                  <MuiLink
                    key={`${c.label}-${idx}`}
                    component={RouterLink}
                    to={c.to}
                    underline="hover"
                    variant="body2"
                    color="text.secondary"
                    sx={{ whiteSpace: 'nowrap' }}
                  >
                    {c.label}
                  </MuiLink>
                );
              })}
            </Breadcrumbs>

            <Tooltip title="View storefront">
              <IconButton component={RouterLink} to="/" aria-label="Go to storefront" sx={{ display: { xs: 'none', sm: 'inline-flex' } }}>
                <StorefrontOutlined />
              </IconButton>
            </Tooltip>

            <Tooltip title="Notifications">
              <IconButton
                onClick={(e) => setNotifAnchor(e.currentTarget)}
                aria-label={`Notifications${lowStockCount ? `: ${lowStockCount} low stock` : ''}`}
              >
                <Badge badgeContent={lowStockCount} color="error" invisible={lowStockCount === 0} max={99}>
                  <NotificationsNoneOutlined />
                </Badge>
              </IconButton>
            </Tooltip>

            <Popover
              open={Boolean(notifAnchor)}
              anchorEl={notifAnchor}
              onClose={() => setNotifAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              slotProps={{ paper: { sx: { width: 280, maxWidth: 'calc(100vw - 24px)' } } }}
            >
              <Typography variant="subtitle2" sx={{ px: 2, py: 1.5, fontWeight: 700 }}>
                Notifications
              </Typography>
              <Divider />
              {lowStockCount > 0 ? (
                <List dense disablePadding>
                  <ListItem
                    component={RouterLink}
                    to="/admin/products"
                    onClick={() => setNotifAnchor(null)}
                    sx={{ color: 'inherit' }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <WarningAmberOutlined fontSize="small" color="warning" />
                    </ListItemIcon>
                    <ListItemText
                      primary={`${lowStockCount} product${lowStockCount === 1 ? '' : 's'} low on stock`}
                      secondary="Review inventory"
                      primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: 600 }}
                    />
                  </ListItem>
                </List>
              ) : (
                <Box sx={{ px: 2, py: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    You&apos;re all caught up.
                  </Typography>
                </Box>
              )}
            </Popover>

            <Box ref={avatarWrapRef} sx={{ position: 'relative', display: 'inline-flex' }}>
              <IconButton onClick={() => setMenuOpen((o) => !o)} aria-label="Open account menu" aria-expanded={menuOpen}>
                <Avatar src={user?.avatarUrl || undefined} alt={user?.name} sx={{ width: 32, height: 32 }}>
                  {user?.name?.charAt(0)}
                </Avatar>
              </IconButton>
              {menuOpen && (
                <Paper
                  elevation={6}
                  sx={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 8px)',
                    minWidth: 220,
                    maxWidth: 'calc(100vw - 16px)',
                    py: 0.5,
                    zIndex: (t) => t.zIndex.modal,
                  }}
                >
                  <MenuItem disabled sx={{ opacity: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                        {user?.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {user?.email}
                      </Typography>
                    </Box>
                  </MenuItem>
                  <Divider />
                  <MenuItem
                    component={RouterLink}
                    to="/"
                    onClick={() => setMenuOpen(false)}
                  >
                    <ListItemIcon>
                      <StorefrontOutlined fontSize="small" />
                    </ListItemIcon>
                    View storefront
                  </MenuItem>
                  <Divider />
                  <MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                      <Logout fontSize="small" />
                    </ListItemIcon>
                    Logout
                  </MenuItem>
                </Paper>
              )}
            </Box>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flex: 1, minWidth: 0, p: { xs: 2, sm: 3 } }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default AdminLayout;
