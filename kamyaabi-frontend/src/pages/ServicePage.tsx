import React from 'react';
import { Box, Container, Typography, Grid } from '@mui/material';

const serviceItems = [
  { title: 'Premium Quality', desc: 'We handpick only the finest dry fruits from trusted farms worldwide, ensuring every product meets our high-quality standards.' },
  { title: 'Natural & Fresh', desc: 'Our products are 100% natural with no added preservatives. We ensure maximum freshness from farm to your doorstep.' },
  { title: 'Wide Variety', desc: 'From almonds and cashews to pistachios and mixed dry fruits, we offer a diverse range to satisfy every palate.' },
  { title: 'Freshly Packaged', desc: 'Advanced packaging technology keeps our dry fruits fresh, crunchy, and flavorful for longer periods.' },
  { title: 'Fast Delivery', desc: 'Quick and reliable delivery to your doorstep. We ensure your orders reach you in perfect condition.' },
  { title: 'Customer Support', desc: 'Our dedicated team is always ready to help you with any questions or concerns about our products.' },
];

const ServicePage: React.FC = () => {
  return (
    <Box>
      {/* Hero */}
      <Box sx={{ bgcolor: '#f0ede6', py: { xs: 6, md: 10 }, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}>Our Services</Typography>
          <Typography variant="h3" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, mt: 1 }}>
            Pure Freshness in Every Bite
          </Typography>
          <Typography variant="body1" sx={{ color: '#666', mt: 2, maxWidth: 600, mx: 'auto' }}>
            Our dry fruits are carefully selected for their freshness and quality, ensuring you get the best in every bite.
          </Typography>
        </Container>
      </Box>

      {/* Services Grid */}
      <Box sx={{ py: 8, bgcolor: '#fff' }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            {serviceItems.map((item, idx) => (
              <Grid item xs={12} sm={6} md={4} key={idx}>
                <Box sx={{
                  p: 4, bgcolor: '#f9f9f9', borderRadius: 3, height: '100%',
                  transition: 'transform 0.3s, box-shadow 0.3s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' },
                }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main', mb: 2, fontFamily: '"Playfair Display", serif' }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.8 }}>
                    {item.desc}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Counters */}
      <Box sx={{ py: 8, bgcolor: '#1A1A1A', color: '#fff' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700 }}>Your Gateway to Premium Dry Fruits</Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}>Meeting the Growing Demand for Premium Dry Fruits</Typography>
          </Box>
          <Grid container spacing={4} justifyContent="center">
            {[
              { icon: '/assets/img/icon/counter-icon1.webp', label: 'Premium Selection' },
              { icon: '/assets/img/icon/counter-icon2.webp', label: 'Clean, healthy, natural' },
              { icon: '/assets/img/icon/counter-icon3.webp', label: 'Curated for you' },
              { icon: '/assets/img/icon/counter-icon4.webp', label: 'Sustainably Grown' },
            ].map((item, idx) => (
              <Grid item xs={6} sm={3} key={idx}>
                <Box sx={{ textAlign: 'center' }}>
                  <Box component="img" src={item.icon} alt={item.label} sx={{ width: 60, height: 60, mb: 2 }} />
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>{item.label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </Box>
  );
};

export default ServicePage;
