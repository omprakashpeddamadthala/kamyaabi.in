import { useEffect, useState } from 'react';
import { shippingApi } from '../api/shippingApi';
import type { PincodeServiceability } from '../api/shippingApi';
import type { User } from '../types';

export function usePincodeCheck(_product: unknown, user: User | null) {
  const [pincodeResult, setPincodeResult] = useState<PincodeServiceability | null>(null);
  const [pincodeLoading, setPincodeLoading] = useState(false);
  const [pincodeError, setPincodeError] = useState('');
  const [hasNoAddress, setHasNoAddress] = useState(false);

  useEffect(() => {
    if (!user) return; // Guest — nothing to fetch

    let cancelled = false;
    setPincodeLoading(true);

    shippingApi.getCachedEstimate()
      .then((res) => {
        if (cancelled) return;
        const data = res.data?.data;
        if (data) {
          setPincodeResult(data);
        } else {
          // 200 with no data means no addresses saved yet
          setHasNoAddress(true);
        }
      })
      .catch((err) => {
        if (cancelled) return;
        const status = err?.response?.status;
        if (status === 204) {
          // No estimate cached yet — user may have no address
          setHasNoAddress(true);
        } else {
          setPincodeError('Unable to load delivery info.');
        }
      })
      .finally(() => {
        if (!cancelled) setPincodeLoading(false);
      });

    return () => { cancelled = true; };
  }, [user]);

  return {
    pincodeResult,
    pincodeLoading,
    pincodeError,
    hasNoAddress,
  };
}
