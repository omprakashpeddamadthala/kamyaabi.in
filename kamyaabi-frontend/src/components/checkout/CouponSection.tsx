import React from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
  TextField,
  Typography,
} from '@mui/material';
import {
  Close,
  ContentCopy,
  ExpandLess,
  ExpandMore,
  LocalOffer,
} from '@mui/icons-material';

import { Coupon } from '../../types';
import { useCheckoutCoupons } from '../../hooks/useCheckoutCoupons';

interface CouponSectionProps {
  coupon: ReturnType<typeof useCheckoutCoupons>;
}

const formatDiscountLabel = (coupon: Coupon) => {
  if (coupon.discountType === 'PERCENTAGE') {
    return `${coupon.discountValue}% OFF`;
  }
  return `₹${coupon.discountValue} OFF`;
};

const CouponSection: React.FC<CouponSectionProps> = ({ coupon }) => {
  const {
    couponCode,
    setCouponCode,
    couponLoading,
    couponResult,
    couponError,
    setCouponError,
    availableCoupons,
    showAvailableCoupons,
    setShowAvailableCoupons,
    validateCoupon,
    applyAvailableCoupon,
    removeCoupon,
  } = coupon;

  return (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="subtitle1"
        sx={{
          mb: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          fontWeight: 600,
          color: 'primary.main',
        }}
      >
        <LocalOffer fontSize="small" /> Apply Promo Code
      </Typography>

      {couponResult ? (
        <Box>
          <Alert
            severity="success"
            sx={{ mb: 1 }}
            action={
              <IconButton size="small" onClick={removeCoupon} color="inherit">
                <Close fontSize="small" />
              </IconButton>
            }
          >
            <Typography variant="body2" fontWeight={600}>
              {couponResult.code} applied!
            </Typography>
            <Typography variant="body2">
              You save ₹{couponResult.discountAmount}
              {couponResult.discountType === 'PERCENTAGE' && ` (${couponResult.discountValue}% off)`}
            </Typography>
          </Alert>
        </Box>
      ) : (
        <Box>
          <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
            <TextField
              size="small"
              placeholder="Enter promo code"
              value={couponCode}
              onChange={(e) => {
                setCouponCode(e.target.value.toUpperCase());
                if (couponError) setCouponError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') validateCoupon();
              }}
              disabled={couponLoading}
              sx={{ flex: 1 }}
              inputProps={{ style: { textTransform: 'uppercase' } }}
            />
            <Button
              variant="contained"
              onClick={() => validateCoupon()}
              disabled={couponLoading || !couponCode.trim()}
              sx={{ minWidth: 80, height: 40 }}
            >
              {couponLoading ? <CircularProgress size={20} color="inherit" /> : 'Apply'}
            </Button>
          </Box>

          {couponError && (
            <Alert severity="error" sx={{ mb: 1, py: 0 }} variant="outlined">
              <Typography variant="body2">{couponError}</Typography>
            </Alert>
          )}

          {availableCoupons.length > 0 && (
            <Box sx={{ mt: 1 }}>
              <Button
                size="small"
                onClick={() => setShowAvailableCoupons(!showAvailableCoupons)}
                endIcon={showAvailableCoupons ? <ExpandLess /> : <ExpandMore />}
                sx={{ textTransform: 'none', px: 0 }}
              >
                {showAvailableCoupons ? 'Hide' : 'View'} Available Coupons ({availableCoupons.length})
              </Button>
              <Collapse in={showAvailableCoupons}>
                <Box
                  sx={{
                    mt: 1,
                    maxHeight: 240,
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1,
                  }}
                >
                  {availableCoupons.map((c) => (
                    <Box
                      key={c.id}
                      sx={{
                        p: 1.5,
                        border: '1px dashed',
                        borderColor: 'primary.main',
                        borderRadius: 1,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        bgcolor: 'action.hover',
                      }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Chip
                            label={c.code}
                            size="small"
                            color="primary"
                            variant="outlined"
                            sx={{ fontWeight: 700, fontFamily: 'monospace' }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => {
                              navigator.clipboard.writeText(c.code);
                            }}
                            title="Copy code"
                          >
                            <ContentCopy sx={{ fontSize: 14 }} />
                          </IconButton>
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                          {formatDiscountLabel(c)}
                          {c.expiresAt && ` · Expires ${new Date(c.expiresAt).toLocaleDateString()}`}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => applyAvailableCoupon(c.code)}
                        disabled={couponLoading}
                        sx={{ ml: 1, minWidth: 60, textTransform: 'none' }}
                      >
                        Apply
                      </Button>
                    </Box>
                  ))}
                </Box>
              </Collapse>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default CouponSection;
