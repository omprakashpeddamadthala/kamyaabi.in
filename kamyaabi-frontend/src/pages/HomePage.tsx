/*
 * UI REDESIGN AUDIT — PRESERVED FUNCTIONALITY
 * - Preserves hero banner API/fallback behavior, featured products, categories dispatch, track-order form, testimonials, WhatsApp link, and admin product-section visibility.
 * - Visual-only tokenization of hero, sections, cards, typography, and responsive heights.
 * - Introduces horizontal scrolling ribbons for touch-friendly mobile navigation.
 */
import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Box, Container, Typography, Grid, Button, Card, CardMedia, TextField, InputAdornment, IconButton,
  Accordion, AccordionSummary, AccordionDetails,
} from '@mui/material';
import { LocalShipping, Search, ArrowForward, ChevronLeft, ChevronRight, ExpandMore } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchFeaturedProducts, fetchCategories } from '../features/product/productSlice';
import ProductCard from '../components/common/ProductCard';
import ProductCardSkeleton from '../components/common/ProductCardSkeleton';
import PageTransition from '../components/common/PageTransition';
import Seo from '../components/common/Seo';
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
  { title: 'Almonds & Cashews: A Perfect Nutty Pair', desc: 'Our Premium California Almonds are handpicked for superior flavor and packed with healthy fats and protein, making them the perfect nutritious snack or recipe addition.', image: 'https://res.cloudinary.com/dsibez7to/image/upload/v1782551827/kamyaabi/assets/img/hero/banner2.webp', alt: 'Premium almonds and cashews' },
  { title: 'The Ultimate Nut Trio: Pistachios, Cashews & Almonds', desc: 'Our Roasted and Salted Pistachios, Premium Split Cashews, and California Almonds offer a savory, crunchy snack packed with antioxidants and healthy fats.', image: 'https://res.cloudinary.com/dsibez7to/image/upload/v1782551825/kamyaabi/assets/img/hero/banner1.webp', alt: 'Pistachios, cashews and almonds' },
  { title: 'Wholesome Goodness, Delivered Fresh', desc: 'From handpicked almonds to crunchy pistachios, every Kamyaabi pack is sourced for purity, sealed for freshness, and delivered straight to your door.', image: 'https://res.cloudinary.com/dsibez7to/image/upload/v1782551800/kamyaabi/assets/img/about/aboutUS.webp', alt: 'Wholesome dry fruits delivered fresh' },
];

const CATEGORY_IMAGE_MAP: Record<string, string> = {
  'almonds': 'https://res.cloudinary.com/dsibez7to/image/upload/v1782551804/kamyaabi/assets/img/categorie/almonds.jpg',
  'anjeer': 'https://res.cloudinary.com/dsibez7to/image/upload/v1783216984/kamyaabi/assets/img/categorie/anjeer.jpg',
  'cashew': 'https://res.cloudinary.com/dsibez7to/image/upload/v1782551807/kamyaabi/assets/img/categorie/cashew.jpg',
  'cashews': 'https://res.cloudinary.com/dsibez7to/image/upload/v1782551807/kamyaabi/assets/img/categorie/cashew.jpg',
  'dry dates': 'https://res.cloudinary.com/dsibez7to/image/upload/v1782551808/kamyaabi/assets/img/categorie/dry_dates.jpg',
  'kalmi dates': 'https://res.cloudinary.com/dsibez7to/image/upload/v1782551816/kamyaabi/assets/img/categorie/kalmi_dates.jpg',
  'walnuts': 'https://res.cloudinary.com/dsibez7to/image/upload/v1782551821/kamyaabi/assets/img/categorie/walnuts.jpg',
  'raisins': 'https://res.cloudinary.com/dsibez7to/image/upload/v1782551819/kamyaabi/assets/img/categorie/raisins.jpg',
  'pistachio': 'https://res.cloudinary.com/dsibez7to/image/upload/v1782551817/kamyaabi/assets/img/categorie/pistachio.jpg',
  'pistachios': 'https://res.cloudinary.com/dsibez7to/image/upload/v1782551817/kamyaabi/assets/img/categorie/pistachio.jpg',
  'seeds': 'https://res.cloudinary.com/dsibez7to/image/upload/v1783216005/kamyaabi/assets/img/categorie/seeds.jpg',
};

