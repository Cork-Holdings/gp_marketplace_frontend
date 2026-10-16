import { useEffect, useState } from 'react';
import { OwnerService } from '@/lib/api/services/owner';
import type { DashboardPeriod, OwnerDashboard } from '@/types/ownerDashboard';

type Result = { key: string; data?: OwnerDashboard; error?: unknown; loading: boolean };
export function useOwnerDashboard(storeId: string | undefined, period: DashboardPeriod, offset: number) {
  const key = `${storeId ?? ''}:${period}:${offset}`;
  const [result, setResult] = useState<Result>({ key: '', loading: true });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    if (!storeId) return;
    const controller = new AbortController();
    setResult({ key, loading: true });
    void OwnerService.dashboard(storeId, period, offset, controller.signal).then(
      data => { if (!controller.signal.aborted) setResult({ key, data, loading: false }); },
      error => { if (!controller.signal.aborted) setResult({ key, error, loading: false }); },
    );
    return () => controller.abort();
  }, [key, storeId, period, offset, revision]);
  useEffect(() => {
    const refresh = () => setRevision(value => value + 1);
    window.addEventListener('geepay:activity-changed', refresh);
    return () => window.removeEventListener('geepay:activity-changed', refresh);
  }, []);
  // Never show the previous branch or period while the next request starts.
  const current = result.key === key ? result : { key, loading: true };
  return { ...current, refresh: () => setRevision(value => value + 1) };
}
