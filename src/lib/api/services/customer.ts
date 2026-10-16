import secureApi from '../crud';
import { getRoute, withQuery } from '../end_points';

export const CustomerService = {
  createServiceInquiry: (payload: unknown) => secureApi.post('/customers/me/service-quotes', payload),
  getPurchaseHistory: (params: Record<string, string | number> = {}) =>
    secureApi.get(withQuery(getRoute('GET_PURCHASE_HISTORY'), params)),
  getOrder: (orderId: string) => secureApi.get(getRoute('GET_CUSTOMER_ORDER', { orderId })),
  listOrderTransactions: (orderId: string) =>
    secureApi.get(getRoute('LIST_ORDER_TRANSACTIONS', { orderId })),
  recordPayment: (orderId: string, payload: unknown) =>
    secureApi.post(getRoute('RECORD_PAYMENT', { orderId }), payload),
  getTransaction: (transactionId: string) =>
    secureApi.get(getRoute('GET_TRANSACTION', { transactionId })),
  listServiceQuotes: (params: Record<string, string | number> = {}) =>
    secureApi.get(withQuery(getRoute('LIST_CUSTOMER_SERVICE_QUOTES'), params)),
  updateServiceQuoteStatus: (quoteId: string, status: string) =>
    secureApi.patch(getRoute('CUSTOMER_SERVICE_QUOTE_STATUS', { quoteId }), { status }),
  listServiceJobs: (params: Record<string, string | number> = {}) =>
    secureApi.get(withQuery(getRoute('LIST_CUSTOMER_SERVICE_JOBS'), params)),
  updateServiceJobStatus: (jobId: string, status: string, reason?: string) =>
    secureApi.patch(getRoute('CUSTOMER_SERVICE_JOB_STATUS', { jobId }), { status, ...(reason ? { reason } : {}) }),
  listJobEvidence: (jobId: string) => secureApi.get(getRoute('CUSTOMER_JOB_EVIDENCE', { jobId })),
  listReservations: (params: Record<string, string | number> = {}) =>
    secureApi.get(withQuery(getRoute('LIST_CUSTOMER_RESERVATIONS'), params)),
  updateReservationStatus: (reservationId: string, status: string) =>
    secureApi.patch(getRoute('CUSTOMER_RESERVATION_STATUS', { reservationId }), { status }),
  createReservation: (storeId: string, payload: unknown) =>
    secureApi.post(getRoute('CUSTOMER_CREATE_RESERVATION', { storeId }), payload),
  listCustomOrders: (params: Record<string, string | number> = {}) =>
    secureApi.get(withQuery(getRoute('LIST_CUSTOMER_CUSTOM_ORDERS'), params)),
  createCustomOrder: (storeId: string, payload: unknown, photos: File[] = []) => {
    const route = getRoute('CREATE_CUSTOMER_CUSTOM_ORDER', { storeId });
    if (!photos.length) return secureApi.post(route, payload);
    const form = new FormData(); form.append('request', JSON.stringify(payload));
    photos.forEach(photo => form.append('reference_photos', photo));
    return secureApi.upload(route, form);
  },
  respondToCustomOrderOffer: (orderId: string, accept: boolean) =>
    secureApi.patch(getRoute('CUSTOMER_CUSTOM_ORDER_OFFER', { orderId }), { accept }),
  getWorkflowPayment: (kind: string, sourceId: string, stage: string) =>
    secureApi.get(getRoute('WORKFLOW_PAYMENT', { kind, sourceId, stage })),
  collectWorkflowPayment: (kind: string, sourceId: string, stage: string, phoneNumber: string) =>
    secureApi.post(getRoute('WORKFLOW_PAYMENT_COLLECT', { kind, sourceId, stage }), { phone_number: phoneNumber }),
  syncWorkflowPayment: (kind: string, sourceId: string, stage: string) =>
    secureApi.post(getRoute('WORKFLOW_PAYMENT_SYNC', { kind, sourceId, stage }), {}),
};

export default CustomerService;
