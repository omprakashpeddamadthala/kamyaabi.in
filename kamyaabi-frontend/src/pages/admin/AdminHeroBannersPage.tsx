import React from 'react';
import { Container, Typography } from '@mui/material';
import HeroBannersTab from '../../components/admin/HeroBannersTab';

const AdminHeroBannersPage: React.FC = () => (
  <Container maxWidth="lg" sx={{ py: 4 }}>
    <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Hero Banners</Typography>
    <HeroBannersTab active />
  </Container>
);

export default AdminHeroBannersPage;
