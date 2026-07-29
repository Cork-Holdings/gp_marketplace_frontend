export type TransactionType = 'payment' | 'refund' | 'adjustment';
export type TransactionStatus = 'pending' | 'success' | 'failed' | 'refunded';
export type PaymentMethod = 'mobile_money' | 'card' | string;

export interface Transaction {
  id: string;
  order_id: string;
  customer_id?: string;
  store_id?: string;
  merchant_id?: string;
  transaction_type: TransactionType | string;
  payment_method?: PaymentMethod;
  amount: number | string;
  currency?: string;
  external_reference?: string;
  idempotency_key?: string;
  status: TransactionStatus | string;
  metadata?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

export interface CustomerPurchaseHistory {
  customer_id?: string;
  orders?: unknown[];
  activities?: unknown[];
  transactions?: Transaction[];
  items?: unknown[];
  history?: unknown[];
}

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  payment: 'Payment',
  refund: 'Refund',
  adjustment: 'Adjustment',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  mobile_money: 'Mobile money',
  card: 'Card',
};
