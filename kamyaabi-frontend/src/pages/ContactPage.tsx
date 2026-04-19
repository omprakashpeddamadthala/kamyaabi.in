import React from 'react';
import { Box, Container, Typography, Grid, TextField, Button } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { SUPPORT_EMAIL } from '../config/brand';

const ContactPage: React.FC = () => {
  return (
    <Box>
      {/* Hero */}
      <Box sx={{ bgcolor: '#f0ede6', py: { xs: 6, md: 10 }, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}>Contact Us</Typography>
          <Typography variant="h3" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, mt: 1 }}>
            Get In Touch
          </Typography>
          <Typography variant="body1" sx={{ color: '#666', mt: 2, maxWidth: 600, mx: 'auto' }}>
            Have questions about our products? We would love to hear from you. Send us a message and we will respond as soon as possible.
          </Typography>
        </Container>
      </Box>

      {/* Contact Info + Form */}
      <Box sx={{ py: 8, bgcolor: '#fff' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6}>
            <Grid item xs={12} md={5}>
              <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, mb: 4 }}>
                Contact Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <PhoneIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Phone</Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>+91 8985858888</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <EmailIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Email</Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>{SUPPORT_EMAIL}</Typography>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LocationOnIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>WhatsApp</Typography>
                    <Typography variant="body2" sx={{ color: '#666' }}>+91 8985858888</Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={7}>
              <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, mb: 2 }}>
                Send Us A Message
              </Typography>
              <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
                Please fill out the form below and one of our specialists will back in touch shortly.
              </Typography>
              <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField multiline rows={4} placeholder="Message" variant="outlined" fullWidth />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField placeholder="Name" variant="outlined" fullWidth />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField placeholder="Email Address" type="email" variant="outlined" fullWidth />
                  </Grid>
                </Grid>
                <TextField placeholder="Subject" variant="outlined" fullWidth />
                <Button type="button" variant="contained" size="large" sx={{ bgcolor: 'primary.main', color: '#fff', py: 1.5, fontWeight: 700, '&:hover': { bgcolor: 'primary.dark' }, alignSelf: 'flex-start', px: 6 }}>
                  Send Message
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default ContactPage;
