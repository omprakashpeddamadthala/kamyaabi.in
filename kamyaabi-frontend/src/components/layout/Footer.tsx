import React from 'react';
import { Box, Container, Typography, Link as MuiLink, Grid, Divider } from '@mui/material';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{
        bgcolor: '#1A1A1A',
        color: '#FFFFFF',
        py: 6,
        mt: 'auto',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Typography
              variant="h5"
              sx={{
                fontFamily: '"Playfair Display", serif',
                fontWeight: 700,
                color: '#B8941E',
                mb: 2,
              }}
            >
              KAMYAABI
            </Typography>
            <Typography variant="body2" sx={{ color: '#AAA', lineHeight: 1.8 }}>
              Premium dry fruits sourced from the finest farms.
              Where freshness meets flavor — delivering quality
              and natural goodness in every bite.
            </Typography>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Quick Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <MuiLink component={Link} to="/" color="inherit" underline="hover" sx={{ color: '#AAA' }}>
                Home
              </MuiLink>
              <MuiLink component={Link} to="/products" color="inherit" underline="hover" sx={{ color: '#AAA' }}>
                Products
              </MuiLink>
              <MuiLink component={Link} to="/login" color="inherit" underline="hover" sx={{ color: '#AAA' }}>
                Login
              </MuiLink>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
              Contact Us
            </Typography>
            <Typography variant="body2" sx={{ color: '#AAA', mb: 1 }}>
              Email: support@kamyaabi.in
            </Typography>
            <Typography variant="body2" sx={{ color: '#AAA', mb: 1 }}>
              Phone: +91 8985858888
            </Typography>
            <Typography variant="body2" sx={{ color: '#AAA' }}>
              WhatsApp: +91 8985858888
            </Typography>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: '#333' }} />

        <Typography variant="body2" align="center" sx={{ color: '#666' }}>
          &copy; {new Date().getFullYear()} Kamyaabi. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
