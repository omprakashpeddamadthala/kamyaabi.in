import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid, Alert } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../hooks/useAppDispatch';
import { fetchCart } from '../features/cart/cartSlice';
import { PaymentMethod } from '../types';
import Loading from '../components/common/Loading';
import AddressFormDialog from '../components/common/AddressFormDialog';
import { useCheckoutAddresses } from '../hooks/useCheckoutAddresses';
import { useCheckoutCoupons } from '../hooks/useCheckoutCoupons';
import { usePlaceOrder } from '../hooks/usePlaceOrder';
import CheckoutProgress from '../components/checkout/CheckoutProgress';
import ShippingAddressCard from '../components/checkout/ShippingAddressCard';
import PaymentMethodCard from '../components/checkout/PaymentMethodCard';
import OrderItemsCard from '../components/checkout/OrderItemsCard';
import OrderSummaryCard from '../components/checkout/OrderSummaryCard';

const CheckoutPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const { cart } = useAppSelector((state) => state.cart);
  const { user } = useAppSelector((state) => state.auth);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('PREPAID');

  const { addresses, selectedAddressId, setSelectedAddressId, reloadAddresses } =
    useCheckoutAddresses(setError);
  const coupon = useCheckoutCoupons();
  const { loading, paymentProcessing, placeOrder } = usePlaceOrder({
    selectedAddressId,
    couponResult: coupon.couponResult,
    paymentMethod,
    user,
    onError: setError,
  });

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const subtotal = cart?.totalAmount ?? 0;
  const finalTotal = Math.max(0, subtotal - coupon.discountAmount);

  if (!cart) return <Loading />;

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
      <Typography
        variant="h3"
        sx={{
          mb: { xs: 2, sm: 3 },
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: 'var(--text-5xl)',
          letterSpacing: '-0.02em',
        }}
      >
        Checkout
      </Typography>

      <CheckoutProgress
        hasAddress={Boolean(selectedAddressId)}
        hasPaymentMethod={Boolean(paymentMethod)}
      />

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
        <Grid item xs={12} md={8}>
          <ShippingAddressCard
            addresses={addresses}
            selectedAddressId={selectedAddressId}
            onSelect={setSelectedAddressId}
            onAddAddress={() => setShowAddDialog(true)}
          />
          <PaymentMethodCard paymentMethod={paymentMethod} onChange={setPaymentMethod} />
          <OrderItemsCard items={cart.items} />
        </Grid>

        <Grid item xs={12} md={4}>
          <OrderSummaryCard
            subtotal={subtotal}
            discountAmount={coupon.discountAmount}
            finalTotal={finalTotal}
            paymentMethod={paymentMethod}
            coupon={coupon}
            loading={loading}
            paymentProcessing={paymentProcessing}
            canPlaceOrder={Boolean(selectedAddressId)}
            onPlaceOrder={placeOrder}
          />
        </Grid>
      </Grid>

      <AddressFormDialog
        open={showAddDialog}
        onClose={() => setShowAddDialog(false)}
        onSaved={reloadAddresses}
      />
    </Container>
  );
};

export default CheckoutPage;