const getCategoryImage = (catName: string, catImageUrl: string | null | undefined): string => {
  if (catImageUrl && catImageUrl.trim() !== '') {
    return catImageUrl;
  }
  const cleanName = catName.trim().toLowerCase();
  return CATEGORY_IMAGE_MAP[cleanName] || `https://picsum.photos/seed/${cleanName.replace(/\s+/g, '')}/150/150`;
};

const CATEGORY_STYLE_MAP: Record<string, { bg: string; color: string; desc: string }> = {
  'almonds': {
    bg: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
    color: '#9a3412',
    desc: 'Rich, Nutty, Crunchy'
  },
  'cashew': {
    bg: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
    color: '#374151',
    desc: 'Creamy, Buttery, Rich'
  },
  'cashews': {
    bg: 'linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)',
    color: '#374151',
    desc: 'Creamy, Buttery, Rich'
  },
  'pistachio': {
    bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
    color: '#166534',
    desc: 'Savory, Crunchy, Salty'
  },
  'pistachios': {
    bg: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
    color: '#166534',
    desc: 'Savory, Crunchy, Salty'
  },
  'anjeer': {
    bg: 'linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%)',
    color: '#6b21a8',
    desc: 'Sweet, Chewy, Fiber-Rich'
  },
  'dry dates': {
    bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
    color: '#92400e',
    desc: 'Naturally Sweet & Healthy'
  },
  'kalmi dates': {
    bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
    color: '#92400e',
    desc: 'Soft, Premium, Dark Dates'
  },
  'walnuts': {
    bg: 'linear-gradient(135deg, #fafaf9 0%, #f5f5f4 100%)',
    color: '#44403c',
    desc: 'Brain Food, Premium Halves'
  },
  'raisins': {
    bg: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
    color: '#b45309',
    desc: 'Sweet, Tangy, Juicy'
  },
  'seeds': {
    bg: 'linear-gradient(135deg, #ecfeff 0%, #cffafe 100%)',
    color: '#155e75',
    desc: 'Nutrient-Dense Superfoods'
  },
  'mixed dry fruits': {
    bg: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
    color: '#991b1b',
    desc: 'Premium Assorted Blends'
  }
};

const DEFAULT_CATEGORY_STYLE = {
  bg: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
  color: '#1f2937',
  desc: 'Premium quality dry fruits'
};

const getCategoryStyle = (catName: string) => {
  const cleanName = catName.trim().toLowerCase();
  return CATEGORY_STYLE_MAP[cleanName] || DEFAULT_CATEGORY_STYLE;
};

const welcomeImages = [
  'https://res.cloudinary.com/dsibez7to/image/upload/v1783217380/kamyaabi/assets/img/product/almonds_jar.jpg',
  'https://res.cloudinary.com/dsibez7to/image/upload/v1783217381/kamyaabi/assets/img/product/pista_pouch.jpg',
  'https://res.cloudinary.com/dsibez7to/image/upload/v1783217378/kamyaabi/assets/img/product/cashew_pouch.jpg',
];

const testimonials = [
  { name: 'Raj', text: "\"Hands down the best dry fruits store I've come across! I ordered almonds, cashews, and raisins, and they were all top-notch quality. The taste is so much better than the store-bought stuff. Plus, the customer service is fantastic! Highly recommend.\"" },
  { name: 'Priya', text: "\"Great variety and fresh products! I absolutely loved the dates and pistachios I got. The only reason I'm giving 4 stars is because I wish they had a few more organic options. Otherwise, the experience was wonderful!\"" },
  { name: 'Ananya', text: "\"I've been shopping for dry fruits from various places, but nothing compares to the quality I found here! The nuts are so fresh and the variety is amazing. I love the packaging too\u2014everything arrives perfectly sealed and fresh. Will definitely be a regular customer!\"" },
];

