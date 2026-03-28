import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Button, TextField, Card, CardMedia,
} from '@mui/material';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchFeaturedProducts, fetchCategories } from '../features/product/productSlice';
import Loading from '../components/common/Loading';

const heroSlides = [
  { title: 'Almonds & Cashews: A Perfect Nutty Pair', desc: 'Our Premium California Almonds are handpicked for superior flavor and packed with healthy fats and protein, making them the perfect nutritious snack or recipe addition.', image: '/assets/img/hero/banner2.webp' },
  { title: 'The Ultimate Nut Trio: Pistachios, Cashews & Almonds', desc: 'Our Roasted and Salted Pistachios, Premium Split Cashews, and California Almonds offer a savory, crunchy snack packed with antioxidants and healthy fats.', image: '/assets/img/hero/banner1.webp' },
];

const productShowcase = [
  { name: 'Whole Cashews', desc: 'Creamy, Rich, Mild, Buttery, Sweet, Crisp', image: '/assets/img/product/wholecashew3.webp', bg: '#2a2a3d' },
  { name: 'Roasted, Salted Pistachios', desc: 'Savory, Crunchy, Salty, Bold, Toasted, Fresh', image: '/assets/img/product/pista1.webp', bg: '#3d3a2a' },
  { name: 'Almonds - Regular', desc: 'Rich, Nutty, Crunchy, Fresh, Earthy, Bold', image: '/assets/img/product/almond_1.webp', bg: '#2a3d2a' },
  { name: 'California Almonds - Jumbo', desc: 'Savory, Crisp, Robust, Natural, Toasted, Wholesome', image: '/assets/img/product/almond_jumbo1.webp', bg: '#2a3d3d' },
  { name: 'Premium Split Cashews', desc: 'Buttery, Smooth, Mild, Rich, Nutty, Sweet', image: '/assets/img/product/splitcashew1.webp', bg: '#3d2a2a' },
];

const galleryImages = [
  '/assets/img/categorie/gallery1.webp', '/assets/img/categorie/gallery2.webp',
  '/assets/img/categorie/gallery3.webp', '/assets/img/categorie/gallery4.webp',
  '/assets/img/categorie/gallery5.webp', '/assets/img/categorie/gallery6.webp',
];

const testimonials = [
  { name: 'Raj', text: "\"Hands down the best dry fruits store I've come across! I ordered almonds, cashews, and raisins, and they were all top-notch quality. The taste is so much better than the store-bought stuff. Plus, the customer service is fantastic! Highly recommend.\"" },
  { name: 'Priya', text: "\"Great variety and fresh products! I absolutely loved the dates and pistachios I got. The only reason I'm giving 4 stars is because I wish they had a few more organic options. Otherwise, the experience was wonderful!\"" },
  { name: 'Ananya', text: "\"I've been shopping for dry fruits from various places, but nothing compares to the quality I found here! The nuts are so fresh and the variety is amazing. I love the packaging too\u2014everything arrives perfectly sealed and fresh. Will definitely be a regular customer!\"" },
];

const services = ['Premium Quality', 'Natural & Fresh', 'Wide Variety', 'Freshly Packaged'];

const counters = [
  { icon: '/assets/img/icon/counter-icon1.webp', label: 'Premium Selection' },
  { icon: '/assets/img/icon/counter-icon2.webp', label: 'Clean, healthy, natural' },
  { icon: '/assets/img/icon/counter-icon3.webp', label: 'Curated for you' },
  { icon: '/assets/img/icon/counter-icon4.webp', label: 'Sustainably Grown' },
];

const productGallery = [
  { name: 'Premium Split Cashews', images: ['/assets/img/product/splitcashew1.webp', '/assets/img/product/splitcashew2.webp', '/assets/img/product/splitcashew3.webp', '/assets/img/product/splitcashew4.webp'] },
  { name: 'Whole Cashews', images: ['/assets/img/product/wholecashew3.webp', '/assets/img/product/whole_cashew4.webp', '/assets/img/product/whole_cashew1.webp', '/assets/img/product/whole_cashew2.webp'] },
  { name: 'Premium California Almonds - Jumbo', images: ['/assets/img/product/almond_jumbo1.webp', '/assets/img/product/almond_jumbo2.webp', '/assets/img/product/almond_jumbo3.webp', '/assets/img/product/almond_jumbo4.webp'] },
  { name: 'Premium California Almonds - Regular', images: ['/assets/img/product/almond_1.webp', '/assets/img/product/almond_2.webp', '/assets/img/product/almond_3.webp', '/assets/img/product/almond_4.webp'] },
  { name: 'Roasted and Salted Pistachios', images: ['/assets/img/product/pista1.webp', '/assets/img/product/pista2.webp', '/assets/img/product/pista3.webp', '/assets/img/product/pista4.webp'] },
];

const HomePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { loading } = useAppSelector((state) => state.products);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    dispatch(fetchFeaturedProducts());
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    const interval = setInterval(() => { setCurrentSlide((prev) => (prev + 1) % heroSlides.length); }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => { setCurrentTestimonial((prev) => (prev + 1) % testimonials.length); }, 4000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <Loading />;

  return (
    <Box>
      {/* Hero Section */}
      <Box sx={{ bgcolor: '#f0ede6', position: 'relative', overflow: 'hidden' }}>
        <Container maxWidth="lg">
          <Grid container alignItems="center" sx={{ minHeight: { xs: 400, md: 500 } }}>
            <Grid item xs={12} md={6} sx={{ py: { xs: 4, md: 6 }, position: 'relative', zIndex: 2 }}>
              <Typography variant="h3" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, mb: 2, fontSize: { xs: '1.8rem', md: '2.5rem' }, color: '#1A1A1A' }}>
                {heroSlides[currentSlide].title}
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, color: '#666', lineHeight: 1.8, maxWidth: 500 }}>
                {heroSlides[currentSlide].desc}
              </Typography>
              <Button component={Link} to="/products" variant="outlined" size="large" sx={{ borderColor: '#1A1A1A', color: '#1A1A1A', px: 4, py: 1.5, borderRadius: 0, fontWeight: 600, '&:hover': { bgcolor: '#1A1A1A', color: '#fff' } }}>
                Discover Products
              </Button>
              <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
                {heroSlides.map((_, i) => (
                  <Box key={i} onClick={() => setCurrentSlide(i)} sx={{ width: i === currentSlide ? 30 : 12, height: 4, bgcolor: i === currentSlide ? 'primary.main' : '#ccc', borderRadius: 2, cursor: 'pointer', transition: 'all 0.3s' }} />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box component="img" src={heroSlides[currentSlide].image} alt="Hero" sx={{ maxWidth: '100%', maxHeight: 450, objectFit: 'contain', transition: 'opacity 0.5s' }} />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Product Showcase Cards */}
      <Box sx={{ py: 6 }}>
        <Container maxWidth="lg">
          <Grid container spacing={3}>
            {productShowcase.map((item, idx) => (
              <Grid item xs={6} sm={4} md={2.4} key={idx}>
                <Card sx={{ bgcolor: item.bg, borderRadius: 3, overflow: 'hidden', textAlign: 'center', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-8px)' } }}>
                  <CardMedia component="img" image={item.image} alt={item.name} sx={{ height: 200, objectFit: 'cover' }} />
                  <Box sx={{ p: 2 }}>
                    <Box component="img" src="/assets/img/product/c.webp" alt="" sx={{ width: 40, height: 40, mx: 'auto', mb: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff', fontSize: '0.9rem' }}>{item.name}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', mt: 0.5 }}>{item.desc}</Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* About Section */}
      <Box sx={{ py: 8, bgcolor: '#fff' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}>Welcome to Kamyaabi</Typography>
              <Typography variant="h3" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, mb: 3, fontSize: { xs: '1.8rem', md: '2.5rem' } }}>
                Kamyaabi: Where Freshness Meets Flavor
              </Typography>
              <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.8, mb: 4 }}>
                Kamyaabi is dedicated to offering the finest premium dry fruits, carefully handpicked for freshness and quality. We ensure each product retains its natural goodness and rich flavor, providing you with a healthy, flavorful snacking experience.
              </Typography>
              <Grid container spacing={2}>
                {galleryImages.slice(0, 3).map((img, idx) => (
                  <Grid item xs={4} key={idx}>
                    <Box component="img" src={img} alt="" sx={{ width: '100%', borderRadius: 2, height: 100, objectFit: 'cover' }} />
                  </Grid>
                ))}
              </Grid>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box component="img" src="/assets/img/about/aboutUS.webp" alt="About Kamyaabi" sx={{ maxWidth: '100%', maxHeight: 450, objectFit: 'contain' }} />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Our Products Gallery */}
      <Box sx={{ py: 8, bgcolor: '#f9f9f9' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <img src="/assets/img/fav.svg" alt="" style={{ width: 30, marginBottom: 8 }} />
            <Typography variant="overline" sx={{ display: 'block', color: 'primary.main', fontWeight: 700 }}>Our Products</Typography>
            <Typography variant="h3" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700 }}>Our Products</Typography>
          </Box>
          {productGallery.map((product) => (
            <Box key={product.name} sx={{ mb: 4 }}>
              <Grid container spacing={2}>
                {product.images.map((img, idx) => (
                  <Grid item xs={6} sm={3} key={idx}>
                    <Card component={Link} to="/products" sx={{ textDecoration: 'none', overflow: 'hidden', borderRadius: 3, transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.03)' } }}>
                      <CardMedia component="img" image={img} alt={product.name} sx={{ height: 220, objectFit: 'cover' }} />
                      <Box sx={{ p: 1.5, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1A1A1A' }}>{product.name}</Typography>
                      </Box>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </Container>
      </Box>

      {/* Gallery Collection */}
      <Box sx={{ py: 8, bgcolor: '#fff' }}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, mb: 4 }}>
            Explore Our Premium Dry Fruits Collection
          </Typography>
          <Grid container spacing={2}>
            {galleryImages.map((img, idx) => (
              <Grid item xs={6} sm={4} key={idx}>
                <Box component="img" src={img} alt={`Gallery ${idx + 1}`} sx={{ width: '100%', height: { xs: 150, md: 220 }, objectFit: 'cover', borderRadius: 2, transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.05)' } }} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Services Section */}
      <Box sx={{ py: 8, bgcolor: '#f9f9f9' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <img src="/assets/img/fav.svg" alt="" style={{ width: 30, marginBottom: 8 }} />
            <Typography variant="overline" sx={{ display: 'block', color: 'primary.main', fontWeight: 700 }}>OUR BEST SERVICES</Typography>
            <Typography variant="h3" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700 }}>Pure Freshness in Every Bite</Typography>
          </Box>
          <Grid container spacing={3} justifyContent="center">
            {services.map((service, idx) => (
              <Grid item xs={6} sm={3} key={idx}>
                <Box sx={{ textAlign: 'center', p: 3, bgcolor: '#fff', borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', transition: 'transform 0.3s, box-shadow 0.3s', '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main' }}>{service}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
          <Typography variant="body1" align="center" sx={{ mt: 4, color: '#666', maxWidth: 600, mx: 'auto', lineHeight: 1.8 }}>
            Our dry fruits are carefully selected for their freshness and quality, ensuring you get the best in every bite.
          </Typography>
        </Container>
      </Box>

      {/* Counters Section */}
      <Box sx={{ py: 8, bgcolor: '#1A1A1A', color: '#fff' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <img src="/assets/img/fav.svg" alt="" style={{ width: 30, marginBottom: 8, filter: 'brightness(2)' }} />
            <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700 }}>Your Gateway to Premium Dry Fruits</Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1 }}>Meeting the Growing Demand for Premium Dry Fruits</Typography>
          </Box>
          <Grid container spacing={4} justifyContent="center">
            {counters.map((item, idx) => (
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

      {/* Testimonials & Contact */}
      <Box sx={{ py: 8, bgcolor: '#fff' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6}>
            <Grid item xs={12} md={6}>
              <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}>CLIENT TESTIMONIAL</Typography>
              <Typography variant="h4" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 700, mb: 4 }}>
                What Does The Customer Have To Say?
              </Typography>
              <Box sx={{ bgcolor: '#f9f9f9', p: 4, borderRadius: 3, minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{testimonials[currentTestimonial].name}</Typography>
                <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.8, fontStyle: 'italic' }}>{testimonials[currentTestimonial].text}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
                {testimonials.map((_, i) => (
                  <Box key={i} onClick={() => setCurrentTestimonial(i)} sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: i === currentTestimonial ? 'primary.main' : '#ccc', cursor: 'pointer', transition: 'all 0.3s' }} />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body1" sx={{ mb: 3, color: '#666' }}>
                Please fill out the form below and one of our specialists will back in touch shortly.
              </Typography>
              <Box component="form" sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField multiline rows={4} placeholder="Message" variant="outlined" fullWidth />
                <TextField placeholder="Name" variant="outlined" fullWidth />
                <TextField placeholder="Email Address" type="email" variant="outlined" fullWidth />
                <Button type="button" variant="contained" size="large" sx={{ bgcolor: 'primary.main', color: '#fff', py: 1.5, fontWeight: 700, '&:hover': { bgcolor: 'primary.dark' } }}>
                  Send Message
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* WhatsApp floating button */}
      <Box component="a" href="https://api.whatsapp.com/send?phone=8985858888&text=Hello%20Kamyaabi" target="_blank" rel="noopener noreferrer"
        sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000, width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', '&:hover': { transform: 'scale(1.1)' }, transition: 'transform 0.3s' }}>
        <img src="/assets/img/wicon.webp" alt="WhatsApp" style={{ width: '100%', height: '100%' }} />
      </Box>
    </Box>
  );
};

export default HomePage;
