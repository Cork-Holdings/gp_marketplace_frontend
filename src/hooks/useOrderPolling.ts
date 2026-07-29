import { useState, useEffect, useRef, useCallback } from 'react';
import { storefrontApi } from '@/lib/api/services';

const PAID_STATUSES = new Set(['paid', 'fulfilled', 'completed']);
const POLL_INTERVAL_MS = 4000;
const MAX_POLL_MS = 5 * 60 * 1000;

export function useOrderPolling(storeId, orderId, enabled = true) {
  const [status, setStatus] = useState('pending_payment');
  const [order, setOrder] = useState(null);
  const [collection, setCollection] = useState({
    enabled: false,
    status: '',
    message: '',
    provider: '',
  });
  const [error, setError] = useState(null);
  const [polling, setPolling] = useState(enabled);
  const intervalRef = useRef(null);
  const startedAtRef = useRef(Date.now());

  const checkStatus = useCallback(async () => {
    if (!storeId || !orderId) return;
    if (Date.now() - startedAtRef.current > MAX_POLL_MS) {
      setPolling(false);
      return;
    }
    try {
      const data = await storefrontApi.getPaymentStatus(storeId, orderId);
      const orderStatus = data.order?.status ?? data.status ?? 'pending_payment';
      setStatus(orderStatus);
      if (data.order) setOrder(data.order);
      setCollection({
        enabled: Boolean(data.collection_enabled),
        status: data.collection_status ?? '',
        message: data.collection_message ?? '',
        provider: data.collection_provider ?? '',
      });
      if (PAID_STATUSES.has(orderStatus) || String(data.collection_status).toLowerCase() === 'successful') {
        setPolling(false);
        if (String(data.collection_status).toLowerCase() === 'successful') {
          setStatus('paid');
        }
      }
      if (['failed', 'failure', 'rejected'].includes(String(data.collection_status).toLowerCase())) {
        setPolling(false);
      }
      setError(null);
    } catch {
      try {
        const orderData = await storefrontApi.getOrder(storeId, orderId);
        const orderStatus = orderData.status ?? orderData.order?.status ?? 'pending_payment';
        setStatus(orderStatus);
        setOrder(orderData.order ?? orderData);
        if (PAID_STATUSES.has(orderStatus)) setPolling(false);
        setError(null);
      } catch (innerErr) {
        setError(innerErr);
      }
    }
  }, [storeId, orderId]);

  useEffect(() => {
    if (!polling || !enabled) return undefined;
    startedAtRef.current = Date.now();
    checkStatus();
    intervalRef.current = setInterval(checkStatus, POLL_INTERVAL_MS);
    return () => clearInterval(intervalRef.current);
  }, [polling, enabled, checkStatus]);

  const confirmPaid = useCallback(() => {
    startedAtRef.current = Date.now();
    setPolling(true);
    checkStatus();
  }, [checkStatus]);

  const isPaid = PAID_STATUSES.has(status);

  return { status, order, error, polling, isPaid, confirmPaid, checkStatus, collection };
}