const faqs = [
  {
    q: 'Why choose Kamyaabi for premium dry fruits?',
    a: 'Kamyaabi is committed to delivering premium-quality dry fruits that are carefully sourced, hygienically packed, and rich in nutrition. We focus on freshness, quality, and customer satisfaction to bring you the finest selection of dry fruits online.',
  },
  {
    q: 'What makes Kamyaabi dry fruits different from others?',
    a: 'Kamyaabi combines quality sourcing, stringent quality checks, premium packaging, and reliable delivery to ensure every product meets the highest standards of taste, freshness, and nutrition.',
  },
  {
    q: 'What are the health benefits of Premium Anjeer?',
    a: 'Premium Anjeer (figs) is rich in fiber, antioxidants, calcium, and essential nutrients that support digestion, bone health, and overall wellness.',
  },
  {
    q: 'Why should I choose Premium Chilean Walnuts?',
    a: 'Premium Chilean Walnuts are known for their superior quality, rich omega-3 fatty acids, and crunchy texture, making them an excellent choice for heart and brain health.',
  },
  {
    q: 'Are Kamyaabi dry fruits fresh and naturally sourced?',
    a: 'Yes, all Kamyaabi dry fruits are carefully sourced from trusted suppliers and packed hygienically to ensure freshness, taste, and quality.',
  },
  {
    q: 'How should I store dry fruits to maintain freshness?',
    a: 'Store dry fruits in an airtight container in a cool, dry place away from direct sunlight. Refrigeration can help extend their shelf life.',
  },
  {
    q: 'Are Kamyaabi dry fruits suitable for daily consumption?',
    a: 'Yes, almonds, walnuts, anjeer, raisins, pistachios, dates, and seeds can be enjoyed daily as part of a balanced and healthy diet.',
  },
];

const faqJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: faqs.map((f) => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
};

const counters = [
  { icon: 'https://res.cloudinary.com/dsibez7to/image/upload/v1782551828/kamyaabi/assets/img/icon/counter-icon1.webp', label: 'Premium Selection' },
  { icon: 'https://res.cloudinary.com/dsibez7to/image/upload/v1782551829/kamyaabi/assets/img/icon/counter-icon2.webp', label: 'Clean, healthy, natural' },
  { icon: 'https://res.cloudinary.com/dsibez7to/image/upload/v1782551831/kamyaabi/assets/img/icon/counter-icon3.webp', label: 'Curated for you' },
  { icon: 'https://res.cloudinary.com/dsibez7to/image/upload/v1782551832/kamyaabi/assets/img/icon/counter-icon4.webp', label: 'Sustainably Grown' },
];

const HomePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { featuredProducts, categories, loading } = useAppSelector((state) => state.products);
  const { user } = useAppSelector((state) => state.auth);
  const isAdmin = user?.role === 'ADMIN';
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [heroBanners, setHeroBanners] = useState<HeroBanner[] | null>(null);
  const [trackQuery, setTrackQuery] = useState('');

  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const productScrollRef = useRef<HTMLDivElement>(null);
  const categoryHoverRef = useRef(false);
  const productHoverRef = useRef(false);

  const handleScroll = (ref: React.RefObject<HTMLDivElement>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = direction === 'left' ? -ref.current.offsetWidth * 0.75 : ref.current.offsetWidth * 0.75;
      ref.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // Auto-scroll Categories periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hidden) return;
      if (categoryScrollRef.current && !categoryHoverRef.current) {
        const el = categoryScrollRef.current;
        const cardWidth = el.firstElementChild?.clientWidth || 200;
        const gap = 16;
        const step = cardWidth + gap;

        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 15) {
          el.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          el.scrollBy({ left: step, behavior: 'smooth' });
        }
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [categories]);

  // Auto-scroll Products periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (document.hidden) return;
      if (productScrollRef.current && !productHoverRef.current) {
        const el = productScrollRef.current;
        const cardWidth = el.firstElementChild?.clientWidth || 280;
        const gap = 24;
        const step = cardWidth + gap;

        if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 15) {
          el.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          el.scrollBy({ left: step, behavior: 'smooth' });
        }
      }
    }, 2500);
    return () => clearInterval(interval);
  }, [featuredProducts]);

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
      <Seo
        title="Premium Dry Fruits & Nuts Online"
        description="Kamyaabi delivers premium, hand-picked dry fruits and nuts — almonds, cashews, pistachios and more. Sourced for purity, sealed for freshness, delivered across India."
        canonicalPath="/"
        jsonLd={faqJsonLd}
      />
    <Box>
      {/* Hero Section */}
      <Box sx={{ bgcolor: 'var(--color-surface-bg)', position: 'relative', overflow: 'hidden' }}>
        <Container maxWidth="lg" sx={{ px: { xs: 2, md: 3 } }}>
          <Grid container alignItems="center" sx={{ minHeight: { xs: '60vh', md: '70vh' }, maxHeight: 700 }}>
            <Grid item xs={12} md={6} sx={{ py: { xs: 4, md: 6 }, position: 'relative', zIndex: 2, order: { xs: 2, md: 1 } }}>
              <Typography variant="h3" sx={{ fontFamily: 'var(--font-display)', fontWeight: 800, mb: 2, color: 'var(--color-text-primary)', fontSize: { xs: '2.5rem', md: '3.5rem' }, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                {activeSlide.title}
              </Typography>
              <Typography variant="body1" sx={{ mb: 4, color: 'var(--color-text-secondary)', lineHeight: 1.8, maxWidth: 500, fontSize: { xs: '1rem', md: '1.1rem' } }}>
                {activeSlide.desc}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
                {heroSlides.map((_, i) => (
                  <Box key={i} onClick={() => setCurrentSlide(i)} sx={{ width: i === currentSlide ? 40 : 12, height: 6, bgcolor: i === currentSlide ? 'var(--color-brand-primary)' : 'rgba(29, 78, 216, 0.2)', borderRadius: 3, cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                ))}
              </Box>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center', position: 'relative', order: { xs: 1, md: 2 }, height: { xs: 280, md: 'auto' }, pt: { xs: 4, md: 0 } }}>
              {/* Dynamic Blob Background */}
              <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: { xs: 240, md: 400 }, height: { xs: 240, md: 400 }, background: 'radial-gradient(circle, rgba(29, 78, 216, 0.15) 0%, rgba(255,255,255,0) 70%)', borderRadius: '50%', zIndex: 0 }} />
              
              {activeSlide.link ? (
                <Box component={Link} to={activeSlide.link} sx={{ display: 'flex', justifyContent: 'center', width: '100%', zIndex: 1 }}>
                  <Box component="img" src={activeSlide.image} alt={activeSlide.alt} sx={{ maxWidth: '100%', maxHeight: { xs: 260, md: 450 }, objectFit: 'contain', transition: 'opacity 0.5s', animation: 'kamyaabi-float 6s ease-in-out infinite' }} />
                </Box>
              ) : (
                <Box component="img" src={activeSlide.image} alt={activeSlide.alt} sx={{ maxWidth: '100%', maxHeight: { xs: 260, md: 450 }, objectFit: 'contain', transition: 'opacity 0.5s', zIndex: 1, animation: 'kamyaabi-float 6s ease-in-out infinite' }} />
              )}
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Categories Horizontal Ribbon */}
      <Box sx={{ py: { xs: 4, md: 6 }, overflow: 'hidden' }}>
        <Container maxWidth="lg" sx={{ px: { xs: 0, sm: 3 } }}>
          <Box sx={{ px: { xs: 2, sm: 0 }, mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <Typography variant="h5" sx={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.01em' }}>
              Shop by Category
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton
                onClick={() => handleScroll(categoryScrollRef, 'left')}
                sx={{
                  bgcolor: '#ffffff',
                  border: '1px solid rgba(0,0,0,0.08)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  '&:hover': { bgcolor: '#f3f4f6', transform: 'scale(1.05)' },
                  width: { xs: 36, md: 40 },
                  height: { xs: 36, md: 40 },
                }}
              >
                <ChevronLeft fontSize="small" />
              </IconButton>
              <IconButton
                onClick={() => handleScroll(categoryScrollRef, 'right')}
                sx={{
                  bgcolor: '#ffffff',
                  border: '1px solid rgba(0,0,0,0.08)',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  '&:hover': { bgcolor: '#f3f4f6', transform: 'scale(1.05)' },
                  width: { xs: 36, md: 40 },
                  height: { xs: 36, md: 40 },
                }}
              >
                <ChevronRight fontSize="small" />
              </IconButton>
            </Box>
          </Box>
          <Box
            ref={categoryScrollRef}
            onMouseEnter={() => { categoryHoverRef.current = true; }}
            onMouseLeave={() => { categoryHoverRef.current = false; }}
            sx={{
              display: 'flex',
              gap: 2,
              overflowX: 'auto',
              scrollSnapType: 'x mandatory',
              px: { xs: 2, sm: 0 },
              pb: 2,
              '&::-webkit-scrollbar': { display: 'none' }, // Hide scrollbar for slick look
              msOverflowStyle: 'none',
              scrollbarWidth: 'none',
            }}
          >
            {(() => {
              const displayCategories = categories.filter((cat) => cat.parentId !== null && cat.parentId !== undefined);
              const categoriesToRender = displayCategories.length > 0 ? displayCategories : categories;
              return categoriesToRender.map((cat) => {
                const style = getCategoryStyle(cat.name);
                return (
                  <Box
                    key={cat.id}
                    sx={{
                      flex: '0 0 auto',
                      width: { xs: 160, sm: 180, md: 200 },
                      scrollSnapAlign: 'start',
                    }}
                  >
                    <Card
                      sx={{ 
                        height: '100%',
                        background: style.bg,
                        borderRadius: 'var(--radius-xl)', 
                        overflow: 'hidden', 
                        textAlign: 'center', 
                        cursor: 'pointer', 
                        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                        transition: 'transform var(--transition-normal), box-shadow var(--transition-normal)', 
                        '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 12px 24px rgba(0,0,0,0.1)' } 
                      }}
                      onClick={() => {
                        navigate(`/products?category=${cat.id}`);
                      }}
                    >
                      <CardMedia component="img" loading="lazy" image={getCategoryImage(cat.name, cat.imageUrl)} alt={cat.name} sx={{ height: { xs: 130, md: 160 }, objectFit: 'cover' }} />
                      <Box sx={{ p: 2, pt: 1.5 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 800, color: style.color, lineHeight: 1.2, mb: 0.5 }}>{cat.name}</Typography>
                        <Typography variant="body2" sx={{ color: style.color, opacity: 0.8, fontSize: '0.75rem', fontWeight: 600 }}>{style.desc}</Typography>
                      </Box>
                    </Card>
                  </Box>
                );
              });
            })()}
          </Box>
        </Container>
      </Box>

      {/* Featured Products (Horizontal Carousel) */}
      {!isAdmin && (
        <Box sx={{ py: { xs: 4, md: 8 }, bgcolor: 'var(--color-surface-bg)' }}>
          <Container maxWidth="lg" sx={{ px: { xs: 0, sm: 3 } }}>
            <Box sx={{ px: { xs: 2, sm: 0 }, mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h4" sx={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.01em', mt: 0.5 }}>Our Products</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Button component={Link} to="/products" endIcon={<ArrowForward />} sx={{ fontWeight: 700, mr: 1, display: { xs: 'none', sm: 'inline-flex' } }}>
                  View All
                </Button>
                <IconButton
                  onClick={() => handleScroll(productScrollRef, 'left')}
                  sx={{
                    bgcolor: '#ffffff',
                    border: '1px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    '&:hover': { bgcolor: '#f3f4f6', transform: 'scale(1.05)' },
                    width: { xs: 36, md: 40 },
                    height: { xs: 36, md: 40 },
                  }}
                >
                  <ChevronLeft fontSize="small" />
                </IconButton>
                <IconButton
                  onClick={() => handleScroll(productScrollRef, 'right')}
                  sx={{
                    bgcolor: '#ffffff',
                    border: '1px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    '&:hover': { bgcolor: '#f3f4f6', transform: 'scale(1.05)' },
                    width: { xs: 36, md: 40 },
                    height: { xs: 36, md: 40 },
                  }}
                >
                  <ChevronRight fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            <Box>
              <Box
                ref={productScrollRef}
                onMouseEnter={() => { productHoverRef.current = true; }}
                onMouseLeave={() => { productHoverRef.current = false; }}
                sx={{
                  display: 'flex',
                  gap: 3,
                  overflowX: 'auto',
                  scrollSnapType: 'x mandatory',
                  px: { xs: 2, sm: 0 },
                  pb: 3, // space for shadow
                  '&::-webkit-scrollbar': { display: 'none' },
                  msOverflowStyle: 'none',
                  scrollbarWidth: 'none',
                }}
              >
                {showProductSkeletons
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <Box key={`skel-${i}`} sx={{ flex: '0 0 auto', width: { xs: 220, sm: 250, md: 280 }, scrollSnapAlign: 'start' }}>
                        <ProductCardSkeleton />
                      </Box>
                    ))
                  : featuredProducts.map((product) => (
                      <Box key={`prod-${product.id}`} sx={{ flex: '0 0 auto', width: { xs: 220, sm: 250, md: 280 }, scrollSnapAlign: 'start' }}>
                        <ProductCard product={product} />
                      </Box>
                    ))}
              </Box>
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Button component={Link} to="/products" variant="outlined" sx={{ borderRadius: 'var(--radius-full)', fontWeight: 700, px: 4 }}>
                  Browse All Products
                </Button>
              </Box>
            </Box>
          </Container>
        </Box>
      )}

      {/* Brand Story / Welcome */}
      <Box sx={{ py: { xs: 6, md: 10 }, bgcolor: '#ffffff' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="overline" sx={{ color: 'var(--color-brand-primary)', fontWeight: 800, letterSpacing: 2 }}>Welcome to Kamyaabi</Typography>
              <Typography variant="h3" sx={{ fontFamily: 'var(--font-display)', fontWeight: 800, mb: 3, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
                Where Freshness Meets Flavor
              </Typography>
              <Typography variant="body1" sx={{ color: 'var(--color-text-secondary)', lineHeight: 1.8, mb: 4, fontSize: '1.05rem' }}>
                Kamyaabi is dedicated to offering the finest premium dry fruits, carefully handpicked for freshness and quality. We ensure each product retains its natural goodness and rich flavor, providing you with a healthy, flavorful snacking experience.
              </Typography>
              <Grid container spacing={2}>
                {welcomeImages.map((img, idx) => (
                  <Grid item xs={4} key={idx}>
                    <Box component="img" loading="lazy" src={img} alt="" sx={{ width: '100%', borderRadius: 'var(--radius-xl)', height: 120, objectFit: 'cover', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                  </Grid>
                ))}
              </Grid>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box component="img" loading="lazy" src="https://res.cloudinary.com/dsibez7to/image/upload/v1782551800/kamyaabi/assets/img/about/aboutUS.webp" alt="About Kamyaabi" sx={{ maxWidth: '100%', maxHeight: 500, objectFit: 'contain', filter: 'drop-shadow(0 20px 30px rgba(0,0,0,0.1))' }} />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Track Your Order */}
      <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: 'var(--color-surface-bg)' }}>
        <Container maxWidth="sm">
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Box sx={{ display: 'inline-flex', p: 2, bgcolor: 'rgba(29, 78, 216, 0.1)', borderRadius: '50%', mb: 2 }}>
              <LocalShipping sx={{ fontSize: 40, color: 'var(--color-brand-primary)' }} />
            </Box>
            <Typography variant="h4" sx={{ fontFamily: 'var(--font-display)', fontWeight: 800, mb: 1, letterSpacing: '-0.01em' }}>
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
            sx={{ display: 'flex', gap: 1.5, flexDirection: { xs: 'column', sm: 'row' } }}
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
                sx: { borderRadius: 'var(--radius-full)', bgcolor: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }
              }}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 'var(--radius-full)' } }}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={!trackQuery.trim()}
              sx={{ px: 4, borderRadius: 'var(--radius-full)', fontWeight: 700, textTransform: 'none', minWidth: 120, height: 56 }}
            >
              Track Now
            </Button>
          </Box>
          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button component={Link} to="/track-order" variant="text" size="small" sx={{ textTransform: 'none', color: 'text.secondary', fontWeight: 600 }}>
              Or track using AWB / tracking number →
            </Button>
          </Box>
        </Container>
      </Box>

      {/* Counters */}
      <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: 'var(--color-surface-dark)', color: '#fff', backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(29, 78, 216, 0.2) 0%, transparent 70%)' }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography variant="h3" sx={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.02em', mb: 2 }}>Your Gateway to Premium Dry Fruits</Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '1.1rem' }}>Meeting the Growing Demand for Premium Quality</Typography>
          </Box>
          <Grid container spacing={4} justifyContent="center">
            {counters.map((item, idx) => (
              <Grid item xs={6} sm={3} key={idx}>
                <Box sx={{ textAlign: 'center', p: 3, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 'var(--radius-xl)', border: '1px solid rgba(255,255,255,0.05)', height: '100%' }}>
                  <Box component="img" loading="lazy" src={item.icon} alt={item.label} sx={{ width: 64, height: 64, mb: 2, filter: 'brightness(0) invert(1) drop-shadow(0 4px 6px rgba(0,0,0,0.5))' }} />
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>{item.label}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <AmazonBanner variant="home" />

      {/* Testimonials */}
      <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: '#ffffff' }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Typography variant="overline" sx={{ color: 'var(--color-brand-primary)', fontWeight: 800, letterSpacing: 2 }}>TESTIMONIALS</Typography>
            <Typography variant="h3" sx={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.02em' }}>
              What Our Customers Say
            </Typography>
          </Box>
          <Box sx={{ 
            bgcolor: 'var(--color-surface-bg)', 
            p: { xs: 4, md: 6 }, 
            borderRadius: 'var(--radius-2xl)', 
            minHeight: 220, 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'center', 
            textAlign: 'center',
            position: 'relative',
            border: '1px solid rgba(0,0,0,0.04)'
          }}>
            <Typography variant="h1" sx={{ position: 'absolute', top: -20, left: 30, color: 'rgba(29, 78, 216, 0.1)', fontFamily: 'serif', fontSize: '8rem', lineHeight: 1 }}>"</Typography>
            <Typography variant="body1" sx={{ color: 'var(--color-text-primary)', lineHeight: 1.8, fontSize: '1.1rem', fontStyle: 'italic', mb: 3, position: 'relative', zIndex: 1 }}>
              {testimonials[currentTestimonial].text}
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: 'var(--color-brand-primary)' }}>— {testimonials[currentTestimonial].name}</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, mt: 4, justifyContent: 'center' }}>
            {testimonials.map((_, i) => (
              <Box key={i} onClick={() => setCurrentTestimonial(i)} sx={{ width: i === currentTestimonial ? 32 : 12, height: 8, borderRadius: 4, bgcolor: i === currentTestimonial ? 'var(--color-brand-primary)' : 'rgba(29, 78, 216, 0.2)', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' }} />
            ))}
          </Box>
        </Container>
      </Box>

      {/* FAQ */}
      <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: 'var(--color-surface-bg)' }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center', mb: 5 }}>
            <Typography variant="overline" sx={{ color: 'var(--color-brand-primary)', fontWeight: 800, letterSpacing: 2 }}>FAQ</Typography>
            <Typography variant="h3" sx={{ fontFamily: 'var(--font-display)', fontWeight: 800, letterSpacing: '-0.02em' }}>
              Frequently Asked Questions
            </Typography>
          </Box>
          <Box>
            {faqs.map((faq, i) => (
              <Accordion
                key={i}
                disableGutters
                elevation={0}
                sx={{
                  bgcolor: '#ffffff',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid rgba(0,0,0,0.06)',
                  mb: 2,
                  '&:before': { display: 'none' },
                  overflow: 'hidden',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore sx={{ color: 'var(--color-brand-primary)' }} />}
                  sx={{ px: { xs: 2.5, md: 3 }, py: 1, '& .MuiAccordionSummary-content': { my: 1.5 } }}
                >
                  <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--color-text-primary)' }}>
                    {faq.q}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ px: { xs: 2.5, md: 3 }, pt: 0, pb: 2.5 }}>
                  <Typography sx={{ color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
                    {faq.a}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </Container>
      </Box>

      {/* Floating WhatsApp Button */}
      <Box component="a" href={`${config.whatsappUrl}?text=Hello%20Kamyaabi`} target="_blank" rel="noopener noreferrer"
        sx={{ 
          position: 'fixed', 
          bottom: { xs: 80, md: 24 }, // higher on mobile due to bottom nav
          right: 24, 
          zIndex: 1000, 
          width: 56, 
          height: 56, 
          borderRadius: '50%', 
          overflow: 'hidden', 
          boxShadow: '0 8px 24px rgba(37, 211, 102, 0.4)', 
          '&:hover': { transform: 'scale(1.1) translateY(-4px)' }, 
          transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
        }}
      >
        <img loading="lazy" src="https://res.cloudinary.com/dsibez7to/image/upload/v1782551866/kamyaabi/assets/img/wicon.webp" alt="WhatsApp" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </Box>
    </Box>
    </PageTransition>
  );
};

export default HomePage;

