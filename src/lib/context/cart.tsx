import { useReducer, useEffect, useCallback, useMemo, type ReactNode } from 'react';
import { loadCartFromStorage, saveCartToStorage, clearCartStorage } from '@/lib/storage';
import { cartLineKey, computeVariantPrice } from '@/lib/validations/variantSchema';
import { computeModifiersPrice, modifierSelectionKey } from '@/lib/validations/modifierSchema';
import { CartContext, type CartContextValue, type CartTotals } from './CartContext';
import { computeInclusiveTaxTotals } from '@/lib/tax';

/** Convert store tax_rate_bps (0–10000) to a decimal rate; default 0 when unknown. */
export function taxRateFromStore(store: any): number {
  const bps = Number(store?.tax_rate_bps);
  if (!Number.isFinite(bps) || bps < 0) return 0;
  return bps / 10000;
}

interface CartState {
  storeId: string | null;
  store: any;
  items: any[];
  isOpen: boolean;
}

const initialState: CartState = {
  storeId: null,
  store: null,
  items: [],
  isOpen: false,
};

function computeLineTotal(item: any) {
  const price = parseFloat(item.unit_price ?? item.price ?? 0);
  const modifiersPrice = computeModifiersPrice(item.modifiers);
  const qty = item.quantity ?? 1;
  return (price + modifiersPrice) * qty;
}

function cartTotals(items: any[], taxRate: number): CartTotals {
  const grossTotal = items.reduce((sum, item) => sum + computeLineTotal(item), 0);
  const itemCount = items.reduce((sum, item) => sum + (item.quantity ?? 1), 0);
  return computeInclusiveTaxTotals(grossTotal, taxRate, 0, itemCount);
}

type CartAction =
  | { type: 'SET_STORE'; payload: { storeId: string; store: any; items?: any[] } }
  | { type: 'ADD_ITEM'; payload: any }
  | { type: 'UPDATE_QUANTITY'; payload: { lineId: string; quantity: number } }
  | { type: 'REMOVE_ITEM'; payload: { lineId: string } }
  | { type: 'CLEAR' }
  | { type: 'TOGGLE_CART'; payload?: boolean }
  | { type: 'CLOSE_CART' };

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_STORE':
      return {
        ...state,
        storeId: action.payload.storeId,
        store: action.payload.store,
        items: action.payload.items ?? [],
      };
    case 'ADD_ITEM': {
      const lineId = action.payload.line_id;
      const existing = state.items.find((i) => i.line_id === lineId);
      let items;
      if (existing) {
        items = state.items.map((i) =>
          i.line_id === lineId ? { ...i, quantity: i.quantity + action.payload.quantity } : i,
        );
      } else {
        items = [...state.items, action.payload];
      }
      return { ...state, items };
    }
    case 'UPDATE_QUANTITY': {
      const items = state.items
        .map((i) => (i.line_id === action.payload.lineId ? { ...i, quantity: action.payload.quantity } : i))
        .filter((i) => i.quantity > 0);
      return { ...state, items };
    }
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter((i) => i.line_id !== action.payload.lineId),
      };
    case 'CLEAR':
      return { ...state, items: [] };
    case 'TOGGLE_CART':
      return { ...state, isOpen: action.payload ?? !state.isOpen };
    case 'CLOSE_CART':
      return { ...state, isOpen: false };
    default:
      return state;
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  useEffect(() => {
    if (state.storeId) {
      saveCartToStorage(state.storeId, state.items);
    }
  }, [state.storeId, state.items]);

  const initStore = useCallback((store: any) => {
    const storeId = store.id;
    const saved = loadCartFromStorage(storeId);
    dispatch({
      type: 'SET_STORE',
      payload: { storeId, store, items: saved },
    });
  }, []);

  const addItem = useCallback((product: any, quantity = 1, options: Record<string, any> = {}) => {
    const { variant, variantId, attributes, unitPrice, modifiers, modifierSelection, itemNotes } = options;
    const price = unitPrice ?? computeVariantPrice(product.price, variant);
    const line_id = cartLineKey(product.id, variantId ?? variant?.id, attributes, modifierSelectionKey(modifierSelection));
    dispatch({
      type: 'ADD_ITEM',
      payload: {
        line_id,
        product_id: product.id,
        variant_id: variantId ?? variant?.id ?? null,
        attributes: attributes ?? variant?.attributes ?? {},
        name: product.name,
        unit_price: price,
        price,
        image_url: product.image_url,
        quantity,
        variant_label: attributes ? Object.values(attributes).join(' / ') : variant?.sku ?? null,
        modifiers: modifiers ?? undefined,
        item_notes: itemNotes ?? undefined,
      },
    });
  }, []);

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { lineId, quantity } });
  }, []);

  const removeItem = useCallback((lineId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { lineId } });
  }, []);

  const clearCart = useCallback(() => {
    if (state.storeId) clearCartStorage(state.storeId);
    dispatch({ type: 'CLEAR' });
  }, [state.storeId]);

  const toggleCart = useCallback((open?: boolean) => {
    dispatch({ type: 'TOGGLE_CART', payload: open });
  }, []);

  const closeCart = useCallback(() => {
    dispatch({ type: 'CLOSE_CART' });
  }, []);

  const taxRate = useMemo(() => taxRateFromStore(state.store), [state.store]);
  const totals = useMemo(() => cartTotals(state.items, taxRate), [state.items, taxRate]);

  const checkoutPayload = useCallback(
    (customerPhone: string, notes = '', extras: Record<string, any> = {}) => ({
      customer_phone: customerPhone,
      notes,
      fulfillment_type: extras.fulfillment_type ?? 'self_pickup',
      payment_method: extras.payment_method ?? 'mobile_money',
      delivery_address: extras.delivery_address,
      delivery_latitude: extras.delivery_latitude,
      delivery_longitude: extras.delivery_longitude,
      scheduled_date: extras.scheduled_date,
      scheduled_time: extras.scheduled_time,
      table_id: extras.table_id,
      qr_code_id: extras.qr_code_id,
      guest_session_id: extras.guest_session_id,
      order_source: extras.order_source,
      items: state.items.map((i) => ({
        product_id: i.product_id,
        variant_id: i.variant_id ?? undefined,
        quantity: i.quantity,
        item_notes: i.item_notes || undefined,
        modifiers: (i.modifiers ?? []).map((m) => ({
          modifier_id: m.modifier_id,
        })),
      })),
    }),
    [state.items],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      store: state.store,
      storeId: state.storeId,
      items: state.items,
      isOpen: state.isOpen,
      totals,
      initStore,
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      toggleCart,
      closeCart,
      checkoutPayload,
      taxRate,
    }),
    [state, totals, taxRate, initStore, addItem, updateQuantity, removeItem, clearCart, toggleCart, closeCart, checkoutPayload],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}
