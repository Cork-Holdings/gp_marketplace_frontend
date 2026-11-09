import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { customerApi } from "@/lib/api/services";
import { formatCurrency } from "@/lib/utils";
import { userMessage } from "@/lib/userMessage";
import {
  receiptKindLabel,
  receiptPage,
  receiptStageLabel,
  type PaymentReceipt,
  type ReceiptPage,
} from "@/lib/paymentReceipts";
import { ReceiptPaper } from "@/components/storefront/ReceiptPaper";
import { CustomerWorkflowList } from "@/components/common/CustomerWorkflowList";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogBody,
  DialogClose,
} from "@/components/ui/dialog";
import "./payment-receipts.css";

function Receipt({ receipt: r }: { receipt: PaymentReceipt }) {
  const paper = useRef<HTMLDivElement>(null);
  const cleanupPrint = useRef<() => void>(() => {});
  useEffect(() => () => cleanupPrint.current(), []);
  function print() {
    const node = paper.current?.firstElementChild;
    if (!(node instanceof HTMLElement)) return;
    // Reuse the product receipt's thermal print rules, isolating this receipt
    // when a request has both an initial payment and a balance receipt.
    cleanupPrint.current();
    const previous = document.getElementById("receipt-print");
    previous?.removeAttribute("id");
    node.id = "receipt-print";
    const cleanup = () => {
      node.removeAttribute("id");
      previous?.setAttribute("id", "receipt-print");
      window.removeEventListener("afterprint", cleanup);
      cleanupPrint.current = () => {};
    };
    cleanupPrint.current = cleanup;
    window.addEventListener("afterprint", cleanup, { once: true });
    try {
      window.print();
    } catch {
      cleanup();
    }
  }
  return (
    <div ref={paper}>
      <ReceiptPaper className="payment-receipt">
        <header className="mb-4 border-b border-dashed border-cream-dark pb-4">
          <h3 className="text-lg font-semibold text-navy">
            {r.simulated ? "Test payment receipt" : "Payment receipt"}
          </h3>
          <p className="mt-1 text-sm text-forest-muted">{r.business}</p>
          <p className="mt-1 text-xs text-forest-muted">
            {r.simulated
              ? "Simulation only. No real money moved."
              : r.refunded
                ? "Original payment record · refunded"
                : "Payment confirmed"}
          </p>
        </header>
        <dl className="payment-receipt-facts">
          <div>
            <dt>Customer</dt>
            <dd>{r.customer}</dd>
          </div>
          <div>
            <dt>For</dt>
            <dd>{receiptKindLabel(r.kind)}</dd>
          </div>
          <div>
            <dt>Payment stage</dt>
            <dd>{receiptStageLabel(r.stage)}</dd>
          </div>
          <div>
            <dt>Confirmed</dt>
            <dd>
              {new Date(r.confirmed_at).toLocaleString("en-ZM", {
                timeZone: "Africa/Lusaka",
              })}{" "}
              (Zambia)
            </dd>
          </div>
          <div>
            <dt>Payment reference</dt>
            <dd className="break-all">{r.reference}</dd>
          </div>
        </dl>
        <table className="my-4 w-full text-sm">
          <thead className="border-b border-cream-dark text-left">
            <tr>
              <th className="pb-2 pr-3 font-medium">Service / request</th>
              <th className="pb-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="py-3 pr-3 align-top break-words">
                {r.title}
                <span className="mt-1 block text-xs text-forest-muted">
                  {receiptStageLabel(r.stage)}
                </span>
              </td>
              <td className="py-3 text-right align-top tabular-nums">
                {formatCurrency(r.amount, r.currency)}
              </td>
            </tr>
          </tbody>
        </table>
        <div className="flex flex-wrap justify-between gap-3 border-t border-cream-dark pt-3 text-base font-semibold text-navy">
          <span>Recorded payment</span>
          <strong className="tabular-nums">
            {formatCurrency(r.amount, r.currency)}
          </strong>
        </div>
        <p className="mt-3 text-xs leading-5 text-forest-muted">
          This receipt confirms the recorded payment for this stage, not
          completion of work or payout to the business. Any separately charged
          provider fee or levy is not included unless recorded above.
        </p>
        {r.refunded && (
          <p className="mt-2 text-sm font-medium">
            This payment was refunded. This is the original receipt, not an
            available payment balance.
          </p>
        )}
        <p className="receipt-print-footer mt-4 text-center text-xs text-forest-muted">
          GeePay Marketplace · Powered by Clickmore
        </p>
        <button
          type="button"
          className="booking-back-button mt-4 w-full print:hidden"
          onClick={print}
        >
          Print / save PDF
        </button>
      </ReceiptPaper>
    </div>
  );
}

