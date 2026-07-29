import { createContext } from 'react';

export interface CartTotals {
  subtotal: number;
  tax: number;
  delivery: number;
  total: number;
  itemCount: number;
}

export interface CartContextValue {
  store: any;
  storeId: string | null;
  items: any[];
  isOpen: boolean;
  totals: CartTotals;
  initStore: (store: any) => void;
  addItem: (product: any, quantity?: number, options?: Record<string, any>) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  clearCart: () => void;
  toggleCart: (open?: boolean) => void;
  closeCart: () => void;
  checkoutPayload: (customerPhone: string, notes?: string, extras?: Record<string, any>) => any;
  taxRate: number;
}

export const CartContext = createContext<CartContextValue | null>(null);

export default CartContext;
