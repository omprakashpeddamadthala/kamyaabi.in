import React from 'react';
import { Box, Container, Grid, Skeleton } from '@mui/material';

const ProductDetailSkeleton: React.FC = () => (
  <Container maxWidth="lg" sx={{ py: 4 }}>
    <Skeleton variant="text" width={250} height={24} sx={{ mb: 3 }} animation="wave" />
    <Grid container spacing={3}>
      <Grid item xs={12} md={5}>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', gap: 1 }}>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rectangular" width={56} height={56} sx={{ borderRadius: 1 }} animation="wave" />
            ))}
          </Box>
          <Skeleton variant="rectangular" sx={{ flex: 1, height: 460, borderRadius: 2 }} animation="wave" />
        </Box>
      </Grid>
      <Grid item xs={12} md={4}>
        <Skeleton variant="text" width="40%" height={20} sx={{ mb: 1 }} animation="wave" />
        <Skeleton variant="text" width="90%" height={36} sx={{ mb: 1 }} animation="wave" />
        <Skeleton variant="text" width="60%" height={24} sx={{ mb: 2 }} animation="wave" />
        <Skeleton variant="text" width="50%" height={32} sx={{ mb: 2 }} animation="wave" />
        <Skeleton variant="text" width="100%" height={20} animation="wave" />
        <Skeleton variant="text" width="95%" height={20} animation="wave" />
        <Skeleton variant="text" width="80%" height={20} sx={{ mb: 3 }} animation="wave" />
      </Grid>
      <Grid item xs={12} md={3}>
        <Skeleton variant="rectangular" height={420} sx={{ borderRadius: 2 }} animation="wave" />
      </Grid>
    </Grid>
  </Container>
);

export default ProductDetailSkeleton;
