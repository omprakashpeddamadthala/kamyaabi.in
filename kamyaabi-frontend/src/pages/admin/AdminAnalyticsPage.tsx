import React from 'react';
import { Container, Typography } from '@mui/material';
import AnalyticsTab from '../../components/admin/AnalyticsTab';

const AdminAnalyticsPage: React.FC = () => (
  <Container maxWidth="lg" sx={{ py: 4 }}>
    <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Analytics</Typography>
    <AnalyticsTab active />
  </Container>
);

export default AdminAnalyticsPage;
