import React from 'react';
import { Card, CardContent, Box, Skeleton } from '@mui/material';

const ProductCardSkeleton: React.FC = () => {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Skeleton variant="rectangular" height={220} animation="wave" />
      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Skeleton variant="text" width="40%" height={20} sx={{ mb: 0.5 }} animation="wave" />
        <Skeleton variant="text" width="80%" height={24} sx={{ mb: 1 }} animation="wave" />
        <Skeleton variant="text" width="30%" height={18} sx={{ mb: 1 }} animation="wave" />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, mt: 'auto' }}>
          <Skeleton variant="text" width="35%" height={28} animation="wave" />
          <Skeleton variant="text" width="25%" height={20} animation="wave" />
        </Box>
        <Skeleton variant="rectangular" height={36} animation="wave" sx={{ borderRadius: 1 }} />
      </CardContent>
    </Card>
  );
};

export default ProductCardSkeleton;
