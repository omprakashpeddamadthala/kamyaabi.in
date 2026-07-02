/*
 * UI REDESIGN AUDIT — PRESERVED FUNCTIONALITY
 * - Preserves Navbar, Outlet, and Footer composition for all public/customer routes.
 * - Adds main landmark id for skip-to-content accessibility only.
 * - Adds safe area padding for mobile bottom navigation.
 */
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Box, useMediaQuery, useTheme } from '@mui/material';
import Navbar from './Navbar';
import Footer from './Footer';
import { useAppSelector } from '../../hooks/useAppDispatch';

const Layout: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const isHomePage = location.pathname === '/';
  const showFooter = !isMobile || isHomePage;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
      <Navbar />
      <Box 
        component="main" 
        id="main-content" 
        sx={{ 
          flex: 1, 
          width: '100%',
          pt: { xs: '60px', md: 0 },
          pb: { xs: 'calc(64px + env(safe-area-inset-bottom))', md: 0 }
        }}
      >
        <Outlet />
      </Box>
      {showFooter && <Footer />}
    </Box>
  );
};

export default Layout;

