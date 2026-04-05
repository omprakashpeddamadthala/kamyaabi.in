import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Avatar,
  Alert,
  CircularProgress,
  Divider,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Person,
  Save,
  Add,
  Edit,
  Delete,
  Home,
  Phone,
  LocationOn,
  Star,
  StarBorder,
} from '@mui/icons-material';
import { useAppSelector } from '../hooks/useAppDispatch';
import { profileApi, ProfileResponse } from '../api/profileApi';
import { addressApi } from '../api/addressApi';
import { Address } from '../types';
import AddressFormDialog from '../components/common/AddressFormDialog';

interface FormErrors {
  firstName?: string;
  lastName?: string;
}

// Skeleton loader for profile page
const ProfileSkeleton: React.FC = () => (
  <Container maxWidth="md" sx={{ py: 4 }}>
    <Paper elevation={2} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Skeleton variant="circular" width={64} height={64} animation="wave" />
        <Box>
          <Skeleton variant="text" width={150} height={32} animation="wave" />
          <Skeleton variant="text" width={200} height={20} animation="wave" />
        </Box>
      </Box>
      <Skeleton variant="text" width={180} height={28} sx={{ mb: 2 }} animation="wave" />
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} animation="wave" />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} animation="wave" />
        </Grid>
      </Grid>
    </Paper>
    <Paper elevation={2} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3 }}>
      <Skeleton variant="text" width={200} height={28} sx={{ mb: 2 }} animation="wave" />
      <Grid container spacing={2}>
        {[1, 2].map((i) => (
          <Grid item xs={12} sm={6} key={i}>
            <Skeleton variant="rectangular" height={180} sx={{ borderRadius: 1 }} animation="wave" />
          </Grid>
        ))}
      </Grid>
    </Paper>
  </Container>
);

