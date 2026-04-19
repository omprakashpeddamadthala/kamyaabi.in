import React, { useState } from 'react';
import { Box, Container, Typography, Link as MuiLink, Grid, Divider, TextField, Button, Alert } from '@mui/material';
import { Link } from 'react-router-dom';
import { SUPPORT_EMAIL } from '../../config/brand';

const Footer: React.FC = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  const handleSubscribe = () => {
    setEmailError(null);
    setEmailSuccess(null);
    if (!email.trim()) {
      setEmailError('Please enter an email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address.');
      return;
    }
    setEmailSuccess('Thank you for subscribing!');
    setEmail('');
  };

  return (
    <Box component="footer" sx={{ bgcolor: '#1A1A1A', color: '#FFFFFF', py: 6, mt: 'auto' }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Box component={Link} to="/" sx={{ display: 'inline-block', mb: 2 }}>
              <img src="/assets/img/klogo1.webp" alt="Kamyaabi" style={{ height: 50 }} />
            </Box>
            <Typography variant="body2" sx={{ color: '#AAA', lineHeight: 1.8 }}>
              Premium dry fruits sourced from the finest farms. Where freshness meets flavor — delivering quality and natural goodness in every bite.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
              <MuiLink href="https://www.facebook.com/kamyaabi" target="_blank" sx={{ color: '#AAA', '&:hover': { color: '#fff' } }}>Facebook</MuiLink>
              <MuiLink href="https://www.instagram.com/kamyaabi" target="_blank" sx={{ color: '#AAA', '&:hover': { color: '#fff' } }}>Instagram</MuiLink>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, fontSize: '1rem' }}>Quick Links</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <MuiLink component={Link} to="/" color="inherit" underline="hover" sx={{ color: '#AAA' }}>Home</MuiLink>
              <MuiLink component={Link} to="/about" color="inherit" underline="hover" sx={{ color: '#AAA' }}>About Us</MuiLink>
              <MuiLink component={Link} to="/service" color="inherit" underline="hover" sx={{ color: '#AAA' }}>Service</MuiLink>
              <MuiLink component={Link} to="/products" color="inherit" underline="hover" sx={{ color: '#AAA' }}>Products</MuiLink>
              <MuiLink component={Link} to="/contact" color="inherit" underline="hover" sx={{ color: '#AAA' }}>Contact</MuiLink>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, fontSize: '1rem' }}>Contact Us</Typography>
            <Typography variant="body2" sx={{ color: '#AAA', mb: 1 }}>Email: {SUPPORT_EMAIL}</Typography>
            <Typography variant="body2" sx={{ color: '#AAA', mb: 1 }}>Phone: +91 8985858888</Typography>
            <Typography variant="body2" sx={{ color: '#AAA' }}>WhatsApp: +91 8985858888</Typography>
          </Grid>

          <Grid item xs={12} md={3}>
            <Typography variant="h6" sx={{ mb: 2, fontWeight: 600, fontSize: '1rem' }}>Newsletter</Typography>
            <Typography variant="body2" sx={{ color: '#AAA', mb: 2 }}>Subscribe to get updates on our latest offers.</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                placeholder="Your email"
                variant="outlined"
                size="small"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(null); setEmailSuccess(null); }}
                error={!!emailError}
                sx={{ flex: 1, '& .MuiOutlinedInput-root': { color: '#fff', '& fieldset': { borderColor: emailError ? '#f44336' : '#555' }, '&:hover fieldset': { borderColor: emailError ? '#f44336' : '#888' } } }}
              />
              <Button variant="contained" size="small" onClick={handleSubscribe} sx={{ bgcolor: 'primary.main', '&:hover': { bgcolor: 'primary.dark' } }}>Subscribe</Button>
            </Box>
            {emailError && <Typography variant="body2" sx={{ color: '#f44336', mt: 1, fontSize: '0.75rem' }}>{emailError}</Typography>}
            {emailSuccess && <Alert severity="success" sx={{ mt: 1, py: 0, '& .MuiAlert-message': { py: 0.5 } }}>{emailSuccess}</Alert>}
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: '#333' }} />

        <Typography variant="body2" align="center" sx={{ color: '#666', whiteSpace: 'nowrap' }}>
          &copy; {new Date().getFullYear()} Kamyaabi. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
