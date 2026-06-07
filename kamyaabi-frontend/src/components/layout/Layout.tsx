/*
 * UI REDESIGN AUDIT — PRESERVED FUNCTIONALITY
 * - Preserves Navbar, Outlet, and Footer composition for all public/customer routes.
 * - Adds main landmark id for skip-to-content accessibility only.
 */
import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout: React.FC = () => {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <Box component="main" id="main-content">
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
};

export default Layout;
