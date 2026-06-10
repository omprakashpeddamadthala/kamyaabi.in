/*
 * UI REDESIGN AUDIT — PRESERVED FUNCTIONALITY
 * - Preserves hero banner API/fallback behavior, featured products, categories dispatch, track-order form, testimonials, WhatsApp link, and admin product-section visibility.
 * - Visual-only tokenization of hero, sections, cards, typography, and responsive heights.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Button, Card, CardMedia, TextField, InputAdornment,
} from '@mui/material';
import { LocalShipping, Search } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchFeaturedProducts, fetchCategories } from '../features/product/productSlice';
import ProductCard from '../components/common/ProductCard';
import ProductCardSkeleton from '../components/common/ProductCardSkeleton';
import PageTransition from '../components/common/PageTransition';
import AmazonBanner from '../components/common/AmazonBanner';
import { heroBannerApi, HeroBanner } from '../api/heroBannerApi';
import { withCloudinaryTransform } from '../utils/cloudinary';
import { config } from '../config';

interface HeroSlide {
  title: string;
  desc: string;
  image: string;
  alt: string;
  link?: string;
}

// Fallback used only if no banners are configured in the admin panel / the API fails.
const fallbackHeroSlides: HeroSlide[] = [
  { title: 'Almonds & Cashews: A Perfect Nutty Pair', desc: 'Our Premium California Almonds are handpicked for superior flavor and packed with healthy fats and protein, making them the perfect nutritious snack or recipe addition.', image: '/assets/img/hero/banner2.webp', alt: 'Premium almonds and cashews' },
  { title: 'The Ultimate Nut Trio: Pistachios, Cashews & Almonds', desc: 'Our Roasted and Salted Pistachios, Premium Split Cashews, and California Almonds offer a savory, crunchy snack packed with antioxidants and healthy fats.', image: '/assets/img/hero/banner1.webp', alt: 'Pistachios, cashews and almonds' },
  { title: 'Wholesome Goodness, Delivered Fresh', desc: 'From handpicked almonds to crunchy pistachios, every Kamyaabi pack is sourced for purity, sealed for freshness, and delivered straight to your door.', image: '/assets/img/about/aboutUS.webp', alt: 'Wholesome dry fruits delivered fresh' },
];

const productShowcase = [
  { name: 'Whole Cashews', desc: 'Creamy, Rich, Mild, Buttery, Sweet, Crisp', image: '/assets/img/product/wholecashew3.webp', bg: '#2a2a3d' },
  { name: 'Roasted, Salted Pistachios', desc: 'Savory, Crunchy, Salty, Bold, Toasted, Fresh', image: '/assets/img/product/pista1.webp', bg: '#3d3a2a' },
  { name: 'Almonds - Regular', desc: 'Rich, Nutty, Crunchy, Fresh, Earthy, Bold', image: '/assets/img/product/almond_1.webp', bg: '#2a3d2a' },
  { name: 'California Almonds - Jumbo', desc: 'Savory, Crisp, Robust, Natural, Toasted, Wholesome', image: '/assets/img/product/almond_jumbo1.webp', bg: '#2a3d3d' },
  { name: 'Premium Split Cashews', desc: 'Buttery, Smooth, Mild, Rich, Nutty, Sweet', image: '/assets/img/product/splitcashew1.webp', bg: '#3d2a2a' },
];

const welcomeImages = [
  '/assets/img/product/almond_1.webp',
  '/assets/img/product/pista1.webp',
  '/assets/img/product/wholecashew3.webp',
];

const testimonials = [
  { name: 'Raj', text: "\"Hands down the best dry fruits store I've come across! I ordered almonds, cashews, and raisins, and they were all top-notch quality. The taste is so much better than the store-bought stuff. Plus, the customer service is fantastic! Highly recommend.\"" },
  { name: 'Priya', text: "\"Great variety and fresh products! I absolutely loved the dates and pistachios I got. The only reason I'm giving 4 stars is because I wish they had a few more organic options. Otherwise, the experience was wonderful!\"" },
  { name: 'Ananya', text: "\"I've been shopping for dry fruits from various places, but nothing compares to the quality I found here! The nuts are so fresh and the variety is amazing. I love the packaging too\u2014everything arrives perfectly sealed and fresh. Will definitely be a regular customer!\"" },
];

const counters = [
  { icon: '/assets/img/icon/counter-icon1.webp', label: 'Premium Selection' },
  { icon: '/assets/img/icon/counter-icon2.webp', label: 'Clean, healthy, natural' },
  { icon: '/assets/img/icon/counter-icon3.webp', label: 'Curated for you' },
  { icon: '/assets/img/icon/counter-icon4.webp', label: 'Sustainably Grown' },
];


const HomePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { featuredProducts, loading } = useAppSelector((state) => state.products);
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === 'ADMIN';
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [heroBanners, setHeroBanners] = useState<HeroBanner[] | null>(null);
  const [trackQuery, setTrackQuery] = useState('');

  useEffect(() => {
    dispatch(fetchFeaturedProducts());
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    let cancelled = false;
    heroBannerApi
      .getActive()
      .then((res) => { if (!cancelled) setHeroBanners(res.data.data ?? []); })
      .catch(() => { if (!cancelled) setHeroBanners([]); });
    return () => { cancelled = true; };
  }, []);

  const heroSlides: HeroSlide[] = useMemo(() => {
    if (heroBanners && heroBanners.length > 0) {
      return heroBanners.map((b) => ({
        title: b.title ?? '',
        desc: b.subtitle ?? '',
        image: withCloudinaryTransform(b.imageUrl) || b.imageUrl,
        alt: b.altText ?? b.title ?? 'Kamyaabi hero banner',
        link: b.linkUrl ?? undefined,
      }));
    }
    return fallbackHeroSlides;
  }, [heroBanners]);

  useEffect(() => {
    if (currentSlide > heroSlides.length - 1) setCurrentSlide(0);
  }, [heroSlides.length, currentSlide]);

  useEffect(() => {
    if (heroSlides.length <= 1) return undefined;
    const interval = setInterval(() => { setCurrentSlide((prev) => (prev + 1) % heroSlides.length); }, 5000);
    return () => clearInterval(interval);
  }, [heroSlides.length]);

  useEffect(() => {
    const interval = setInterval(() => { setCurrentTestimonial((prev) => (prev + 1) % testimonials.length); }, 4000);
    return () => clearInterval(interval);
  }, []);

  const showProductSkeletons = loading && featuredProducts.length === 0;
  const activeSlide = heroSlides[currentSlide] ?? heroSlides[0];

  return (
    <PageTransition>
    <Box>
      {}
      <Box sx={{ bgcolor: 'var(--color-surface-bg)', position: 'relative', overflow: 'hidden' }}>
        <Container maxWidth="lg">
          <Grid container alignItems="center" sx={{ minHeight: { xs: '50vh', md: '70vh' }, maxHeight: 700 }}>
            <Grid item xs={12} md={6} sx={{ py: { xs: 4, md: 6 }, position: 'relative', zIndex: 2 }}>
              <Typography variant="h3" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mb: 2, color: 'var(--color-text-primary)' }}>
                {activeSlide.title}
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, color: 'var(--color-text-secondary)', lineHeight: 1.8, maxWidth: 500 }}>
                {activeSlide.desc}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
                {heroSlides.map((_, i) => (
                  <Box key={i} onClick={() => setCurrentSlide(i)} sx={{ width: i === currentSlide ? 30 : 12, height: 4, bgcolor: i === currentSlide ? 'primary.main' : '#ccc', borderRadius: 2, cursor: 'pointer', transition: 'all 0.3s' }} />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center' }}>
              {activeSlide.link ? (
                <Box component={Link} to={activeSlide.link} sx={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                  <Box component="img" src={activeSlide.image} alt={activeSlide.alt} sx={{ maxWidth: '100%', maxHeight: 450, objectFit: 'contain', transition: 'opacity 0.5s' }} />
                </Box>
              ) : (
                <Box component="img" src={activeSlide.image} alt={activeSlide.alt} sx={{ maxWidth: '100%', maxHeight: 450, objectFit: 'contain', transition: 'opacity 0.5s' }} />
              )}
            </Grid>
          </Grid>
        </Container>
      </Box>

      {}
      <Box sx={{ py: { xs: 4, md: 6 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={{ xs: 2, md: 3 }} justifyContent="center">
            {productShowcase.map((item, idx) => (
              <Grid item xs={6} sm={4} md={4} lg={2.4} key={idx} sx={{ display: 'flex', justifyContent: 'center' }}>
                <Card sx={{ width: '100%', maxWidth: 240, bgcolor: item.bg, borderRadius: 3, overflow: 'hidden', textAlign: 'center', transition: 'transform 0.3s', '&:hover': { transform: 'translateY(-8px)' } }}>
                  <CardMedia component="img" image={item.image} alt={item.name} sx={{ height: { xs: 140, sm: 180, md: 200 }, objectFit: 'cover' }} />
                  <Box sx={{ p: { xs: 1.5, sm: 2 } }}>
                    <Box component="img" src="/assets/img/product/c.webp" alt="" sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 }, mx: 'auto', mb: 1 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#fff' }}>{item.name}</Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>{item.desc}</Typography>
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {}
      <Box sx={{ py: 8, bgcolor: 'var(--color-surface-card)' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}>Welcome to Kamyaabi</Typography>
              <Typography variant="h3" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mb: 3 }}>
                Kamyaabi: Where Freshness Meets Flavor
              </Typography>
              <Typography variant="body1" sx={{ color: 'var(--color-text-secondary)', lineHeight: 1.8, mb: 4 }}>
                Kamyaabi is dedicated to offering the finest premium dry fruits, carefully handpicked for freshness and quality. We ensure each product retains its natural goodness and rich flavor, providing you with a healthy, flavorful snacking experience.
              </Typography>
              <Grid container spacing={2}>
                {welcomeImages.map((img, idx) => (
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

      {}
      {!isAdmin && (
        <Box sx={{ py: 8, bgcolor: 'var(--color-surface-bg)' }}>
          <Container maxWidth="lg">
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <img src="/assets/img/fav.svg" alt="" style={{ width: 30, marginBottom: 8 }} />
              <Typography variant="h3" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Our Products</Typography>
            </Box>
            <Grid container spacing={3}>
              {showProductSkeletons
                ? Array.from({ length: 4 }).map((_, i) => (
                    <Grid item xs={6} sm={4} md={3} key={i}>
                      <ProductCardSkeleton />
                    </Grid>
                  ))
                : featuredProducts.map((product) => (
                    <Grid item xs={6} sm={4} md={3} key={product.id}>
                      <ProductCard product={product} />
                    </Grid>
                  ))}
            </Grid>
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Button component={Link} to="/products" variant="outlined" size="large" sx={{ borderColor: 'var(--color-brand-primary)', color: 'var(--color-text-primary)', px: 4, py: 1.5, borderRadius: 0, fontWeight: 600, '&:hover': { bgcolor: 'var(--color-text-primary)', color: '#fff' } }}>
                View All Products
              </Button>
            </Box>
          </Container>
        </Box>
      )}

      {/* Track Your Order */}
      <Box sx={{ py: { xs: 5, md: 7 }, bgcolor: 'var(--color-surface-bg)' }}>
        <Container maxWidth="sm">
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <LocalShipping sx={{ fontSize: 44, color: 'primary.main', mb: 1 }} />
            <Typography variant="h4" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mb: 1 }}>
              Track Your Order
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Enter your order number to check the delivery status — no login required
            </Typography>
          </Box>
          <Box
            component="form"
            onSubmit={(e: React.FormEvent) => {
              e.preventDefault();
              const q = trackQuery.trim();
              if (q) navigate(`/track-order?orderId=${encodeURIComponent(q)}`);
            }}
            sx={{ display: 'flex', gap: 1.5 }}
          >
            <TextField
              fullWidth
              placeholder="Enter Order ID (e.g. 1001)"
              value={trackQuery}
              onChange={(e) => setTrackQuery(e.target.value)}
              type="number"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" />
                  </InputAdornment>
                ),
              }}
              sx={{
                bgcolor: 'var(--color-surface-card)',
                borderRadius: 2,
                '& .MuiOutlinedInput-root': { borderRadius: 2 },
              }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={!trackQuery.trim()}
              sx={{ px: 4, borderRadius: 2, fontWeight: 600, textTransform: 'none', minWidth: 110 }}
            >
              Track
            </Button>
          </Box>
          <Box sx={{ textAlign: 'center', mt: 2 }}>
            <Button component={Link} to="/track-order" variant="text" size="small" sx={{ textTransform: 'none', color: 'text.secondary' }}>
              Or track using AWB / tracking number →
            </Button>
          </Box>
        </Container>
      </Box>

      {}
      <Box sx={{ py: 8, bgcolor: 'var(--color-text-primary)', color: '#fff' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <img src="/assets/img/fav.svg" alt="" style={{ width: 30, marginBottom: 8, filter: 'brightness(2)' }} />
            <Typography variant="h4" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>Your Gateway to Premium Dry Fruits</Typography>
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

      {}
      <AmazonBanner variant="home" />

      {}
      <Box sx={{ py: 8, bgcolor: 'var(--color-surface-card)' }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}>CLIENT TESTIMONIAL</Typography>
            <Typography variant="h4" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700 }}>
              What Does The Customer Have To Say?
            </Typography>
          </Box>
          <Box sx={{ bgcolor: 'var(--color-surface-bg)', p: 4, borderRadius: 3, minHeight: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>{testimonials[currentTestimonial].name}</Typography>
            <Typography variant="body1" sx={{ color: 'var(--color-text-secondary)', lineHeight: 1.8, fontStyle: 'italic' }}>{testimonials[currentTestimonial].text}</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'center' }}>
            {testimonials.map((_, i) => (
              <Box key={i} onClick={() => setCurrentTestimonial(i)} sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: i === currentTestimonial ? 'primary.main' : '#ccc', cursor: 'pointer', transition: 'all 0.3s' }} />
            ))}
          </Box>
        </Container>
      </Box>

      {}
      <Box component="a" href={`${config.whatsappUrl}?text=Hello%20Kamyaabi`} target="_blank" rel="noopener noreferrer"
        sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 1000, width: 56, height: 56, borderRadius: '50%', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.3)', '&:hover': { transform: 'scale(1.1)' }, transition: 'transform 0.3s' }}>
        <img src="/assets/img/wicon.webp" alt="WhatsApp" style={{ width: '100%', height: '100%' }} />
      </Box>
    </Box>
    </PageTransition>
  );
};

export default HomePage;
