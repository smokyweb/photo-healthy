import React, { createContext, useContext, useRef, useState, ReactNode } from 'react';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  size?: string | null;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  removeItem: (id: number, size?: string | null) => void;
  updateQuantity: (id: number, quantity: number, size?: string | null) => void;
  clearCart: () => void;
  total: number;
  itemCount: number;
}

const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => {},
  removeItem: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  total: 0,
  itemCount: 0,
});

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const lastAddRef = useRef<{ key: string; time: number } | null>(null);

  const itemKey = (id: number, size?: string | null) => `${id}-${size || ''}`;

  const addItem = (item: Omit<CartItem, 'quantity'>, quantity = 1) => {
    const key = itemKey(item.id, item.size);
    const now = Date.now();
    if (lastAddRef.current?.key === key && now - lastAddRef.current.time < 500) {
      return;
    }
    lastAddRef.current = { key, time: now };

    setItems(prev => {
      const existing = prev.find(i => itemKey(i.id, i.size) === key);
      if (existing) {
        return prev.map(i =>
          itemKey(i.id, i.size) === key ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { ...item, quantity }];
    });
  };

  const removeItem = (id: number, size?: string | null) => {
    const key = itemKey(id, size);
    setItems(prev => prev.filter(i => itemKey(i.id, i.size) !== key));
  };

  const updateQuantity = (id: number, quantity: number, size?: string | null) => {
    if (quantity <= 0) {
      removeItem(id, size);
      return;
    }
    const key = itemKey(id, size);
    setItems(prev =>
      prev.map(i => (itemKey(i.id, i.size) === key ? { ...i, quantity } : i))
    );
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, total, itemCount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
