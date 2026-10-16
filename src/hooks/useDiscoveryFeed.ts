import { useCallback, useEffect, useRef, useState } from 'react';
import { StorefrontService } from '@/lib/api/services/storefront';
import type { DiscoveryOffering } from '@/lib/discovery';
import { validateDiscoveryResponse } from '@/lib/discoveryResponse';

export const DISCOVERY_BATCH_SIZE = 8;
type Filters = { search: string; kind: string; category: string; branch: string; sort: string };
type Feed = {
  key: string; items: DiscoveryOffering[]; total: number; offset: number;
  loading: boolean; loadingMore: boolean; error: unknown; moreError: unknown;
};
const emptyFeed = (key: string): Feed => ({ key, items: [], total: 0, offset: 0, loading: true, loadingMore: false, error: null, moreError: null });

/** A filter owns its feed: aborted requests can never append to another search. */
export function useDiscoveryFeed(filters: Filters) {
  const key = JSON.stringify(filters);
  const [feed, setFeed] = useState<Feed>(() => emptyFeed(key));
  const requestRef = useRef<{ key: string; controller: AbortController } | null>(null);
  const activeKey = useRef(key);

  const request = useCallback(async (requestKey: string, offset: number) => {
    if (requestKey !== activeKey.current) return;
    if (offset > 0 && requestRef.current) return;
    requestRef.current?.controller.abort();
    const controller = new AbortController();
    const current = { key: requestKey, controller };
    requestRef.current = current;
    if (offset === 0) setFeed(emptyFeed(requestKey));
    else setFeed(previous => ({ ...previous, loadingMore: true, moreError: null }));
    try {
      const result = await StorefrontService.discoverOfferings({ ...JSON.parse(requestKey), limit: DISCOVERY_BATCH_SIZE, offset }, controller.signal);
      validateDiscoveryResponse(result);
      if (controller.signal.aborted || requestKey !== activeKey.current) return;
      setFeed(previous => {
        if (previous.key !== requestKey) return previous;
        const rows = offset === 0 ? [] : previous.items;
        const seen = new Set(rows.map(item => `${item.source}:${item.store_id}:${item.id}`));
        const additions = result.offerings.filter(item => {
          const identity = `${item.source}:${item.store_id}:${item.id}`;
          if (seen.has(identity)) return false;
          seen.add(identity);
          return true;
        });
        return { key: requestKey, items: [...rows, ...additions], total: result.total,
          offset: result.offerings.length ? offset + result.offerings.length : result.total,
          loading: false, loadingMore: false, error: null, moreError: null };
      });
    } catch (error) {
      if (controller.signal.aborted || requestKey !== activeKey.current) return;
      setFeed(previous => previous.key !== requestKey ? previous : {
        ...previous, loading: false, loadingMore: false,
        error: offset === 0 ? error : null, moreError: offset > 0 ? error : null,
      });
    } finally {
      if (requestRef.current === current) requestRef.current = null;
    }
  }, []);

  useEffect(() => {
    activeKey.current = key;
    void request(key, 0);
    return () => { requestRef.current?.controller.abort(); requestRef.current = null; };
  }, [key, request]);

  const current = feed.key === key ? feed : emptyFeed(key);
  const hasMore = !current.loading && !current.error && current.offset < current.total;
  const loadMore = useCallback(() => {
    if (feed.key === key && !feed.loading && !feed.loadingMore && feed.offset < feed.total) void request(key, feed.offset);
  }, [feed, key, request]);
  return { ...current, hasMore, loadMore, retry: () => { void request(key, 0); } };
}
