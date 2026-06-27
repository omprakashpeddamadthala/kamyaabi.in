import { useEffect, useState } from 'react';
import { shippingApi } from '../api/shippingApi';
import type { PincodeServiceability } from '../api/shippingApi';
import { addressApi } from '../api/addressApi';
import type { Product, User } from '../types';

export function usePincodeCheck(product: Product | null, user: User | null) {
  const [pincodeResult, setPincodeResult] = useState<PincodeServiceability | null>(null);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState('');
  const [hasNoAddress, setHasNoAddress] = useState(false);
  const [addressLoaded, setAddressLoaded] = useState(false);

  useEffect(() => {
    if (!user || !product || addressLoaded) return;
    let cancelled = false;

    addressApi.getAll()
      .then((res) => {
        if (cancelled) return;
        const addresses = res.data.data ?? [];
        const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];

        if (!defaultAddr || !defaultAddr.pincode || !/^[1-9][0-9]{5}$/.test(defaultAddr.pincode)) {
          setHasNoAddress(true);
          setAddressLoaded(true);
          return;
        }

        setAddressLoaded(true);
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
      })
      .catch(() => {
        if (!cancelled) {
          setAddressLoaded(true);
          setHasNoAddress(true);
        }
      });

    return () => { cancelled = true; };
  }, [user, product, addressLoaded]);

  return {
    pincodeResult,
    pincodeLoading,
    pincodeError,
    hasNoAddress,
  };
}
