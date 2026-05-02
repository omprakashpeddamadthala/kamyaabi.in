import { useEffect, useState } from 'react';
import { settingsApi, PublicSettings } from '../api/settingsApi';

let cached: PublicSettings | null = null;
let inflight: Promise<PublicSettings> | null = null;

const fetchOnce = (): Promise<PublicSettings> => {
  if (cached) return Promise.resolve(cached);
  if (inflight) return inflight;
  inflight = settingsApi
    .getPublicSettings()
    .then((res) => {
      cached = res.data.data ?? {};
      return cached;
    })
    .catch(() => {
      cached = {};
      return cached;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
};

export const usePublicSettings = (): PublicSettings | null => {
  const [settings, setSettings] = useState<PublicSettings | null>(cached);

  useEffect(() => {
    if (cached) {
      setSettings(cached);
      return;
    }
    let cancelled = false;
    fetchOnce().then((s) => {
      if (!cancelled) setSettings(s);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return settings;
};
