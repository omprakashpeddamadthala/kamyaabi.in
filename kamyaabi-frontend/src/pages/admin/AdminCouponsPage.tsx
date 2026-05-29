import React from 'react';
import { Container, Typography } from '@mui/material';
import AdminCouponsTab from '../../components/admin/AdminCouponsTab';

const AdminCouponsPage: React.FC = () => (
  <Container maxWidth="lg" sx={{ py: 4 }}>
    <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Coupons</Typography>
    <AdminCouponsTab active />
  </Container>
);

export default AdminCouponsPage;
