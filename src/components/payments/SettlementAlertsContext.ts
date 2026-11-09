import { createContext, useContext } from "react";

export type SettlementAlert = {
  quote_id: string;
  title: string;
  business: string;
  customer: string;
  gross_minor: number;
  currency: string;
  collection_reference: string;
  paid_at: string;
  unread: boolean;
  recoverable: boolean;
};
export type Alerts = {
  items: SettlementAlert[];
  total: number;
  unread: number;
  has_more: boolean;
  can_manage: boolean;
  can_review?: boolean;
  live_enabled?: boolean;
};
type AlertContext = {
  data?: Alerts;
  loading: boolean;
  error?: unknown;
  offset: number;
  setOffset: (offset: number) => void;
  refresh: () => void;
  read: (id: string) => Promise<void>;
};
export const SettlementAlertsContext = createContext<AlertContext>({
  loading: false,
  offset: 0,
  setOffset: () => {},
  refresh: () => {},
  read: async () => {},
});
export const useSettlementAlerts = () => useContext(SettlementAlertsContext);
