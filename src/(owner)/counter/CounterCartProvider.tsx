import { useReducer, useCallback, useMemo, useEffect, type ReactNode } from 'react';
import { cartLineKey, computeVariantPrice } from '@/lib/validations/variantSchema';
import { computeModifiersPrice, modifierSelectionKey } from '@/lib/validations/modifierSchema';
import { CartContext, type CartContextValue, type CartTotals } from '@/lib/context/CartContext';
import { taxRateFromStore } from '@/lib/context/cart';
import { computeInclusiveTaxTotals } from '@/lib/tax';

interface CartState {
  storeId: string | null;
  store: any;
  items: any[];
}

const initialState: CartState = {
  storeId: null,
  store: null,
  items: [],
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
  | { type: 'CLEAR' };

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
      const items = existing
        ? state.items.map((i) =>
            i.line_id === lineId ? { ...i, quantity: i.quantity + action.payload.quantity } : i,
          )
        : [...state.items, action.payload];
      return { ...state, items };
    }
    case 'UPDATE_QUANTITY': {
      const items = state.items
        .map((i) => (i.line_id === action.payload.lineId ? { ...i, quantity: action.payload.quantity } : i))
        .filter((i) => i.quantity > 0);
      return { ...state, items };
    }
    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => i.line_id !== action.payload.lineId) };
    case 'CLEAR':
      return { ...state, items: [] };
    default:
      return state;
  }
}

/** In-memory cart for the merchant counter/till — no localStorage persistence. */
export function CounterCartProvider({ store, children }: { store: any; children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  useEffect(() => {
    if (!store?.id) return;
    dispatch({
      type: 'SET_STORE',
      payload: { storeId: store.id, store, items: [] },
    });
  }, [store?.id, store]);

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
    dispatch({ type: 'CLEAR' });
  }, []);

  const taxRate = useMemo(() => taxRateFromStore(state.store), [state.store]);
  const totals = useMemo(() => cartTotals(state.items, taxRate), [state.items, taxRate]);

  const checkoutPayload = useCallback(
    (customerPhone = '', notes = '', extras: Record<string, any> = {}) => ({
      customer_phone: customerPhone || undefined,
      notes: notes || undefined,
      fulfillment_type: extras.fulfillment_type ?? 'self_pickup',
      payment_method: extras.payment_method ?? 'pay_at_counter',
      table_id: extras.table_id || undefined,
      items: state.items.map((i) => ({
        product_id: i.product_id,
        variant_id: i.variant_id ?? undefined,
        quantity: i.quantity,
        item_notes: i.item_notes || undefined,
        modifiers: (i.modifiers ?? []).map((m: any) => ({
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
      isOpen: true,
      totals,
      initStore: () => {},
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
      toggleCart: () => {},
      closeCart: () => {},
      checkoutPayload,
      taxRate,
    }),
    [state, totals, taxRate, addItem, updateQuantity, removeItem, clearCart, checkoutPayload],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export default CounterCartProvider;
