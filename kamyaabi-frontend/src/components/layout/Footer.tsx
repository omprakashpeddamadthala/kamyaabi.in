import React from 'react';
import { Box, Container, Typography, Link as MuiLink, Grid, Divider } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { Link } from 'react-router-dom';
import { config } from '../../config';
import SocialLinks from '../common/SocialLinks';

const Footer: React.FC = () => {
  return (
    <Box
      component="footer"
      sx={{ bgcolor: "var(--color-surface-dark)", color: '#FFFFFF', pt: { xs: 4, sm: 6 }, pb: 3, mt: 'auto' }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={{ xs: 3, sm: 4, md: 5 }}>
          <Grid item xs={12} md={4}>
            <Box component={Link} to="/" sx={{ display: 'inline-block', mb: 2 }}>
              <Box
                component="img"
                src="/assets/img/klogo1.webp"
                alt="Kamyaabi"
                sx={{ height: { xs: 42, sm: 50 }, width: 'auto' }}
              />
            </Box>
            <Typography variant="body2" sx={{ color: 'var(--color-text-muted)', lineHeight: 1.8, maxWidth: 360 }}>
              Premium dry fruits sourced from the finest farms. Where freshness meets flavor —
              delivering quality and natural goodness in every bite.
            </Typography>

            <Typography
              variant="subtitle1"
              sx={{ mt: 3, mb: 1, fontWeight: 600 }}
            >
              Follow Us
            </Typography>
            <SocialLinks size={24} color="#BBB" />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Quick Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              <MuiLink component={Link} to="/" underline="hover" sx={{ color: 'var(--color-text-muted)' }}>
                Home
              </MuiLink>
              <MuiLink component={Link} to="/about" underline="hover" sx={{ color: 'var(--color-text-muted)' }}>
                About Us
              </MuiLink>
              <MuiLink component={Link} to="/products" underline="hover" sx={{ color: 'var(--color-text-muted)' }}>
                Products
              </MuiLink>
              <MuiLink component={Link} to="/contact" underline="hover" sx={{ color: 'var(--color-text-muted)' }}>
                Contact
              </MuiLink>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Support
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
              <MuiLink component={Link} to="/track-order" underline="hover" sx={{ color: 'var(--color-text-muted)' }}>
                Track Order
              </MuiLink>
              <MuiLink
                component={Link}
                to="/refund-policy"
                underline="hover"
                sx={{ color: 'var(--color-text-muted)' }}
              >
                Refund Policy
              </MuiLink>
              <MuiLink component={Link} to="/contact" underline="hover" sx={{ color: 'var(--color-text-muted)' }}>
                Contact Support
              </MuiLink>
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Contact Us
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, mb: 1.5 }}>
              <LocationOnIcon
                sx={{ color: 'var(--color-text-muted)', fontSize: 20, mt: '3px', flexShrink: 0 }}
                aria-hidden="true"
              />
              <Typography variant="body2" sx={{ color: 'var(--color-text-muted)', lineHeight: 1.7 }}>
                <Box component="span" sx={{ fontWeight: 700, color: '#fff', display: 'block' }}>
                  SM ENTERPRISES
                </Box>
                House No. 2-114/5, Srinivasa Nagar, Aganampudi,
                <br />
                Prasanthi Nagar, Visakhapatnam – 530053
                <br />
                Andhra Pradesh, India
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1 }}>
              <EmailIcon sx={{ color: 'var(--color-text-muted)', fontSize: 18 }} aria-hidden="true" />
              <MuiLink
                href={`mailto:${config.supportEmail}`}
                sx={{ color: 'var(--color-text-muted)', '&:hover': { color: '#fff' } }}
              >
                {config.supportEmail}
              </MuiLink>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1 }}>
              <PhoneIcon sx={{ color: 'var(--color-text-muted)', fontSize: 18 }} aria-hidden="true" />
              <MuiLink
                href={config.supportPhoneTel}
                sx={{ color: 'var(--color-text-muted)', '&:hover': { color: '#fff' } }}
              >
                {config.supportPhoneDisplay}
              </MuiLink>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
              <WhatsAppIcon sx={{ color: 'var(--color-text-muted)', fontSize: 18 }} aria-hidden="true" />
              <MuiLink
                href={config.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ color: 'var(--color-text-muted)', '&:hover': { color: '#fff' } }}
              >
                {config.supportPhoneDisplay}
              </MuiLink>
            </Box>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: '#333' }} />

        <Typography variant="body2" align="center" sx={{ color: '#777' }}>
          &copy; {new Date().getFullYear()} Kamyaabi. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
