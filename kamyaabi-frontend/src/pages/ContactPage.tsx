import React from 'react';
import { Box, Container, Typography, Grid, Link as MuiLink } from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { config } from '../config';

const ContactPage: React.FC = () => {
  return (
    <Box>
      {}
      <Box sx={{ bgcolor: '#f0ede6', py: { xs: 6, md: 10 }, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography
            variant="overline"
            sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}
          >
            Contact Us
          </Typography>
          <Typography
            variant="h3"
            sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, mt: 1 }}
          >
            Get In Touch
          </Typography>
          <Typography variant="body1" sx={{ color: '#666', mt: 2, maxWidth: 600, mx: 'auto' }}>
            Have questions about our products? We would love to hear from you — reach us by phone,
            email, or WhatsApp using the details below.
          </Typography>
        </Container>
      </Box>

      {}
      <Box sx={{ py: 8, bgcolor: '#fff' }}>
        <Container maxWidth="md">
          <Grid container spacing={6}>
            <Grid item xs={12} md={6}>
              <Typography
                variant="h4"
                sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, mb: 4 }}
              >
                Visit Us
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <LocationOnIcon sx={{ color: 'primary.main', fontSize: 28, mt: '4px' }} />
                <Box>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>
                    SM ENTERPRISES
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#666', lineHeight: 1.8 }}>
                    House No. 2-114/5, Srinivasa Nagar, Aganampudi,
                    <br />
                    Prasanthi Nagar, Visakhapatnam – 530053
                    <br />
                    Andhra Pradesh, India
                  </Typography>
                </Box>
              </Box>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography
                variant="h4"
                sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, mb: 4 }}
              >
                Contact Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <PhoneIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Phone
                    </Typography>
                    <MuiLink
                      href={config.supportPhoneTel}
                      variant="body2"
                      underline="hover"
                      sx={{ color: '#666' }}
                    >
                      {config.supportPhoneDisplay}
                    </MuiLink>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <EmailIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      Email
                    </Typography>
                    <MuiLink
                      href={`mailto:${config.supportEmail}`}
                      variant="body2"
                      underline="hover"
                      sx={{ color: '#666' }}
                    >
                      {config.supportEmail}
                    </MuiLink>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <WhatsAppIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                      WhatsApp
                    </Typography>
                    <MuiLink
                      href={config.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="body2"
                      underline="hover"
                      sx={{ color: '#666' }}
                    >
                      {config.supportPhoneDisplay}
                    </MuiLink>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default ContactPage;
