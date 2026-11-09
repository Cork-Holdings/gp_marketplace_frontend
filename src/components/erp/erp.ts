import api from "@/lib/api/crud";
export { erpMinor as minor } from "@/lib/erpMoney";
export type Supplier = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
};
export type PurchaseLine = {
  variant_id: string;
  name: string;
  quantity: number;
  received: number;
  unit_cost_minor: number;
};
export type Purchase = {
  id: string;
  reference: string;
  supplier_id: string;
  supplier_name: string;
  status: string;
  version: number;
  lines: PurchaseLine[];
  created_at: string;
};
export type Receipt = {
  id: string;
  reference: string;
  purchase_order_id: string;
  purchase_reference: string;
  created_at: string;
  lines: { variant_id: string; quantity: number }[];
};
export type Movement = {
  id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  balance: number;
  reason: string;
  source_id: string;
  name: string;
  sku: string;
  actor: string | null;
  created_at: string;
};
export type Contact = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  records?: number;
  role?: string;
  employee_number?: string | number;
  branch_scope?: string;
  last_activity?: string;
};
export type Document = {
  id: string;
  kind: string;
  reference: string;
  description: string;
  amount_minor: number;
  status: string;
  due_date: string;
  customer_id?: string;
  supplier_id?: string;
  source_id?: string;
  customer_name?: string;
  supplier_name?: string;
};
export type Account = { code: string; name: string; kind: string; is_active?: boolean };
export type JournalLine = {
  account: string;
  debit_minor: number;
  credit_minor: number;
};
export type Journal = {
  blocked_reason?: string;
  id: string;
  reference: string;
  description: string;
  posting_date: string;
  created_at: string;
  document_id?: string;
  reversal_of?: string;
  lines: JournalLine[];
  actor?: string;
};
export type Trial = {
  account: string;
  debit_minor: number;
  credit_minor: number;
};
export type Note = {
  id: string;
  customer_id: string;
  body: string;
  due_date?: string;
  actor: string;
  created_at: string;
};
export type History = {
  id: string;
  kind: string;
  title: string;
  status: string;
  created_at: string;
  path: string;
};
export type PeopleRecord = {
  id: string;
  employee_id: string;
  employee_name: string;
  kind: string;
  starts_on: string;
  ends_on: string;
  detail: string;
  status: string;
};
export type ERPEvent = {
  id: string;
  title: string;
  path: string;
  read_at?: string;
  created_at: string;
};
export type Balance = {
  id: string;
  reference: string;
  kind: string;
  amount_minor: number;
  paid_minor: number;
  credited_minor: number;
  due_date: string;
  customer_name?: string;
  supplier_name?: string;
};
export type PaymentRecord = {
  id: string;
  document_reference: string;
  reference: string;
  amount_minor: number;
  paid_on: string;
  reversed: boolean;
};
export const endpoint = (store: string, path: string) =>
  `/owner/stores/${encodeURIComponent(store)}/erp/${path}`;
export async function list<T>(
  store: string,
  path: string,
  signal?: AbortSignal,
): Promise<T[]> {
  const result = await api.get(endpoint(store, path), { signal });
  if (!Array.isArray(result?.items))
    throw new Error("These records could not be read. Refresh to try again.");
  return result.items;
}
export const money = (minor: number) =>
  new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency: "ZMW",
    currencyDisplay: "code",
  }).format((Object.is(minor, -0) ? 0 : minor) / 100);
export const day = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Lusaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export const stamp = (value: string) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Africa/Lusaka",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
export const human = (value: string) => value.replaceAll("_", " ");
