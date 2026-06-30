/*
 * UI REDESIGN AUDIT — PRESERVED FUNCTIONALITY
 * - Preserves all footer links, contact details, WhatsApp link, and social links.
 * - Visual-only tokenization of dark surface, muted text, spacing, and responsive layout.
 */
import React from 'react';
import { Box, Container, Typography, Link as MuiLink, Grid, Divider, Stack } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';

import { Link } from 'react-router-dom';
import { config } from '../../config';
import SocialLinks from '../common/SocialLinks';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{ 
        bgcolor: 'var(--color-surface-dark)', 
        color: '#f9fafb', 
        pt: { xs: 6, md: 8 }, 
        pb: { xs: 4, md: 4 }, 
        mt: 'auto',
        borderTop: '1px solid var(--color-border)',
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 5, md: 8 }}>
          {/* Brand Column */}
          <Grid item xs={12} md={4}>
            <Box component={Link} to="/" sx={{ display: 'inline-block', mb: 3, transition: 'transform 0.2s', '&:hover': { transform: 'scale(1.02)' } }}>
              <Box
                component="img"
                src="https://res.cloudinary.com/dsibez7to/image/upload/v1782551833/kamyaabi/assets/img/klogo1.webp"
                alt="Kamyaabi"
                sx={{ height: 40, width: 'auto', filter: 'brightness(0) invert(1)' }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: '#9ca3af', lineHeight: 1.8, maxWidth: 360, mb: 4, fontSize: '0.9rem' }}>
              Premium dry fruits sourced from the finest farms. Where freshness meets flavor —
              delivering quality and natural goodness in every bite.
            </Typography>

            <Typography
              variant="subtitle2"
              sx={{ mb: 2, fontWeight: 700, color: '#e5e7eb', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.75rem' }}
            >
              Follow Us
            </Typography>
            <SocialLinks size={22} color="#9ca3af" />
          </Grid>

          {/* Quick Links */}
          <Grid item xs={6} sm={4} md={2}>
            <Typography variant="subtitle2" sx={{ mb: 3, fontWeight: 700, color: '#e5e7eb', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.75rem' }}>
              Company
            </Typography>
            <Stack spacing={2}>
              <MuiLink component={Link} to="/" underline="none" sx={{ color: '#9ca3af', fontSize: '0.9rem', transition: 'color 0.2s', '&:hover': { color: 'var(--color-brand-primary)' } }}>
                Home
              </MuiLink>
              <MuiLink component={Link} to="/about" underline="none" sx={{ color: '#9ca3af', fontSize: '0.9rem', transition: 'color 0.2s', '&:hover': { color: 'var(--color-brand-primary)' } }}>
                About Us
              </MuiLink>
              <MuiLink component={Link} to="/products" underline="none" sx={{ color: '#9ca3af', fontSize: '0.9rem', transition: 'color 0.2s', '&:hover': { color: 'var(--color-brand-primary)' } }}>
                Shop
              </MuiLink>
              <MuiLink component={Link} to="/blog" underline="none" sx={{ color: '#9ca3af', fontSize: '0.9rem', transition: 'color 0.2s', '&:hover': { color: 'var(--color-brand-primary)' } }}>
                Blogs
              </MuiLink>
            </Stack>
          </Grid>

          {/* Support */}
          <Grid item xs={6} sm={4} md={2}>
            <Typography variant="subtitle2" sx={{ mb: 3, fontWeight: 700, color: '#e5e7eb', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.75rem' }}>
              Support
            </Typography>
            <Stack spacing={2}>
              <MuiLink component={Link} to="/contact" underline="none" sx={{ color: '#9ca3af', fontSize: '0.9rem', transition: 'color 0.2s', '&:hover': { color: 'var(--color-brand-primary)' } }}>
                Contact Us
              </MuiLink>
              <MuiLink component={Link} to="/track-order" underline="none" sx={{ color: '#9ca3af', fontSize: '0.9rem', transition: 'color 0.2s', '&:hover': { color: 'var(--color-brand-primary)' } }}>
                Track Order
              </MuiLink>
              <MuiLink component={Link} to="/refund-policy" underline="none" sx={{ color: '#9ca3af', fontSize: '0.9rem', transition: 'color 0.2s', '&:hover': { color: 'var(--color-brand-primary)' } }}>
                Refund Policy
              </MuiLink>
            </Stack>
          </Grid>

          {/* Contact Details */}
          <Grid item xs={12} sm={4} md={4}>
            <Typography variant="subtitle2" sx={{ mb: 3, fontWeight: 700, color: '#e5e7eb', letterSpacing: '0.05em', textTransform: 'uppercase', fontSize: '0.75rem' }}>
              Get in Touch
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 3 }}>
              <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 1, borderRadius: 'var(--radius-md)', display: 'flex', mt: -0.5 }}>
                <LocationOnIcon sx={{ color: 'var(--color-brand-primary)', fontSize: 20 }} aria-hidden="true" />
              </Box>
              <Typography variant="body2" sx={{ color: '#9ca3af', lineHeight: 1.6, fontSize: '0.9rem' }}>
                <Box component="span" sx={{ fontWeight: 600, color: '#e5e7eb', display: 'block', mb: 0.5 }}>
                  SM ENTERPRISES
                </Box>
                House No. 2-114/5, Srinivasa Nagar, Aganampudi,
                <br />
                Prasanthi Nagar, Visakhapatnam – 530053
                <br />
                Andhra Pradesh, India
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 1, borderRadius: 'var(--radius-md)', display: 'flex' }}>
                <EmailIcon sx={{ color: 'var(--color-brand-primary)', fontSize: 18 }} aria-hidden="true" />
              </Box>
              <MuiLink
                href={`mailto:${config.supportEmail}`}
                underline="none"
                sx={{ color: '#9ca3af', fontSize: '0.9rem', transition: 'color 0.2s', '&:hover': { color: 'var(--color-brand-primary)' } }}
              >
                {config.supportEmail}
              </MuiLink>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 1, borderRadius: 'var(--radius-md)', display: 'flex' }}>
                <PhoneIcon sx={{ color: 'var(--color-brand-primary)', fontSize: 18 }} aria-hidden="true" />
              </Box>
              <MuiLink
                href={config.supportPhoneTel}
                underline="none"
                sx={{ color: '#9ca3af', fontSize: '0.9rem', transition: 'color 0.2s', '&:hover': { color: 'var(--color-brand-primary)' } }}
              >
                {config.supportPhoneDisplay}
              </MuiLink>
            </Box>

          </Grid>
        </Grid>

        <Divider sx={{ mt: 6, mb: 4, borderColor: 'rgba(255,255,255,0.1)' }} />

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" sx={{ color: '#6b7280', fontSize: '0.85rem' }}>
            &copy; {new Date().getFullYear()} Kamyaabi. All rights reserved.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Box component="img" src="https://res.cloudinary.com/dsibez7to/image/upload/v1782551833/kamyaabi/assets/img/klogo1.webp" alt="Kamyaabi" sx={{ height: 20, opacity: 0.3, filter: 'grayscale(1) invert(1)' }} />
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;

