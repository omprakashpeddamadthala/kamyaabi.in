import { useCallback, useEffect, useRef, useState } from 'react';

export function useRevealOnScroll(threshold = 0.15) {
  const [visible, setVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (!node) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setVisible(true);
        },
        { threshold },
      );
      observer.observe(node);
      observerRef.current = observer;
    },
    [threshold],
  );

  useEffect(
    () => () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    },
    [],
  );

  return { ref, visible };
}

export const revealSx = (visible: boolean) => ({
  opacity: visible ? 1 : 0,
  transform: visible ? 'translateY(0)' : 'translateY(24px)',
  transition: 'opacity 0.6s ease-out, transform 0.6s ease-out',
});
