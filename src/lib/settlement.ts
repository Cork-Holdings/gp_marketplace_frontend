export type SettlementAttempt = {
  reference: string;
  status: string;
  detail: string;
};
export type SettlementRecord = {
  quote_id: string;
  title: string;
  store_name: string;
  gross_minor: number;
  commission_minor: number;
  provider_minor: number;
  commission_bps: number;
  fee_reserve_minor: number;
  currency: string;
  status: string;
  problem: string;
  recipient_name: string;
  recipient_phone: string;
  release_evidence_ready: boolean;
  recovered?: boolean;
  customer_confirmed?: boolean;
  collection_reference?: string;
  attempt?: SettlementAttempt;
  events: { action: string; note: string; created_at: string }[];
};
export const settlementLabels: Record<string, string> = {
  awaiting_payment: "Awaiting customer payment",
  held: "Payment held",
  released: "Release authorised",
  disputed: "Dispute under review",
  refund_pending: "Refund action required",
  paid_out: "Merchant paid",
  queued: "Awaiting disbursement",
  prepared: "Payout submission reserved",
  pending: "Payout processing",
  unconfirmed: "Payout result unconfirmed",
  failed: "Payout failed",
  successful: "Merchant paid",
};
export function settlementLabel(item: SettlementRecord) {
  if (item.recovered && item.status === "held")
    return "Finance release required";
  return (
    settlementLabels[
      item.status === "released" && item.attempt
        ? item.attempt.status
        : item.status
    ] ?? "Status unavailable"
  );
}
export function settlementActions(
  item: SettlementRecord,
  finance: boolean,
  customer: boolean,
) {
  const sent = ["prepared", "pending", "unconfirmed", "successful"].includes(
    item.attempt?.status ?? "",
  );
  if (customer)
    return !sent && ["held", "released"].includes(item.status)
      ? ["dispute"]
      : [];
  if (!finance || sent) return [];
  if (item.recovered && item.status === "held")
    return item.customer_confirmed && item.release_evidence_ready
      ? ["release_recovered"]
      : [];
  if (item.status === "disputed")
    return [
      "resolve_resume",
      ...(item.release_evidence_ready ? ["resolve_release"] : []),
      "resolve_refund",
    ];
  return item.status === "released" && item.attempt?.status === "failed"
    ? ["retry"]
    : [];
}
export function settlementMoney(minor: number) {
  return new Intl.NumberFormat("en-ZM", {
    style: "currency",
    currency: "ZMW",
  }).format(minor / 100);
}
