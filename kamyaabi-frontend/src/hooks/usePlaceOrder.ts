import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAppDispatch } from './useAppDispatch';
import { createOrder } from '../features/order/orderSlice';
import { paymentApi } from '../api/paymentApi';
import { CouponValidationResult, PaymentMethod, User } from '../types';

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

interface PlaceOrderArgs {
  selectedAddressId: number | null;
  couponResult: CouponValidationResult | null;
  paymentMethod: PaymentMethod;
  user: User | null;
  onError: (message: string) => void;
}

export function usePlaceOrder({
  selectedAddressId,
  couponResult,
  paymentMethod,
  user,
  onError,
}: PlaceOrderArgs) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  const placeOrder = async () => {
    if (!selectedAddressId) {
      onError('Please select a shipping address');
      return;
    }
    if (paymentProcessing) return;
    setLoading(true);
    onError('');
    try {
      const orderResult = await dispatch(
        createOrder({
          shippingAddressId: selectedAddressId,
          couponCode: couponResult?.valid ? couponResult.code : undefined,
          paymentMethod,
        }),
      ).unwrap();

      if (paymentMethod === 'COD') {
        navigate(`/orders/${orderResult.id}`);
        return;
      }

      const paymentRes = await paymentApi.createOrder(orderResult.id);
      const razorpayOrder = paymentRes.data.data;

      setPaymentProcessing(true);

      const razorpayThemeColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-brand-primary')
        .trim();

      const options = {
        key: razorpayOrder.keyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Kamyaabi',
        description: `Order #${orderResult.id}`,
        order_id: razorpayOrder.razorpayOrderId,
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            await paymentApi.verify({
              orderId: orderResult.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            navigate(`/orders/${orderResult.id}`);
          } catch {
            onError('Payment verification failed. If you were charged, a refund will be processed automatically.');
            setTimeout(() => navigate(`/orders/${orderResult.id}`), 3000);
          } finally {
            setPaymentProcessing(false);
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentProcessing(false);
            onError('Payment was cancelled. You can retry from your orders page.');
            setTimeout(() => navigate(`/orders/${orderResult.id}`), 3000);
          },
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: { color: razorpayThemeColor },
      };

      const { loadRazorpay } = await import('../utils/loadRazorpay');
      await loadRazorpay();
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      onError('Failed to create order');
      setPaymentProcessing(false);
    } finally {
      setLoading(false);
    }
  };

  return { loading, paymentProcessing, placeOrder };
}
