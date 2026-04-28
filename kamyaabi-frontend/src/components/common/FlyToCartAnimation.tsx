import React, { createContext, useContext, useCallback, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { PRODUCT_PLACEHOLDER_IMAGE } from '../../config/images';

interface FlyingItem {
  id: number;
  imageUrl: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

interface FlyToCartContextType {
  cartIconRef: React.RefObject<HTMLElement | null>;
  triggerFlyToCart: (imageUrl: string, startElement: HTMLElement) => void;
}

const FlyToCartContext = createContext<FlyToCartContextType | null>(null);

export const useFlyToCart = () => {
  const ctx = useContext(FlyToCartContext);
  if (!ctx) {
    return { cartIconRef: { current: null }, triggerFlyToCart: () => {} };
  }
  return ctx;
};

let flyIdCounter = 0;

export const FlyToCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const cartIconRef = useRef<HTMLElement | null>(null);
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);

  const triggerFlyToCart = useCallback((imageUrl: string, startElement: HTMLElement) => {
    const cartEl = cartIconRef.current;
    if (!cartEl) return;

    const startRect = startElement.getBoundingClientRect();
    const endRect = cartEl.getBoundingClientRect();

    const newItem: FlyingItem = {
      id: ++flyIdCounter,
      imageUrl,
      startX: startRect.left + startRect.width / 2 - 25,
      startY: startRect.top + startRect.height / 2 - 25,
      endX: endRect.left + endRect.width / 2 - 25,
      endY: endRect.top + endRect.height / 2 - 25,
    };

    setFlyingItems((prev) => [...prev, newItem]);

    setTimeout(() => {
      setFlyingItems((prev) => prev.filter((item) => item.id !== newItem.id));
    }, 800);
  }, []);

  return (
    <FlyToCartContext.Provider value={{ cartIconRef, triggerFlyToCart }}>
      {children}
      {flyingItems.map((item) => (
        <FlyingImage key={item.id} item={item} />
      ))}
    </FlyToCartContext.Provider>
  );
};

const FlyingImage: React.FC<{ item: FlyingItem }> = ({ item }) => {
  const dx = item.endX - item.startX;
  const dy = item.endY - item.startY;

  return (
    <Box
      sx={{
        position: 'fixed',
        left: item.startX,
        top: item.startY,
        width: 50,
        height: 50,
        borderRadius: '50%',
        overflow: 'hidden',
        zIndex: 9999,
        pointerEvents: 'none',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        animation: `flyToCart-${item.id} 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) forwards`,
        [`@keyframes flyToCart-${item.id}`]: {
          '0%': {
            transform: 'translate(0, 0) scale(1)',
            opacity: 1,
          },
          '50%': {
            transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 60}px) scale(0.7)`,
            opacity: 0.9,
          },
          '100%': {
            transform: `translate(${dx}px, ${dy}px) scale(0.2)`,
            opacity: 0,
          },
        },
      }}
    >
      <Box
        component="img"
        src={item.imageUrl || PRODUCT_PLACEHOLDER_IMAGE}
        alt=""
        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
      />
    </Box>
  );
};
