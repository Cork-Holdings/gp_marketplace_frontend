import secureApi from '../crud';
import { getRoute, withQuery } from '../end_points';

export const CustomerService = {
  getPurchaseHistory: (params: Record<string, string | number> = {}) =>
    secureApi.get(withQuery(getRoute('GET_PURCHASE_HISTORY'), params)),
  getOrder: (orderId: string) => secureApi.get(getRoute('GET_CUSTOMER_ORDER', { orderId })),
  listOrderTransactions: (orderId: string) =>
    secureApi.get(getRoute('LIST_ORDER_TRANSACTIONS', { orderId })),
  recordPayment: (orderId: string, payload: unknown) =>
    secureApi.post(getRoute('RECORD_PAYMENT', { orderId }), payload),
  getTransaction: (transactionId: string) =>
    secureApi.get(getRoute('GET_TRANSACTION', { transactionId })),
};

export default CustomerService;
