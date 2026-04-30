import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box } from '@mui/material';
import Navbar from './Navbar';
import Footer from './Footer';

const Layout: React.FC = () => {
  return (
    // No flexGrow on <main> — the footer sits directly below the last page
    // section instead of being pushed to the viewport bottom by a spacer,
    // which previously created a large empty gap on short pages like the
    // product detail screen.
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <Box component="main">
        <Outlet />
      </Box>
      <Footer />
    </Box>
  );
};

export default Layout;