const ProfilePage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [settingDefault, setSettingDefault] = useState<number | null>(null);

  const [addressDialogOpen, setAddressDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAddressId, setDeletingAddressId] = useState<number | null>(null);
  const [deletingAddress, setDeletingAddress] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const profileRes = await profileApi.getProfile();
      const profile: ProfileResponse = profileRes.data.data;

      const nameParts = profile.name?.split(' ') || [];
      setFirstName(profile.firstName || nameParts[0] || '');
      setLastName(profile.lastName || nameParts.slice(1).join(' ') || '');
      setAddresses(profile.addresses || []);
    } catch {
      setErrorMessage('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const loadAddresses = useCallback(async () => {
    try {
      const res = await addressApi.getAll();
      setAddresses(res.data.data);
    } catch {
      // addresses already loaded from profile
    }
  }, []);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    if (!validateForm()) return;

    setSaving(true);
    try {
      const response = await profileApi.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      const profile = response.data.data;
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setSuccessMessage('Profile updated successfully!');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setErrorMessage(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAddress = () => {
    setEditingAddress(null);
    setAddressDialogOpen(true);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setAddressDialogOpen(true);
  };

  const handleDeleteClick = (addressId: number) => {
    setDeletingAddressId(addressId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingAddressId) return;
    setDeletingAddress(true);
    try {
      await addressApi.delete(deletingAddressId);
      setDeleteDialogOpen(false);
      setDeletingAddressId(null);
      loadAddresses();
      setSuccessMessage('Address deleted successfully');
    } catch {
      setErrorMessage('Failed to delete address');
    } finally {
      setDeletingAddress(false);
    }
  };

  const handleSetDefault = async (address: Address) => {
    setSettingDefault(address.id);
    try {
      await addressApi.update(address.id, {
        fullName: address.fullName,
        phone: address.phone,
        street: address.street,
        addressLine2: address.addressLine2 || undefined,
        city: address.city,
        state: address.state,
        pincode: address.pincode,
        isDefault: true,
      });
      loadAddresses();
      setSuccessMessage('Default address updated');
    } catch {
      setErrorMessage('Failed to set default address');
    } finally {
      setSettingDefault(null);
    }
  };

  const handleAddressSaved = () => {
    loadAddresses();
    setSuccessMessage(editingAddress ? 'Address updated successfully!' : 'Address added successfully!');
  };

  if (loading) {
    return <ProfileSkeleton />;
  }

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2, md: 4 } }}>
      {/* Profile Header & Personal Info */}
      <Paper elevation={2} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          <Avatar
            src={user?.avatarUrl || undefined}
            alt={user?.name}
            sx={{ width: { xs: 48, md: 64 }, height: { xs: 48, md: 64 }, bgcolor: 'primary.main' }}
          >
            {user?.name?.charAt(0) || <Person />}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant={isMobile ? 'h6' : 'h5'} fontWeight={700} noWrap>
              My Profile
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {user?.email}
            </Typography>
          </Box>
        </Box>

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
            {successMessage}
          </Alert>
        )}
        {errorMessage && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMessage('')}>
            {errorMessage}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Personal Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name"
                value={firstName}
                onChange={(e) => { setFirstName(e.target.value); setErrors((p) => ({ ...p, firstName: undefined })); setSuccessMessage(''); }}
                error={!!errors.firstName}
                helperText={errors.firstName}
                fullWidth
                required
                inputProps={{ maxLength: 100 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Last Name"
                value={lastName}
                onChange={(e) => { setLastName(e.target.value); setErrors((p) => ({ ...p, lastName: undefined })); setSuccessMessage(''); }}
                error={!!errors.lastName}
                helperText={errors.lastName}
                fullWidth
                required
                inputProps={{ maxLength: 100 }}
              />
            </Grid>
          </Grid>
          <Box sx={{ mt: 3, display: 'flex', justifyContent: { xs: 'center', sm: 'flex-end' } }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              fullWidth={isMobile}
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
              disabled={saving}
              sx={{ px: 4, py: 1.5, borderRadius: 2, fontWeight: 600, textTransform: 'none', fontSize: '1rem' }}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Shipping Addresses */}
      <Paper elevation={2} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          mb: 3,
          flexWrap: 'wrap',
          gap: 1,
        }}>
          <Typography variant="h6" fontWeight={600}>
            <Home sx={{ verticalAlign: 'middle', mr: 1 }} />
            Shipping Addresses
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            onClick={handleAddAddress}
            size={isMobile ? 'small' : 'medium'}
          >
            Add Address
          </Button>
        </Box>

        {addresses.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <LocationOn sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">
              No addresses saved yet. Add your first shipping address.
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {addresses.map((addr) => (
              <Grid item xs={12} sm={6} key={addr.id}>
                <Card
                  variant="outlined"
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderColor: addr.isDefault ? 'primary.main' : 'divider',
                    borderWidth: addr.isDefault ? 2 : 1,
                    transition: 'border-color 0.2s ease',
                  }}
                >
                  <CardContent sx={{ pb: 1, flexGrow: 1 }}>
                    {addr.isDefault && (
                      <Chip label="Default" color="primary" size="small" sx={{ mb: 1 }} />
                    )}
                    <Typography fontWeight={600}>{addr.fullName}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {addr.street}
                    </Typography>
                    {addr.addressLine2 && (
                      <Typography variant="body2" color="text.secondary">
                        {addr.addressLine2}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary">
                      {addr.city}, {addr.state} - {addr.pincode}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      <Phone sx={{ fontSize: 16, mr: 0.5, color: 'text.disabled' }} />
                      <Typography variant="body2" color="text.secondary">
                        {addr.phone}
                      </Typography>
                    </Box>
                  </CardContent>
                  <Divider />
                  <CardActions>
                    <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => handleEditAddress(addr)}>
                        <Edit fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton size="small" color="error" onClick={() => handleDeleteClick(addr.id)}>
                        <Delete fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    {!addr.isDefault && (
                      <Tooltip title="Set as Default">
                        <IconButton 
                          size="small" 
                          onClick={() => handleSetDefault(addr)}
                          disabled={settingDefault === addr.id}
                        >
                          {settingDefault === addr.id ? (
                            <CircularProgress size={18} />
                          ) : (
                            <StarBorder fontSize="small" />
                          )}
                        </IconButton>
                      </Tooltip>
                    )}
                    {addr.isDefault && (
                      <Tooltip title="Default Address">
                        <Star fontSize="small" color="primary" sx={{ ml: 0.5 }} />
                      </Tooltip>
                    )}
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Address Form Dialog */}
      <AddressFormDialog
        open={addressDialogOpen}
        onClose={() => setAddressDialogOpen(false)}
        onSaved={handleAddressSaved}
        editAddress={editingAddress}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => !deletingAddress && setDeleteDialogOpen(false)}>
        <DialogTitle>Delete Address</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this address? This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} disabled={deletingAddress}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDeleteConfirm}
            disabled={deletingAddress}
            startIcon={deletingAddress ? <CircularProgress size={18} color="inherit" /> : undefined}
          >
            {deletingAddress ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ProfilePage;
