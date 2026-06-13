import React from 'react';
import { Link } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, TextField, Typography } from '@mui/material';
import { CheckCircle, Close, LocalShippingOutlined } from '@mui/icons-material';
import type { PincodeServiceability } from '../../api/shippingApi';
import type { User } from '../../types';

interface DeliverySectionProps {
  user: User | null;
  pincode: string;
  setPincode: (value: string) => void;
  pincodeResult: PincodeServiceability | null;
  setPincodeResult: (value: PincodeServiceability | null) => void;
  pincodeLoading: boolean;
  pincodeError: string;
  setPincodeError: (value: string) => void;
  hasNoAddress: boolean;
  onCheckPincode: () => void;
}

const DeliverySection: React.FC<DeliverySectionProps> = ({
  user,
  pincode,
  setPincode,
  pincodeResult,
  setPincodeResult,
  pincodeLoading,
  pincodeError,
  setPincodeError,
  hasNoAddress,
  onCheckPincode,
}) => (
  <Box sx={{ mt: 2, mb: 1 }}>
    <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: '#0F1111' }}>
      Delivery
    </Typography>
    {user ? (
      <>
        {hasNoAddress && !pincodeResult && !pincode && (
          <Box
            sx={{
              p: 2,
              mb: 1,
              borderRadius: 2,
              bgcolor: '#FFFBEB',
              border: '1px solid #FEF3C7',
              textAlign: 'center',
            }}
          >
            <LocalShippingOutlined sx={{ fontSize: 28, color: '#D97706', mb: 0.5 }} />
            <Typography variant="body2" sx={{ color: '#92400E', mb: 1.5 }}>
              Add your delivery address to see estimated delivery date
            </Typography>
            <Button
              component={Link}
              to="/profile"
              variant="contained"
              size="small"
              sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 3 }}
            >
              Add Address
            </Button>
          </Box>
        )}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          <TextField
            size="small"
            placeholder="Enter pincode"
            value={pincode}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setPincode(val);
              if (pincodeResult) setPincodeResult(null);
              if (pincodeError) setPincodeError('');
            }}
            onKeyDown={(e) => { if (e.key === 'Enter') onCheckPincode(); }}
            inputProps={{ maxLength: 6, inputMode: 'numeric', pattern: '[0-9]*' }}
            sx={{
              flex: 1,
              maxWidth: 200,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                bgcolor: 'var(--color-surface-bg)',
              },
            }}
          />
          <Button
            variant="outlined"
            size="small"
            onClick={onCheckPincode}
            disabled={pincodeLoading || pincode.trim().length !== 6}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              minWidth: 80,
              py: 0.9,
            }}
          >
            {pincodeLoading ? <CircularProgress size={20} /> : 'Check'}
          </Button>
        </Box>

        {pincodeError && (
          <Alert severity="error" sx={{ mt: 1, py: 0, fontSize: 'var(--text-sm)' }}>
            {pincodeError}
          </Alert>
        )}

        {pincodeResult && (
          <Box
            sx={{
              mt: 1,
              p: 1.5,
              borderRadius: 2,
              bgcolor: pincodeResult.serviceable ? '#F0FFF4' : '#FFF5F5',
              border: '1px solid',
              borderColor: pincodeResult.serviceable ? '#C6F6D5' : '#FED7D7',
            }}
          >
            {pincodeResult.serviceable ? (
              <>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                  <CheckCircle sx={{ color: '#38A169', fontSize: 18 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#276749' }}>
                    Delivery available to {pincodeResult.pincode}
                  </Typography>
                </Box>
                {pincodeResult.city && pincodeResult.state && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 2.8 }}>
                    {pincodeResult.city}, {pincodeResult.state}
                  </Typography>
                )}
                {pincodeResult.estimatedDays && (() => {
                  const edd = new Date();
                  edd.setDate(edd.getDate() + pincodeResult.estimatedDays!);
                  const formatted = edd.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
                  return (
                    <Typography variant="caption" sx={{ display: 'block', ml: 2.8, color: '#276749', fontWeight: 600 }}>
                      Estimated delivery by {formatted}
                    </Typography>
                  );
                })()}
                {pincodeResult.codAvailable === 'Yes' && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 2.8 }}>
                    Cash on Delivery available
                  </Typography>
                )}
              </>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Close sx={{ color: '#E53E3E', fontSize: 18 }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#9B2C2C' }}>
                  {pincodeResult.message || 'Delivery is not available to this pincode'}
                </Typography>
              </Box>
            )}
          </Box>
        )}
      </>
    ) : (
      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          bgcolor: 'var(--color-surface-bg)',
          border: '1px solid',
          borderColor: 'divider',
          textAlign: 'center',
        }}
      >
        <LocalShippingOutlined sx={{ fontSize: 28, color: 'text.secondary', mb: 0.5 }} />
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          Log in to see estimated delivery for your location
        </Typography>
        <Button
          component={Link}
          to={`/login?redirect=${encodeURIComponent(window.location.pathname)}`}
          variant="contained"
          size="small"
          sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2, px: 3 }}
        >
          Login
        </Button>
      </Box>
    )}
  </Box>
);

export default DeliverySection;
