import React from 'react';
import { Button, Container, Typography } from '@mui/material';
import { Link } from 'react-router-dom';
import Seo from '../components/common/Seo';

const NotFoundPage: React.FC = () => (
  <Container maxWidth="sm" sx={{ py: 10, textAlign: 'center' }}>
    <Seo
      title="Page Not Found"
      description="The requested Kamyaabi page could not be found."
      canonicalPath="/404"
      noindex
    />
    <Typography component="h1" variant="h3" gutterBottom>Page Not Found</Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>
      The page may have moved or no longer exists.
    </Typography>
    <Button component={Link} to="/" variant="contained">Return Home</Button>
  </Container>
);

export default NotFoundPage;
