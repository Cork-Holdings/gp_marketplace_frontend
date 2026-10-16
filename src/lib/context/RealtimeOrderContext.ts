import { createContext } from 'react';

export interface RealtimeOrderContextValue {
  orders: any[];
  loading: boolean;
  error: unknown;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  refreshOrders: () => Promise<void>;
  acknowledgeAlerts: () => void;
  hasActiveAlerts: boolean;
  total: number;
  page: number;
  setPage: (page: number) => void;
  filters: { view: 'active' | 'history'; q: string; fulfillment: string; status: string };
  setFilters: (filters: Partial<RealtimeOrderContextValue['filters']>) => void;
}

export const RealtimeOrderContext = createContext<RealtimeOrderContextValue | null>(null);

export default RealtimeOrderContext;
