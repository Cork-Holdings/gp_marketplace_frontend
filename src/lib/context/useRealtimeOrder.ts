import { useContext } from 'react';
import { RealtimeOrderContext } from './RealtimeOrderContext';

export function useRealtimeOrders() {
  const ctx = useContext(RealtimeOrderContext);
  if (!ctx) throw new Error('useRealtimeOrders must be used within RealtimeOrderProvider');
  return ctx;
}
