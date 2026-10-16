import { useEffect, useState } from 'react';
import { useFetchWrapper } from '@/hooks/useFetchWrapper';
import { useWorkflowRecordSelection } from '@/hooks/useWorkflowRecordSelection';

type Envelope<T> = { total: number; [key: string]: T[] | number };
type FetchPage = (params: Record<string, string | number>) => Promise<unknown>;

/** Lists search the full authorised dataset; bookmarked details load independently. */
export function useCustomerWorkflowList<T extends { id: string }>(fetchPage: FetchPage, key: string, enabled = true) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 6;
  const selection = useWorkflowRecordSelection<T>([]);
  const list = useFetchWrapper(() => fetchPage({ limit: pageSize, offset: page * pageSize, search: query.trim() }), [page, query, enabled], { enabled });
  const detail = useFetchWrapper(() => fetchPage({ id: selection.selectedId }), [selection.selectedId, enabled], { enabled: enabled && Boolean(selection.selectedId) });
  const data = list.data as Envelope<T> | null;
  const detailData = detail.data as Envelope<T> | null;
  const records = Array.isArray(data?.[key]) ? data[key] as T[] : [];
  const total = typeof data?.total === 'number' ? data.total : 0;
  const detailRecords = Array.isArray(detailData?.[key]) ? detailData[key] as T[] : [];
  const active = detailRecords.find(record => record.id === selection.selectedId) ?? records.find(record => record.id === selection.selectedId);

  useEffect(() => {
    if (!list.loading && !list.error && page > 0 && page * pageSize >= total) setPage(Math.max(0, Math.ceil(total / pageSize) - 1));
  }, [list.loading, list.error, page, total]);

  const retry = async () => {
    await Promise.all([list.retry(), ...(selection.selectedId ? [detail.retry()] : [])]);
  };
  const search = (value: string) => { setQuery(value); setPage(0); };
  return { records, total, page, setPage, pageSize, query, setQuery: search, ...selection, active,
    loading: list.loading, error: list.error, detailLoading: detail.loading,
    detailError: detail.error, retry };
}
