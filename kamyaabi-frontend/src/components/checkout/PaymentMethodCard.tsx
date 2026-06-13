import React from 'react';
import {
  Box,
  Card,
  FormControlLabel,
  Radio,
  RadioGroup,
  Typography,
} from '@mui/material';
import { CreditCardOutlined, LocalShippingOutlined } from '@mui/icons-material';

import { PaymentMethod } from '../../types';

interface PaymentMethodCardProps {
  paymentMethod: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
}

const PaymentMethodCard: React.FC<PaymentMethodCardProps> = ({ paymentMethod, onChange }) => (
  <Card sx={{ p: { xs: 2, sm: 3 }, mb: { xs: 2, sm: 3 }, borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', '&:hover': { transform: 'none' } }}>
    <Typography variant="h6" sx={{ mb: 2 }}>
      Payment Method
    </Typography>
    <RadioGroup
      value={paymentMethod}
      onChange={(e) => onChange(e.target.value as PaymentMethod)}
    >
      <FormControlLabel
        value="PREPAID"
        control={<Radio />}
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CreditCardOutlined fontSize="small" color="primary" />
            <Box>
              <Typography fontWeight={600}>Pay Online (Razorpay)</Typography>
              <Typography variant="body2" color="text.secondary">
                UPI, cards, net banking, and wallets. Order ships once payment is confirmed.
              </Typography>
            </Box>
          </Box>
        }
        sx={{ mb: 1, alignItems: 'flex-start' }}
      />
      <FormControlLabel
        value="COD"
        control={<Radio />}
        label={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LocalShippingOutlined fontSize="small" color="primary" />
            <Box>
              <Typography fontWeight={600}>Cash on Delivery</Typography>
              <Typography variant="body2" color="text.secondary">
                Pay in cash when your order is delivered. We'll ship it via Shiprocket.
              </Typography>
            </Box>
          </Box>
        }
        sx={{ alignItems: 'flex-start' }}
      />
    </RadioGroup>
  </Card>
);

export default PaymentMethodCard;
