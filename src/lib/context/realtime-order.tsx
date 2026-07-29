import { useState, useCallback, useRef, useEffect, useMemo, type ReactNode } from 'react';
import { ownerApi, normalizeOrdersResponse } from '@/lib/api/services';
import { RealtimeOrderContext, type RealtimeOrderContextValue } from './RealtimeOrderContext';

const POLL_MS = 5000;
const ALERT_STATUSES = new Set(['pending_payment', 'paid']);

function playAlertTone() {
  try {
    const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.start();
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    /* audio unavailable */
  }
}

export function RealtimeOrderProvider({
  children,
  storeId,
  enabled = true,
}: {
  children: ReactNode;
  storeId: string | null | undefined;
  enabled?: boolean;
}) {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const knownIdsRef = useRef(new Set<string>());
  const alertLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopAlertLoop = useCallback(() => {
    if (alertLoopRef.current) {
      clearInterval(alertLoopRef.current);
      alertLoopRef.current = null;
    }
  }, []);

  const startAlertLoop = useCallback(() => {
    if (alertLoopRef.current || !soundEnabled) return;
    playAlertTone();
    alertLoopRef.current = setInterval(playAlertTone, 3000);
  }, [soundEnabled]);

  const fetchOrders = useCallback(async () => {
    if (!storeId || !enabled) return;
    setLoading((prev) => (orders.length ? prev : true));
    try {
      const data = await ownerApi.listOrders(storeId);
      const list = normalizeOrdersResponse(data);
      setOrders(list);

      const alertOrders = list.filter((o: any) => ALERT_STATUSES.has(o.status ?? 'pending_payment'));
      const hasNew = alertOrders.some((o: any) => !knownIdsRef.current.has(o.id));
      alertOrders.forEach((o: any) => knownIdsRef.current.add(o.id));

      if (hasNew && soundEnabled) startAlertLoop();
      if (!alertOrders.length) stopAlertLoop();

      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [storeId, enabled, orders.length, soundEnabled, startAlertLoop, stopAlertLoop]);

  useEffect(() => {
    if (!storeId || !enabled) return undefined;
    fetchOrders();
    const id = setInterval(fetchOrders, POLL_MS);
    return () => {
      clearInterval(id);
      stopAlertLoop();
    };
  }, [storeId, enabled, fetchOrders, stopAlertLoop]);

  const acknowledgeAlerts = useCallback(() => {
    stopAlertLoop();
  }, [stopAlertLoop]);

  const value = useMemo<RealtimeOrderContextValue>(
    () => ({
      orders,
      loading,
      error,
      soundEnabled,
      setSoundEnabled,
      refreshOrders: fetchOrders,
      acknowledgeAlerts,
      hasActiveAlerts: Boolean(alertLoopRef.current),
    }),
    [orders, loading, error, soundEnabled, fetchOrders, acknowledgeAlerts],
  );

  return <RealtimeOrderContext.Provider value={value}>{children}</RealtimeOrderContext.Provider>;
}
