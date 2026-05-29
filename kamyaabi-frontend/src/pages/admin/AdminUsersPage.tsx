import React from 'react';
import { Container, Typography } from '@mui/material';
import UsersTab from '../../components/admin/UsersTab';
import { useAppSelector } from '../../hooks/useAppDispatch';

const AdminUsersPage: React.FC = () => {
  const currentUser = useAppSelector((state) => state.auth.user);
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: 700, mb: 3 }}>Users</Typography>
      <UsersTab active currentUserId={currentUser?.id} />
    </Container>
  );
};

export default AdminUsersPage;
