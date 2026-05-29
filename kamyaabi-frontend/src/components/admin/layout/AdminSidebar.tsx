import React from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Tooltip,
  Divider,
} from '@mui/material';
import { ADMIN_NAV, AdminNavItem } from './adminNav';

interface AdminSidebarProps {
  /** Mini (icon-only) mode on desktop. */
  collapsed: boolean;
  /** Called when a nav item is chosen (used to close the mobile drawer). */
  onNavigate?: () => void;
}

const isItemActive = (item: AdminNavItem, pathname: string, tab: string): boolean => {
  if (item.tab) {
    return pathname === '/admin' && tab === item.tab;
  }
  if (item.to === '/admin') {
    return pathname === '/admin' && tab === 'products';
  }
  if (item.to === '/admin/blog') {
    return pathname === '/admin/blog' || pathname.startsWith('/admin/blog/new') || pathname.startsWith('/admin/blog/edit');
  }
  return pathname === item.to;
};

const AdminSidebar: React.FC<AdminSidebarProps> = ({ collapsed, onNavigate }) => {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') ?? 'products';

  return (
    <Box
      component="nav"
      aria-label="Admin sections"
      sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}
    >
      <Box
        sx={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: collapsed ? 0 : 2,
          justifyContent: collapsed ? 'center' : 'flex-start',
          borderBottom: '1px solid',
          borderColor: 'divider',
          flexShrink: 0,
        }}
      >
        <Box component={Link} to="/admin" onClick={onNavigate} sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <Box component="img" src="/assets/img/klogo1.webp" alt="Kamyaabi" sx={{ height: 32, width: 'auto' }} />
          {!collapsed && (
            <Typography variant="subtitle2" sx={{ ml: 1, fontWeight: 700, color: 'primary.main' }}>
              Admin
            </Typography>
          )}
        </Box>
      </Box>

      <Box sx={{ overflowY: 'auto', overflowX: 'hidden', flex: 1, py: 1 }}>
        {ADMIN_NAV.map((section, sIdx) => (
          <React.Fragment key={section.heading}>
            {sIdx > 0 && collapsed && <Divider sx={{ my: 0.5, mx: 1 }} />}
            {!collapsed && (
              <Typography
                variant="caption"
                sx={{
                  px: 2.5,
                  pt: sIdx === 0 ? 0.5 : 1.5,
                  pb: 0.5,
                  display: 'block',
                  color: 'text.secondary',
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  fontSize: '0.65rem',
                }}
              >
                {section.heading}
              </Typography>
            )}
            <List disablePadding sx={{ px: 1 }}>
              {section.items.map((item) => {
                const active = isItemActive(item, location.pathname, currentTab);
                const Icon = item.icon;
                const button = (
                  <ListItemButton
                    component={Link}
                    to={item.to}
                    onClick={onNavigate}
                    aria-current={active ? 'page' : undefined}
                    sx={{
                      borderRadius: 2,
                      mb: 0.25,
                      minHeight: 44,
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      px: collapsed ? 1 : 1.5,
                      color: active ? 'primary.main' : 'text.primary',
                      bgcolor: active ? 'rgba(139, 105, 20, 0.10)' : 'transparent',
                      '&:hover': { bgcolor: active ? 'rgba(139, 105, 20, 0.16)' : 'rgba(0,0,0,0.04)' },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: collapsed ? 0 : 1.5,
                        justifyContent: 'center',
                        color: active ? 'primary.main' : 'text.secondary',
                      }}
                    >
                      <Icon fontSize="small" />
                    </ListItemIcon>
                    {!collapsed && (
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{ fontSize: '0.85rem', fontWeight: active ? 700 : 500 }}
                      />
                    )}
                  </ListItemButton>
                );
                return collapsed ? (
                  <Tooltip key={item.label} title={item.label} placement="right">
                    {button}
                  </Tooltip>
                ) : (
                  <React.Fragment key={item.label}>{button}</React.Fragment>
                );
              })}
            </List>
          </React.Fragment>
        ))}
      </Box>
    </Box>
  );
};

export default AdminSidebar;
