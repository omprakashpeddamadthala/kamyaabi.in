import React from 'react';
import { Container, Typography } from '@mui/material';
import SettingsTab from '../../components/admin/SettingsTab';

const AdminSettingsPage: React.FC = () => (
  <Container maxWidth="lg" sx={{ py: 4 }}>
    <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Settings</Typography>
    <SettingsTab active />
  </Container>
);

export default AdminSettingsPage;
