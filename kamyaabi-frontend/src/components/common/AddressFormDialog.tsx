import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Box,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import { addressApi, AddressRequest } from '../../api/addressApi';
import { Address } from '../../types';

interface AddressFormDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editAddress?: Address | null;
}

interface FormErrors {
  fullName?: string;
  phone?: string;
  street?: string;
  state?: string;
  city?: string;
  pincode?: string;
}

const AddressFormDialog: React.FC<AddressFormDialogProps> = ({
  open,
  onClose,
  onSaved,
  editAddress,
}) => {
  const [formData, setFormData] = useState<AddressRequest>({
    fullName: '',
    phone: '',
    street: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [states, setStates] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const fetchCities = useCallback(async (stateName: string) => {
    if (!stateName) {
      setCities([]);
      return;
    }
    setCitiesLoading(true);
    try {
      const response = await addressApi.getCities(stateName);
      setCities(response.data.data);
    } catch {
      setCities([]);
    } finally {
      setCitiesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      addressApi.getStates().then((res) => setStates(res.data.data)).catch(() => {});

      if (editAddress) {
        setFormData({
          fullName: editAddress.fullName,
          phone: editAddress.phone,
          street: editAddress.street,
          addressLine2: editAddress.addressLine2 || '',
          city: editAddress.city,
          state: editAddress.state,
          pincode: editAddress.pincode,
          isDefault: editAddress.isDefault,
        });
        fetchCities(editAddress.state);
      } else {
        setFormData({
          fullName: '',
          phone: '',
          street: '',
          addressLine2: '',
          city: '',
          state: '',
          pincode: '',
          isDefault: false,
        });
        setCities([]);
      }
      setErrors({});
      setServerError('');
    }
  }, [open, editAddress, fetchCities]);

  const handleStateChange = async (newState: string) => {
    setFormData((prev) => ({ ...prev, state: newState, city: '' }));
    setErrors((prev) => ({ ...prev, state: undefined, city: undefined }));
    await fetchCities(newState);
  };

  const handleChange = (field: keyof AddressRequest) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
    setServerError('');
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone is required';
    } else if (!/^[6-9][0-9]{9}$/.test(formData.phone.trim())) {
      newErrors.phone = 'Enter a valid 10-digit Indian mobile number';
    }
    if (!formData.street.trim()) {
      newErrors.street = 'Street address is required';
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
      newErrors.pincode = 'Enter a valid 6-digit Indian pincode';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setSaving(true);
    setServerError('');
    try {
      const request: AddressRequest = {
        ...formData,
        fullName: formData.fullName.trim(),
        phone: formData.phone.trim(),
        street: formData.street.trim(),
        addressLine2: formData.addressLine2?.trim() || undefined,
        pincode: formData.pincode.trim(),
      };

      if (editAddress) {
        await addressApi.update(editAddress.id, request);
      } else {
        await addressApi.create(request);
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setServerError(error.response?.data?.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editAddress ? 'Edit Address' : 'Add New Address'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {serverError && (
            <Box sx={{ color: 'error.main', fontSize: '0.875rem' }}>{serverError}</Box>
          )}
          <TextField
            label="Full Name"
            value={formData.fullName}
            onChange={handleChange('fullName')}
            error={!!errors.fullName}
            helperText={errors.fullName}
            fullWidth
            required
            inputProps={{ maxLength: 100 }}
          />
          <TextField
            label="Phone Number"
            value={formData.phone}
            onChange={handleChange('phone')}
            error={!!errors.phone}
            helperText={errors.phone}
            fullWidth
            required
            placeholder="10-digit mobile number"
            inputProps={{ maxLength: 10 }}
          />
          <TextField
            label="Address Line 1"
            value={formData.street}
            onChange={handleChange('street')}
            error={!!errors.street}
            helperText={errors.street}
            fullWidth
            multiline
            rows={2}
            required
            placeholder="House No., Building, Street"
          />
          <TextField
            label="Address Line 2 (Optional)"
            value={formData.addressLine2 || ''}
            onChange={handleChange('addressLine2')}
            fullWidth
            placeholder="Landmark, Area"
          />
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                select
                label="State"
                value={formData.state}
                onChange={(e) => handleStateChange(e.target.value)}
                error={!!errors.state}
                helperText={errors.state}
                fullWidth
                required
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
            <Grid item xs={6}>
              <TextField
                select
                label="City"
                value={formData.city}
                onChange={handleChange('city')}
                error={!!errors.city}
                helperText={errors.city || (citiesLoading ? 'Loading cities...' : '')}
                fullWidth
                required
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
          </Grid>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <TextField
                label="Pincode"
                value={formData.pincode}
                onChange={handleChange('pincode')}
                error={!!errors.pincode}
                helperText={errors.pincode}
                fullWidth
                required
                placeholder="6-digit pincode"
                inputProps={{ maxLength: 6 }}
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                label="Country"
                value="India"
                fullWidth
                disabled
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={saving}
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : undefined}
        >
          {saving ? 'Saving...' : editAddress ? 'Update Address' : 'Save Address'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddressFormDialog;
