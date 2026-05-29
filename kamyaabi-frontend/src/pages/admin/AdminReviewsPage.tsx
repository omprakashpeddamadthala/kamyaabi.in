import React from 'react';
import { Container, Typography } from '@mui/material';
import AdminReviewsPanel from '../../components/admin/AdminReviewsPanel';

const AdminReviewsPage: React.FC = () => (
  <Container maxWidth="lg" sx={{ py: 4 }}>
    <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Reviews</Typography>
    <AdminReviewsPanel active />
  </Container>
);

export default AdminReviewsPage;
