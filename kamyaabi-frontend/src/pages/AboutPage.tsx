/*
 * UI REDESIGN AUDIT — PRESERVED FUNCTIONALITY
 * - Preserves static about content, images, and routing.
 * - Visual-only tokenization of section backgrounds and typography.
 */
import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, Grid, Skeleton } from '@mui/material';
import SocialLinks from '../components/common/SocialLinks';
import { galleryApi, GalleryImage } from '../api/galleryApi';

const fallbackGalleryImages = [
  '/assets/img/categorie/gallery1.webp', '/assets/img/categorie/gallery2.webp',
  '/assets/img/categorie/gallery3.webp', '/assets/img/categorie/gallery4.webp',
  '/assets/img/categorie/gallery5.webp', '/assets/img/categorie/gallery6.webp',
];

const AboutPage: React.FC = () => {
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [galleryLoading, setGalleryLoading] = useState(true);

  useEffect(() => {
    galleryApi.getAll()
      .then((res) => setGalleryImages(res.data.data ?? []))
      .catch(() => setGalleryImages([]))
      .finally(() => setGalleryLoading(false));
  }, []);
  return (
    <Box>
      {}
      <Box sx={{ bgcolor: 'var(--color-surface-bg)', py: { xs: 6, md: 10 }, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, letterSpacing: 2 }}>About Us</Typography>
          <Typography variant="h3" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mt: 1 }}>
            Kamyaabi: Where Freshness Meets Flavor
          </Typography>
        </Container>
      </Box>

      {}
      <Box sx={{ py: 8, bgcolor: '#fff' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <Typography variant="h4" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mb: 3 }}>
                Who We Are
              </Typography>
              <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.8, mb: 3 }}>
                Kamyaabi is dedicated to offering the finest premium dry fruits, carefully handpicked for freshness and quality. We ensure each product retains its natural goodness and rich flavor, providing you with a healthy, flavorful snacking experience.
              </Typography>
              <Typography variant="body1" sx={{ color: '#666', lineHeight: 1.8 }}>
                With a focus on freshness and customer satisfaction, we source our products directly from the best farms. Our commitment to quality means every nut, every dried fruit, and every seed is selected to meet the highest standards.
              </Typography>
            </Grid>
            <Grid item xs={12} md={6} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box component="img" src="/assets/img/about/aboutUS.webp" alt="About Kamyaabi" sx={{ maxWidth: '100%', maxHeight: 400, objectFit: 'contain', borderRadius: 3 }} />
            </Grid>
          </Grid>
        </Container>
      </Box>

      {}
      <Box sx={{ py: 8, bgcolor: 'var(--color-surface-bg)' }}>
        <Container maxWidth="lg">
          <Typography variant="h4" align="center" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mb: 4 }}>
            Our Values
          </Typography>
          <Grid container spacing={4}>
            {[
              { title: 'Premium Quality', desc: 'We source only the finest dry fruits from trusted farms worldwide.' },
              { title: 'Natural Freshness', desc: 'Every product is packed to preserve its natural flavor and nutritional value.' },
              { title: 'Customer First', desc: 'Your satisfaction is our priority. We go above and beyond to serve you better.' },
              { title: 'Sustainable Sourcing', desc: 'We believe in responsible sourcing that supports farmers and the environment.' },
            ].map((item, idx) => (
              <Grid item xs={12} sm={6} md={3} key={idx}>
                <Box sx={{ textAlign: 'center', p: 3, bgcolor: '#fff', borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.06)', height: '100%' }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: 'primary.main', mb: 1 }}>{item.title}</Typography>
                  <Typography variant="body2" sx={{ color: '#666' }}>{item.desc}</Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {}
      <Box sx={{ py: 8, bgcolor: '#fff' }}>
        <Container maxWidth="lg">
          <Typography variant="h4" align="center" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mb: 4 }}>
            Our Gallery
          </Typography>
          <Grid container spacing={2}>
            {galleryLoading ? (
              Array.from({ length: 6 }).map((_, idx) => (
                <Grid item xs={6} sm={4} key={idx}>
                  <Skeleton variant="rectangular" sx={{ width: '100%', height: { xs: 150, md: 220 }, borderRadius: 2 }} />
                </Grid>
              ))
            ) : (galleryImages.length > 0 ? galleryImages : fallbackGalleryImages.map((url, i) => ({ id: i, imageUrl: url, publicId: null, displayOrder: i, uploadedAt: '' }))).map((img) => (
              <Grid item xs={6} sm={4} key={img.id}>
                <Box component="img" src={img.imageUrl} alt={`Gallery ${img.id}`} sx={{ width: '100%', height: { xs: 150, md: 220 }, objectFit: 'cover', borderRadius: 2, transition: 'transform 0.3s', '&:hover': { transform: 'scale(1.05)' } }} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      <Box sx={{ py: 8, bgcolor: 'var(--color-surface-bg)', textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h4" sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, mb: 2 }}>
            Connect With Us
          </Typography>
          <Typography variant="body1" sx={{ color: '#666', mb: 3 }}>
            Follow Kamyaabi on social media for the latest products, offers and updates.
          </Typography>
          <SocialLinks size={32} color="#1A1A1A" gap={1.5} sx={{ justifyContent: 'center' }} />
        </Container>
      </Box>
    </Box>
  );
};

export default AboutPage;
