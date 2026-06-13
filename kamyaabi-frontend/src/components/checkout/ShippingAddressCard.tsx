import React from 'react';
import {
  Box,
  Button,
  Card,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material';
import { Add } from '@mui/icons-material';

import { Address } from '../../types';

interface ShippingAddressCardProps {
  addresses: Address[];
  selectedAddressId: number | null;
  onSelect: (id: number) => void;
  onAddAddress: () => void;
}

const ShippingAddressCard: React.FC<ShippingAddressCardProps> = ({
  addresses,
  selectedAddressId,
  onSelect,
  onAddAddress,
}) => (
  <Card sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', '&:hover': { transform: 'none' } }}>
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mb: 2,
        flexWrap: 'wrap',
        gap: 1,
      }}
    >
      <Typography variant="h6">Shipping Address</Typography>
      <Button startIcon={<Add />} onClick={onAddAddress}>
        Add Address
      </Button>
    </Box>

    {addresses.length === 0 ? (
      <Typography color="text.secondary">
        No addresses found. Please add a shipping address.
      </Typography>
    ) : (
      <RadioGroup
        value={selectedAddressId || ''}
        onChange={(e) => onSelect(Number(e.target.value))}
      >
        {addresses.map((addr) => (
          <FormControlLabel
            key={addr.id}
            value={addr.id}
            control={<Radio />}
            label={
              <Box>
                <Typography fontWeight={600}>{addr.fullName}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Phone: {addr.phone}
                </Typography>
              </Box>
            }
            sx={{ mb: 1, alignItems: 'flex-start' }}
          />
        ))}
      </RadioGroup>
    )}
  </Card>
);

export default ShippingAddressCard;
