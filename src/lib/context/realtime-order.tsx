import { useState, useCallback, useRef, useEffect, useMemo, type ReactNode } from 'react';
import { ownerApi, normalizeOrdersResponse } from '@/lib/api/services';
import { RealtimeOrderContext, type RealtimeOrderContextValue } from './RealtimeOrderContext';

export const ORDER_PAGE_SIZE = 50;
const POLL_MS = 5000;
const ALERT_STATUSES = new Set(['pending_payment', 'paid']);

function playAlertTone() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880; gain.gain.value = 0.08;
    osc.start(); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.stop(ctx.currentTime + 0.4);
    osc.onended = () => { void ctx.close(); };
  } catch { /* audio unavailable */ }
}

export function RealtimeOrderProvider({ children, storeId, enabled = true }: {
  children: ReactNode; storeId: string | null | undefined; enabled?: boolean;
}) {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [filters, updateFilters] = useState<RealtimeOrderContextValue['filters']>({ view: 'active', q: '', fulfillment: '', status: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hasActiveAlerts, setHasActiveAlerts] = useState(false);
  const knownIdsRef = useRef(new Set<string>());
  const alertLoopRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  const stopAlertLoop = useCallback(() => {
    if (alertLoopRef.current) clearInterval(alertLoopRef.current);
    alertLoopRef.current = null; setHasActiveAlerts(false);
  }, []);
  const startAlertLoop = useCallback(() => {
    if (alertLoopRef.current || !soundEnabled) return;
    playAlertTone(); setHasActiveAlerts(true);
    alertLoopRef.current = setInterval(playAlertTone, 3000);
  }, [soundEnabled]);
  const setFilters = useCallback((next: Partial<RealtimeOrderContextValue['filters']>) => {
    updateFilters(previous => ({ ...previous, ...next })); setPage(0);
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!storeId || !enabled) return;
    requestRef.current?.abort();
    const controller = new AbortController(); requestRef.current = controller;
    setLoading(true);
    try {
      const data = await ownerApi.listOrders(storeId, { ...filters, limit: ORDER_PAGE_SIZE, offset: page * ORDER_PAGE_SIZE }, controller.signal);
      if (controller.signal.aborted) return;
      const list = normalizeOrdersResponse(data);
      setOrders(list); setTotal(Number(data?.total ?? list.length)); setError(null);
      const alertOrders = list.filter((o: any) => ALERT_STATUSES.has(o.status ?? 'pending_payment'));
      const hasNew = filters.view === 'active' && alertOrders.some((o: any) => !knownIdsRef.current.has(o.id));
      alertOrders.forEach((o: any) => knownIdsRef.current.add(o.id));
      if (hasNew && soundEnabled) startAlertLoop();
      if (!alertOrders.length || filters.view !== 'active') stopAlertLoop();
    } catch (err) {
      if (!controller.signal.aborted) setError(err);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [storeId, enabled, filters, page, soundEnabled, startAlertLoop, stopAlertLoop]);

  useEffect(() => {
    setOrders([]); setTotal(0);
    if (!storeId || !enabled) return;
    void fetchOrders();
    const timer = filters.view === 'active' ? setInterval(() => { void fetchOrders(); }, POLL_MS) : null;
    return () => { if (timer) clearInterval(timer); requestRef.current?.abort(); stopAlertLoop(); };
  }, [storeId, enabled, fetchOrders, filters.view, stopAlertLoop]);
  useEffect(() => { if (!soundEnabled) stopAlertLoop(); }, [soundEnabled, stopAlertLoop]);

  const value = useMemo<RealtimeOrderContextValue>(() => ({
    orders, total, page, setPage, filters, setFilters, loading, error, soundEnabled, setSoundEnabled,
    refreshOrders: fetchOrders, acknowledgeAlerts: stopAlertLoop, hasActiveAlerts,
  }), [orders, total, page, filters, setFilters, loading, error, soundEnabled, fetchOrders, stopAlertLoop, hasActiveAlerts]);
  return <RealtimeOrderContext.Provider value={value}>{children}</RealtimeOrderContext.Provider>;
}
