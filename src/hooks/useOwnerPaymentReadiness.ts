import { useEffect, useState } from 'react';
import { ownerApi } from '@/lib/api/services';
export type PaymentReadiness = { first_confirmed: boolean; balance_confirmed: boolean };

/** Reads verified local records only: never starts or syncs a provider payment. */
export function useOwnerPaymentReadiness(storeId: string | null | undefined, kind: 'custom_order' | 'job', id?: string) {
  const [revision, setRevision] = useState(0);
  const key = `${storeId}:${kind}:${id}`;
  const [state, setState] = useState<{ key: string; readiness: PaymentReadiness | null; checking: boolean; error: boolean }>({ key: '', readiness: null, checking: true, error: false });
  useEffect(() => {
    if (!storeId || !id) return;
    let disposed = false;
    let inFlight = false;
    const read = async () => {
      if (inFlight || disposed || document.visibilityState === 'hidden') return;
      inFlight = true;
      setState(previous => ({ key, readiness: previous.key === key ? previous.readiness : null, checking: true, error: false }));
      try {
        const data = kind === 'job' ? await ownerApi.listServiceJobs(storeId, { id, limit: 1 }) : await ownerApi.listCustomOrders(storeId, { id, limit: 1 });
        const record = (kind === 'job' ? data?.service_jobs : data?.custom_orders)?.find(item => item.id === id);
        const value = record?.payment_readiness;
        const readiness = typeof value?.first_confirmed === 'boolean' && typeof value?.balance_confirmed === 'boolean' ? value : null;
        if (!disposed) setState({ key, readiness, checking: false, error: !readiness });
      } catch {
        if (!disposed) setState({ key, readiness: null, checking: false, error: true });
      } finally { inFlight = false; }
    };
    void read();
    const timer = window.setInterval(read, 15000);
    window.addEventListener('focus', read);
    document.addEventListener('visibilitychange', read);
    return () => { disposed = true; clearInterval(timer); window.removeEventListener('focus', read); document.removeEventListener('visibilitychange', read); };
  }, [storeId, kind, id, key, revision]);
  return { readiness: state.key === key ? state.readiness : null, checking: state.key !== key || state.checking, error: state.key === key && state.error, refresh: () => setRevision(value => value + 1) };
}
