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
  MenuItem,
  Divider,
} from '@mui/material';
import { Person, Save } from '@mui/icons-material';
import { useAppSelector } from '../hooks/useAppDispatch';
import { profileApi, ProfileResponse, ProfileRequest } from '../api/profileApi';

interface FormData {
  firstName: string;
  lastName: string;
  addressLine1: string;
  addressLine2: string;
  state: string;
  city: string;
  pincode: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  addressLine1?: string;
  state?: string;
  city?: string;
  pincode?: string;
}

const ProfilePage: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState<FormData>({
    firstName: '',
    lastName: '',
    addressLine1: '',
    addressLine2: '',
    state: '',
    city: '',
    pincode: '',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [citiesLoading, setCitiesLoading] = useState(false);

  const fetchCities = useCallback(async (stateName: string) => {
    if (!stateName) {
      setCities([]);
      return;
    }
    setCitiesLoading(true);
    try {
      const response = await profileApi.getCities(stateName);
      setCities(response.data.data);
    } catch {
      setCities([]);
    } finally {
      setCitiesLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, statesRes] = await Promise.all([
          profileApi.getProfile(),
          profileApi.getStates(),
        ]);

        const profile: ProfileResponse = profileRes.data.data;
        setStates(statesRes.data.data);

        const nameParts = profile.name?.split(' ') || [];
        setFormData({
          firstName: profile.firstName || nameParts[0] || '',
          lastName: profile.lastName || nameParts.slice(1).join(' ') || '',
          addressLine1: profile.shippingAddress?.addressLine1 || '',
          addressLine2: profile.shippingAddress?.addressLine2 || '',
          state: profile.shippingAddress?.state || '',
          city: profile.shippingAddress?.city || '',
          pincode: profile.shippingAddress?.pincode || '',
        });

        if (profile.shippingAddress?.state) {
          const citiesRes = await profileApi.getCities(profile.shippingAddress.state);
          setCities(citiesRes.data.data);
        }
      } catch {
        setErrorMessage('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleStateChange = async (newState: string) => {
    setFormData((prev) => ({ ...prev, state: newState, city: '' }));
    setErrors((prev) => ({ ...prev, state: undefined, city: undefined }));
    await fetchCities(newState);
  };

  const handleChange = (field: keyof FormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setSuccessMessage('');
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    const hasAnyAddressField =
      formData.addressLine1.trim() ||
      formData.state ||
      formData.city ||
      formData.pincode.trim();

    if (hasAnyAddressField) {
      if (!formData.addressLine1.trim()) {
        newErrors.addressLine1 = 'Address Line 1 is required';
      }
      if (!formData.state) {
        newErrors.state = 'State is required';
      }
      if (!formData.city) {
        newErrors.city = 'City is required';
      }
      if (!formData.pincode.trim()) {
        newErrors.pincode = 'Pincode is required';
      } else if (!/^[1-9][0-9]{5}$/.test(formData.pincode.trim())) {
        newErrors.pincode = 'Pincode must be a valid 6-digit Indian pincode';
      }
    }

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
      const request: ProfileRequest = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
      };

      if (formData.addressLine1.trim()) {
        request.addressLine1 = formData.addressLine1.trim();
        request.addressLine2 = formData.addressLine2.trim();
        request.state = formData.state;
        request.city = formData.city;
        request.pincode = formData.pincode.trim();
        request.country = 'India';
      }

      const response = await profileApi.updateProfile(request);
      const profile = response.data.data;

      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        addressLine1: profile.shippingAddress?.addressLine1 || '',
        addressLine2: profile.shippingAddress?.addressLine2 || '',
        state: profile.shippingAddress?.state || '',
        city: profile.shippingAddress?.city || '',
        pincode: profile.shippingAddress?.pincode || '',
      });

      setSuccessMessage('Profile updated successfully!');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setErrorMessage(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: { xs: 2, md: 4 }, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar
            src={user?.avatarUrl || undefined}
            alt={user?.name}
            sx={{ width: 64, height: 64, bgcolor: 'primary.main' }}
          >
            {user?.name?.charAt(0) || <Person />}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>
              My Profile
            </Typography>
            <Typography variant="body2" color="text.secondary">
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

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="First Name"
                value={formData.firstName}
                onChange={handleChange('firstName')}
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
                value={formData.lastName}
                onChange={handleChange('lastName')}
                error={!!errors.lastName}
                helperText={errors.lastName}
                fullWidth
                required
                inputProps={{ maxLength: 100 }}
              />
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
            Shipping Address
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                label="Address Line 1"
                value={formData.addressLine1}
                onChange={handleChange('addressLine1')}
                error={!!errors.addressLine1}
                helperText={errors.addressLine1}
                fullWidth
                placeholder="House No., Building, Street"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Address Line 2 (Optional)"
                value={formData.addressLine2}
                onChange={handleChange('addressLine2')}
                fullWidth
                placeholder="Landmark, Area"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="State"
                value={formData.state}
                onChange={(e) => handleStateChange(e.target.value)}
                error={!!errors.state}
                helperText={errors.state}
                fullWidth
              >
                <MenuItem value="">
                  <em>Select State</em>
                </MenuItem>
                {states.map((state) => (
                  <MenuItem key={state} value={state}>
                    {state}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                label="City"
                value={formData.city}
                onChange={handleChange('city')}
                error={!!errors.city}
                helperText={errors.city || (citiesLoading ? 'Loading cities...' : '')}
                fullWidth
                disabled={!formData.state || citiesLoading}
              >
                <MenuItem value="">
                  <em>Select City</em>
                </MenuItem>
                {cities.map((city) => (
                  <MenuItem key={city} value={city}>
                    {city}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Pincode"
                value={formData.pincode}
                onChange={handleChange('pincode')}
                error={!!errors.pincode}
                helperText={errors.pincode}
                fullWidth
                placeholder="6-digit pincode"
                inputProps={{ maxLength: 6 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Country"
                value="India"
                fullWidth
                disabled
              />
            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              type="submit"
              variant="contained"
              size="large"
              startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save />}
              disabled={saving}
              sx={{
                px: 4,
                py: 1.5,
                borderRadius: 2,
                fontWeight: 600,
                textTransform: 'none',
                fontSize: '1rem',
              }}
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default ProfilePage;
