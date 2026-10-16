import { useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

/** A record can be refreshed, linked and revisited with browser Back. */
export function useWorkflowRecordSelection<T extends { id: string }>(records: T[]) {
  const [params, setParams] = useSearchParams();
  const opener = useRef<HTMLElement | null>(null);
  const selectedId = params.get('detail') ?? '';
  const setSelectedId = useCallback((id: string | null) => {
    if (id) opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setParams(previous => {
      const next = new URLSearchParams(previous);
      next.delete('request');
      if (id) next.set('detail', id);
      else next.delete('detail');
      return next;
    });
    if (!id) requestAnimationFrame(() => opener.current?.isConnected && opener.current.focus({ preventScroll: true }));
  }, [setParams]);
  const setSelected = useCallback((record: T | null) => setSelectedId(record?.id ?? null), [setSelectedId]);
  return { selectedId, setSelectedId, selected: records.find(record => record.id === selectedId) ?? null, setSelected };
}
