import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Button,
  Card,
  CardMedia,
  CardContent,
} from '@mui/material';
import { ArrowForward } from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchFeaturedProducts, fetchCategories } from '../features/product/productSlice';
import ProductCard from '../components/common/ProductCard';
import Loading from '../components/common/Loading';

const HomePage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { featuredProducts, categories, loading } = useAppSelector((state) => state.products);

  useEffect(() => {
    dispatch(fetchFeaturedProducts());
    dispatch(fetchCategories());
  }, [dispatch]);

  return (
    <Box>
      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #8B6914 0%, #B8941E 50%, #5C460D 100%)',
          color: '#FFFFFF',
          py: { xs: 8, md: 12 },
          textAlign: 'center',
        }}
      >
        <Container maxWidth="md">
          <Typography
            variant="h2"
            sx={{
              fontFamily: '"Playfair Display", serif',
              fontWeight: 700,
              mb: 2,
              fontSize: { xs: '2rem', md: '3.5rem' },
            }}
          >
            Premium Dry Fruits
          </Typography>
          <Typography
            variant="h5"
            sx={{ mb: 4, opacity: 0.9, fontWeight: 300, fontSize: { xs: '1rem', md: '1.5rem' } }}
          >
            Where freshness meets flavor — sourced from the finest farms, delivered to your doorstep
          </Typography>
          <Button
            component={Link}
            to="/products"
            variant="contained"
            size="large"
            endIcon={<ArrowForward />}
            sx={{
              bgcolor: '#FFFFFF',
              color: '#8B6914',
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              '&:hover': { bgcolor: '#F5F5F0', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' },
            }}
          >
            Shop Now
          </Button>
        </Container>
      </Box>

      {/* Categories Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography variant="h3" align="center" sx={{ mb: 1 }}>
          Our Categories
        </Typography>
        <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
          Explore our wide range of premium dry fruits
        </Typography>
        <Grid container spacing={3}>
          {categories.map((category) => (
            <Grid item xs={6} sm={3} key={category.id}>
              <Card
                component={Link}
                to={`/products?category=${category.id}`}
                sx={{ textDecoration: 'none', textAlign: 'center' }}
              >
                <CardMedia
                  component="img"
                  height="160"
                  image={category.imageUrl || 'https://via.placeholder.com/300x160?text=Category'}
                  alt={category.name}
                  sx={{ objectFit: 'cover' }}
                />
                <CardContent>
                  <Typography variant="h6" sx={{ fontSize: '1rem' }}>
                    {category.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {category.productCount} products
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>

      {/* Featured Products Section */}
      <Box sx={{ bgcolor: '#F5F5F0', py: 8 }}>
        <Container maxWidth="lg">
          <Typography variant="h3" align="center" sx={{ mb: 1 }}>
            Featured Products
          </Typography>
          <Typography variant="body1" align="center" color="text.secondary" sx={{ mb: 4 }}>
            Handpicked premium selections for you
          </Typography>
          {loading ? (
            <Loading />
          ) : (
            <Grid container spacing={3}>
              {featuredProducts.map((product) => (
                <Grid item xs={6} sm={4} md={3} key={product.id}>
                  <ProductCard product={product} />
                </Grid>
              ))}
            </Grid>
          )}
          <Box sx={{ textAlign: 'center', mt: 4 }}>
            <Button
              component={Link}
              to="/products"
              variant="outlined"
              color="primary"
              size="large"
              endIcon={<ArrowForward />}
            >
              View All Products
            </Button>
          </Box>
        </Container>
      </Box>

      {/* USP Section */}
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Grid container spacing={4}>
          {[
            { title: 'Farm Fresh', desc: 'Directly sourced from premium farms across India' },
            { title: 'Quality Assured', desc: 'Rigorous quality checks to ensure the finest products' },
            { title: 'Fast Delivery', desc: 'Swift delivery to your doorstep within 3-5 business days' },
            { title: 'Secure Payments', desc: 'Safe and secure payment gateway with Razorpay' },
          ].map((item, index) => (
            <Grid item xs={6} md={3} key={index}>
              <Box sx={{ textAlign: 'center', p: 2 }}>
                <Typography variant="h6" sx={{ mb: 1, color: 'primary.main' }}>
                  {item.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {item.desc}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
};

export default HomePage;
