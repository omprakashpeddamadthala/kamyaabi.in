import React, { createContext, useContext } from 'react';

export interface FlyToCartContextType {
  cartIconRef: React.RefObject<HTMLElement | null>;
  triggerFlyToCart: (imageUrl: string, startElement: HTMLElement) => void;
}

export const FlyToCartContext = createContext<FlyToCartContextType | null>(null);

export const useFlyToCart = () => {
  const ctx = useContext(FlyToCartContext);
  if (!ctx) {
    return { cartIconRef: { current: null }, triggerFlyToCart: () => {} };
  }
  return ctx;
};
