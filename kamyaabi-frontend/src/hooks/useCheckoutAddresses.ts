import { useCallback, useEffect, useState } from 'react';

import { addressApi } from '../api/addressApi';
import { Address } from '../types';

export function useCheckoutAddresses(onError: (message: string) => void) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  const reloadAddresses = useCallback(async () => {
    try {
      const res = await addressApi.getAll();
      setAddresses(res.data.data);
      const defaultAddr = res.data.data.find((a) => a.isDefault);
      if (defaultAddr) setSelectedAddressId(defaultAddr.id);
      else if (res.data.data.length > 0) setSelectedAddressId(res.data.data[0].id);
    } catch {
      onError('Failed to load addresses');
    }
  }, [onError]);

  useEffect(() => {
    reloadAddresses();
  }, [reloadAddresses]);

  return { addresses, selectedAddressId, setSelectedAddressId, reloadAddresses };
}
