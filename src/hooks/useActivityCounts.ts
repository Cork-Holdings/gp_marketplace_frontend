import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { adminApi, customerApi, ownerApi } from '@/lib/api/services';
import { useAuth } from '@/lib/context/useAuth';
import { usePermissions } from '@/lib/context/permissions';

export type ActivityCounts = Record<'quotes' | 'jobs' | 'bookings' | 'custom', number | undefined> & {
  pendingKyc?: number;
};

const emptyCounts: ActivityCounts = { quotes: undefined, jobs: undefined, bookings: undefined, custom: undefined };

export function notifyActivityChanged() {
  window.dispatchEvent(new Event('geepay:activity-changed'));
}

/** Small, scoped totals for navigation; no list contents are downloaded. */
export function useActivityCounts(audience: 'admin' | 'customer' | 'owner', storeId?: string) {
  const { loading: authLoading, isAuthenticated, isAdmin, isCustomer, isMerchant, user } = useAuth();
  const { hasPermission } = usePermissions();
  const canReviewKyc = audience === 'admin' && isAdmin && hasPermission('kyc.view') && hasPermission('kyc.review');
  const { pathname } = useLocation();
  const [counts, setCounts] = useState<ActivityCounts>(emptyCounts);
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    const refresh = () => setRevision(value => value + 1);
    window.addEventListener('geepay:activity-changed', refresh);
    return () => window.removeEventListener('geepay:activity-changed', refresh);
  }, []);

  useEffect(() => {
    if (!canReviewKyc || authLoading || !isAuthenticated) return;
    const refresh = () => {
      if (document.visibilityState === 'visible') setRevision(value => value + 1);
    };
    const interval = window.setInterval(refresh, 60_000);
    window.addEventListener('focus', refresh);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refresh);
    };
  }, [canReviewKyc, authLoading, isAuthenticated]);

  useEffect(() => {
    const canFetch = audience === 'admin' ? canReviewKyc : audience === 'customer' ? isCustomer : isMerchant;
    if (authLoading || !isAuthenticated || !canFetch) {
      setCounts(emptyCounts); return;
    }
    if (audience === 'owner' && !storeId) { setCounts(emptyCounts); return; }
    let cancelled = false;
    if (audience === 'admin') {
      void adminApi.listKyc({ status: 'pending', limit: '1' }).then(result => {
        if (cancelled) return;
        const total = result?.total;
        setCounts({
          ...emptyCounts,
          pendingKyc: typeof total === 'number' && Number.isSafeInteger(total) && total >= 0 ? total : undefined,
        });
      }).catch(() => {
        if (!cancelled) setCounts(emptyCounts);
      });
      return () => { cancelled = true; };
    }
    const params = { limit: 1, offset: 0 };
    const requests = audience === 'owner' && storeId
      ? [ownerApi.listServiceQuotes(storeId, params), ownerApi.listServiceJobs(storeId, params), ownerApi.listReservations(storeId, params), ownerApi.listCustomOrders(storeId, params)]
      : [customerApi.listServiceQuotes(params), customerApi.listServiceJobs(params), customerApi.listReservations(params), customerApi.listCustomOrders(params)];
    void Promise.allSettled(requests).then(results => {
      if (cancelled) return;
      const total = (index: number) => {
        const result = results[index];
        if (result.status !== 'fulfilled') return undefined;
        const value = Number(result.value?.total);
        return Number.isFinite(value) && value >= 0 ? value : undefined;
      };
      setCounts({ quotes: total(0), jobs: total(1), bookings: total(2), custom: total(3) });
    });
    return () => { cancelled = true; };
  }, [audience, storeId, pathname, revision, authLoading, isAuthenticated, isCustomer, isMerchant, canReviewKyc, user?.id]);

  return audience === 'admin' && !canReviewKyc ? emptyCounts : counts;
}