export function PaymentReceipts({
  kind,
  sourceId,
  refreshKey = "",
  compact = false,
}: {
  kind?: PaymentReceipt["kind"];
  sourceId?: string;
  refreshKey?: string;
  compact?: boolean;
}) {
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null | undefined>();
  const [reload, setReload] = useState(0);
  const [state, setState] = useState<{
    key: string;
    data: ReceiptPage | null;
    loading: boolean;
    error: string;
  }>({ key: "", data: null, loading: true, error: "" });
  const key = `${kind ?? "all"}:${sourceId ?? ""}:${refreshKey}:${offset}:${reload}`;
  useEffect(() => {
    let live = true;
    setState({ key, data: null, loading: true, error: "" });
    customerApi
      .listPaymentReceipts({
        limit: 20,
        offset,
        ...(kind && sourceId ? { kind, source_id: sourceId } : {}),
      })
      .then((value) => {
        const data = receiptPage(value);
        if (live) setState({ key, data, loading: false, error: "" });
      })
      .catch((cause) => {
        if (live)
          setState({
            key,
            data: null,
            loading: false,
            error: userMessage(cause, "Receipts could not be loaded."),
          });
      });
    return () => {
      live = false;
    };
  }, [kind, sourceId, key, offset]);
  const current =
    state.key === key ? state : { data: null, loading: true, error: "" };
  const items = current.data?.items ?? [];
  const needle = search.trim().toLowerCase();
  const filtered = items.filter((r) =>
    [
      r.title,
      r.business,
      r.reference,
      receiptKindLabel(r.kind),
      receiptStageLabel(r.stage),
    ].some((value) => value.toLowerCase().includes(needle)),
  );
  const selected =
    selectedId === undefined && kind
      ? items[0]
      : items.find((r) => r.id === selectedId);
  const rows = filtered.map((r) => ({
    id: r.id,
    title: r.title,
    reference: `${receiptKindLabel(r.kind)} · ${receiptStageLabel(r.stage)}${r.simulated ? " · Test payment" : ""}`,
    context: r.business,
    date: new Date(r.confirmed_at).toLocaleString("en-ZM", {
      timeZone: "Africa/Lusaka",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }),
    status: r.refunded
      ? "refunded"
      : r.simulated
        ? "test_payment"
        : "successful",
    value: formatCurrency(r.amount, r.currency),
    group: "history" as const,
    actionLabel: "View receipt",
    facts: [
      { label: "Business", value: r.business },
      { label: "Payment type", value: receiptKindLabel(r.kind) },
      { label: "Stage", value: receiptStageLabel(r.stage) },
      { label: "Payment reference", value: r.reference },
      {
        label: "Confirmed (Zambia)",
        value: new Date(r.confirmed_at).toLocaleString("en-ZM", {
          timeZone: "Africa/Lusaka",
        }),
      },
    ],
  }));
  const content = (
    <>
      {compact ? (
        current.loading ? (
          <p role="status">Loading receipts…</p>
        ) : current.error ? (
          <div role="alert">
            <p>{current.error}</p>
            <button
              type="button"
              className="booking-back-button mt-2"
              onClick={() => setReload((v) => v + 1)}
            >
              Retry receipts
            </button>
          </div>
        ) : items.length ? (
          <div className="space-y-3">
            {items.map((r) => (
              <Link
                key={r.id}
                className="payment-receipt-shortcut"
                to={`/account/transactions?receipt_kind=${r.kind}&receipt_source=${r.source_id}#payment-receipts`}
              >
                <span>
                  {r.simulated ? "Test receipt" : "View receipt"} ·{" "}
                  {receiptStageLabel(r.stage)}
                  {r.refunded ? " · Refunded" : ""}
                </span>
                <strong>{formatCurrency(r.amount, r.currency)}</strong>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-sm text-forest-muted">
            No confirmed payment receipts yet.
          </p>
        )
      ) : (
        <>
          <div className="payment-receipt-toolbar">
            <label>
              Find a receipt
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Service, business or payment reference"
                autoComplete="off"
              />
            </label>
            <p role="status">
              {current.loading
                ? "Loading receipts…"
                : `${filtered.length} of ${items.length} receipts on this page`}
              <small>Confirmed times are shown in Zambia time.</small>
            </p>
          </div>
          <CustomerWorkflowList
            items={rows}
            label="Receipts"
            dateHeading="Confirmed (Zambia)"
            paginated
            onOpen={setSelectedId}
            loading={current.loading}
            error={current.error || undefined}
            onRetry={() => setReload((v) => v + 1)}
            empty={
              <p className="payment-receipt-empty">
                {needle
                  ? "No receipts match your search on this page."
                  : "No confirmed payment receipts yet."}
              </p>
            }
          />
          <Dialog
            open={Boolean(selected)}
            onOpenChange={(open) => {
              if (!open) setSelectedId(null);
            }}
          >
            <DialogContent
              size="md"
              className="payment-receipt-dialog"
              aria-describedby={undefined}
            >
              <DialogHeader>
                <DialogTitle>Payment receipt</DialogTitle>
                <DialogClose className="booking-back-button">Close</DialogClose>
              </DialogHeader>
              <DialogBody>
                {selected && <Receipt receipt={selected} />}
              </DialogBody>
            </DialogContent>
          </Dialog>
        </>
      )}
      {(offset > 0 || current.data?.has_more) && (
        <nav className="booking-pagination" aria-label="Receipt pages">
          <button
            type="button"
            className="booking-back-button"
            disabled={current.loading || offset === 0}
            onClick={() => {
              setSearch("");
              setSelectedId(null);
              setOffset((v) => Math.max(0, v - 20));
            }}
          >
            Previous
          </button>
          <span>Page {offset / 20 + 1}</span>
          <button
            type="button"
            className="booking-back-button"
            disabled={current.loading || !current.data?.has_more}
            onClick={() => {
              setSearch("");
              setSelectedId(null);
              setOffset((v) => v + 20);
            }}
          >
            Next
          </button>
        </nav>
      )}
      {compact && (
        <Link
          className="workflow-text-action"
          to="/account/transactions#payment-receipts"
        >
          All payment receipts
        </Link>
      )}
    </>
  );
  return (
    <section
      id={compact ? undefined : "payment-receipts"}
      aria-label="Payment receipts"
      className={compact ? "workflow-payment-receipts" : "workflow-panel mt-6"}
    >
      <div className={compact ? "" : "workflow-panel-heading"}>
        <h2 className="font-semibold">
          {compact
            ? "Receipts for this request"
            : "Service, booking & custom-order receipts"}
        </h2>
      </div>
      <div className={compact ? "mt-3 space-y-3" : "payment-receipt-content"}>
        {content}
      </div>
    </section>
  );
}
