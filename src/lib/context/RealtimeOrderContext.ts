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
}

export const RealtimeOrderContext = createContext<RealtimeOrderContextValue | null>(null);

export default RealtimeOrderContext;
