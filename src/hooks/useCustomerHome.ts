import { useCallback, useEffect, useState } from 'react';
import { secureFetch } from '@/lib/api/crud';
import { getRoute, withQuery, type ApiRouteKey } from '@/lib/api/end_points';
import { useAuth } from '@/lib/context/useAuth';
import { normalizeStoreList } from '@/lib/normalizeApi';
import { customerHomeRows, type CustomerHomeRecord, type CustomerHomeSource } from '@/lib/customerHome';

const sources: {key: CustomerHomeSource; route: ApiRouteKey; fields: string[]; limit: number}[] = [
  {key: 'orders', route: 'GET_PURCHASE_HISTORY', fields: ['orders','items','history'], limit: 6},
  {key: 'bookings', route: 'LIST_CUSTOMER_RESERVATIONS', fields: ['reservations'], limit: 6},
  {key: 'quotes', route: 'LIST_CUSTOMER_SERVICE_QUOTES', fields: ['service_quotes','quotes','items'], limit: 12},
  {key: 'jobs', route: 'LIST_CUSTOMER_SERVICE_JOBS', fields: ['service_jobs'], limit: 12},
  {key: 'requests', route: 'LIST_CUSTOMER_CUSTOM_ORDERS', fields: ['custom_orders','orders'], limit: 12},
];

export function useCustomerHome() {
  const {user, isCustomer} = useAuth();
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState({loading: true, records: {} as Partial<Record<CustomerHomeSource, CustomerHomeRecord[]>>, errors: {} as Partial<Record<CustomerHomeSource, unknown>>, storeNames: {} as Record<string,string>, updatedAt: ''});
  const refresh = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    window.addEventListener('geepay:activity-changed', refresh);
    return () => window.removeEventListener('geepay:activity-changed', refresh);
  }, [refresh]);
  useEffect(() => {
    if (!isCustomer) return;
    const controller = new AbortController();
    setState({loading: true, records: {}, errors: {}, storeNames: {}, updatedAt: ''});
    void Promise.all([
      Promise.allSettled(sources.map(async source => customerHomeRows(await secureFetch(withQuery(getRoute(source.route), {limit: source.limit, offset: 0}), {signal: controller.signal}), source.fields))),
      secureFetch(getRoute('LIST_STORES'), {auth:false, signal:controller.signal}).then(normalizeStoreList).catch(() => []),
    ]).then(([results, stores]) => {
      if (controller.signal.aborted) return;
      const records: Partial<Record<CustomerHomeSource, CustomerHomeRecord[]>> = {};
      const errors: Partial<Record<CustomerHomeSource, unknown>> = {};
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') records[sources[index].key] = result.value;
        else errors[sources[index].key] = result.reason;
      });
      const storeNames = Object.fromEntries(stores.map(store => [store.id, store.name]));
      setState({loading: false, records, errors, storeNames, updatedAt: new Date().toISOString()});
    });
    return () => controller.abort();
  }, [user?.id, isCustomer, revision]);
  return {...state, refresh};
}
