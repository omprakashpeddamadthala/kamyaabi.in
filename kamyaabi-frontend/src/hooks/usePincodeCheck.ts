import { useCallback, useEffect, useState } from 'react';
import { shippingApi } from '../api/shippingApi';
import type { PincodeServiceability } from '../api/shippingApi';
import { addressApi } from '../api/addressApi';
import type { Product, User } from '../types';
import { parseWeightInGrams } from '../utils/productDetail';

export function usePincodeCheck(product: Product | null, user: User | null) {
  const [pincode, setPincode] = useState('');
  const [pincodeResult, setPincodeResult] = useState<PincodeServiceability | null>(null);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState('');
  const [addressLoaded, setAddressLoaded] = useState(false);
  const [hasNoAddress, setHasNoAddress] = useState(false);

  useEffect(() => {
    if (!user || !product || addressLoaded) return;
    let cancelled = false;
    addressApi.getAll()
      .then((res) => {
        if (cancelled) return;
        const addresses = res.data.data ?? [];
        const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];
        if (!defaultAddr) {
          setHasNoAddress(true);
          setAddressLoaded(true);
          return;
        }
        if (defaultAddr?.pincode && /^[1-9][0-9]{5}$/.test(defaultAddr.pincode)) {
          setPincode(defaultAddr.pincode);
          setPincodeLoading(true);
          shippingApi.getDeliveryEstimate(defaultAddr.pincode, product.id)
            .then((estimateRes) => {
              if (!cancelled) setPincodeResult(estimateRes.data.data);
            })
            .catch(() => {
              if (!cancelled) setPincodeError('Unable to check delivery availability.');
            })
            .finally(() => {
              if (!cancelled) setPincodeLoading(false);
            });
        }
        setAddressLoaded(true);
      })
      .catch(() => { if (!cancelled) setAddressLoaded(true); });
    return () => { cancelled = true; };
  }, [user, product, addressLoaded]);

  const handleCheckPincode = useCallback(async () => {
    const trimmed = pincode.trim();
    if (!/^[1-9][0-9]{5}$/.test(trimmed)) {
      setPincodeError('Please enter a valid 6-digit pincode');
      setPincodeResult(null);
      return;
    }
    setPincodeError('');
    setPincodeResult(null);
    setPincodeLoading(true);
    try {
      if (user && product) {
        const res = await shippingApi.getDeliveryEstimate(trimmed, product.id);
        setPincodeResult(res.data.data);
      } else {
        const weightKg = product ? parseWeightInGrams(product.weight, product.unit) : null;
        const weight = weightKg ? weightKg / 1000 : 0.5;
        const res = await shippingApi.checkServiceability(trimmed, weight);
        setPincodeResult(res.data.data);
      }
    } catch {
      setPincodeError('Unable to check delivery availability. Please try again.');
    } finally {
      setPincodeLoading(false);
    }
  }, [pincode, product, user]);

  return {
    pincode,
    setPincode,
    pincodeResult,
    setPincodeResult,
    pincodeLoading,
    pincodeError,
    setPincodeError,
    hasNoAddress,
    handleCheckPincode,
  };
}
