import React from 'react';
import { Box, Card, Typography } from '@mui/material';

import { CartItem } from '../../types';

interface OrderItemsCardProps {
  items: CartItem[];
}

const OrderItemsCard: React.FC<OrderItemsCardProps> = ({ items }) => (
  <Card sx={{ p: { xs: 2, sm: 3 }, borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-card)', '&:hover': { transform: 'none' } }}>
    <Typography variant="h6" sx={{ mb: 2 }}>
      Order Items
    </Typography>
    {items.map((item) => (
      <Box
        key={item.id}
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 1,
          mb: 1,
        }}
      >
        <Typography sx={{ minWidth: 0, wordBreak: 'break-word' }}>
          {item.productName} x {item.quantity}
        </Typography>
        <Typography fontWeight={600} sx={{ whiteSpace: 'nowrap' }}>
          ₹{item.subtotal}
        </Typography>
      </Box>
    ))}
  </Card>
);

export default OrderItemsCard;
