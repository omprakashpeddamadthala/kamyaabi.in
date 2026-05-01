const RAZORPAY_CDN = 'https://checkout.razorpay.com/v1/checkout.js';
let pending: Promise<void> | null = null;

export const loadRazorpay = (): Promise<void> => {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Razorpay can only load in a browser'));
  }
  if ((window as { Razorpay?: unknown }).Razorpay) {
    return Promise.resolve();
  }
  if (pending) return pending;

  pending = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${RAZORPAY_CDN}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Razorpay script failed to load')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = RAZORPAY_CDN;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      pending = null;
      reject(new Error('Razorpay script failed to load'));
    };
    document.head.appendChild(script);
  });

  return pending;
};
