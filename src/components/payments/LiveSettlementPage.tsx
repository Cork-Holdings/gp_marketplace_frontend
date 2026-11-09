import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "@/lib/api/crud";
import { useMarketplace } from "@/lib/context/useMarketplace";
import { usePaymentMode } from "@/hooks/usePaymentMode";
import { ErrorState } from "@/components/common/ErrorState";
import { RecordListTable } from "@/components/common/RecordListTable";
import { PhoneInput } from "@/components/shared/PhoneInput";
import { validPhone, internationalPhone } from "@/lib/phone";
import { ReferencePanel } from "@/components/reference/ReferenceUI";
import {
  settlementActions,
  settlementLabel,
  settlementLabels,
  settlementMoney,
  type SettlementRecord,
} from "@/lib/settlement";
import Rehearsal from "./SettlementRehearsalPage";
import "./live-settlement.css";
import { SettlementReviewQueue } from "./SettlementReviewQueue";
import { SettlementHistory } from "./SettlementHistory";
import { useSettlementAlerts } from "./SettlementAlertsContext";

type Mode = "customer" | "merchant" | "admin";
type Result = {
  items: SettlementRecord[];
  has_more: boolean;
  can_manage: boolean;
  live_collections: boolean;
  disbursements_enabled: boolean;
};
type Setup = {
  eligible: {
    id: string;
    title: string;
    business: string;
    amount: number;
    customer: string;
  }[];
  commission_bps: number;
  disbursements_enabled: boolean;
  live_collections: boolean;
};
const actionLabels: Record<string, string> = {
  release_recovered: "Review and authorise merchant disbursement",
  dispute: "Report a payment problem",
  resolve_resume: "Return to held for rework",
  resolve_release: "Resolve and authorise release",
  resolve_refund: "Require manual refund review",
  retry: "Authorise a new payout attempt",
};
export default function SettlementPage({ mode }: { mode: Mode }) {
  const simulated = usePaymentMode();
  if (mode === "merchant")
    return <MerchantSettlementPage simulated={simulated} />;
  return simulated ? (
    <Rehearsal mode={mode} />
  ) : (
    <LiveSettlementPage mode={mode} />
  );
}
function MerchantSettlementPage({ simulated }: { simulated: boolean }) {
  const { selectedStoreId } = useMarketplace();
  return simulated ? (
    <Rehearsal mode="merchant" storeId={selectedStoreId ?? undefined} />
  ) : (
    <LiveSettlementPage
      mode="merchant"
      storeId={selectedStoreId ?? undefined}
    />
  );
}
function LiveSettlementPage({
  mode,
  storeId,
}: {
  mode: Mode;
  storeId?: string;
}) {
  const PageRoot = mode === "customer" ? "main" : "div";
  const detailRef = useRef<HTMLElement>(null);
  const [params] = useSearchParams();
  const quoteFilter = params.get("quote") ?? "";
  const [offset, setOffset] = useState(0);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState<Result>();
  const [error, setError] = useState<unknown>();
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [notice, setNotice] = useState("");
  const [decision, setDecision] = useState("");
  const [reason, setReason] = useState("");
  const [setup, setSetup] = useState<Setup>();
  const [bps, setBps] = useState(0);
  const [quote, setQuote] = useState("");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [verification, setVerification] = useState("");
  const [reserve, setReserve] = useState("0");
  const [verified, setVerified] = useState(false);
  const [historyToken, setHistoryToken] = useState("");
  const settlementAlerts = useSettlementAlerts();
  const base =
    mode === "admin"
      ? "/admin/settlements"
      : mode === "customer"
        ? "/customers/me/settlements"
        : `/owner/stores/${storeId}/settlements`;
  const refresh = () => setRevision((v) => v + 1);
  useEffect(() => {
    setOffset(0);
    setSelected("");
    setDecision("");
    setSetup(undefined);
    setResult(undefined);
  }, [storeId, mode, quoteFilter]);
  useEffect(() => {
    if (mode === "merchant" && !storeId) {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    setError(undefined);
    void api
      .get(
        `${base}?offset=${offset}${quoteFilter ? `&quote_id=${encodeURIComponent(quoteFilter)}` : ""}`,
        { signal: controller.signal },
      )
      .then((data) => {
        if (!controller.signal.aborted) setResult(data);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [base, mode, storeId, offset, revision, quoteFilter]);
  useEffect(() => {
    if (mode !== "admin" || !result?.can_manage) return;
    const c = new AbortController();
    void api
      .get("/admin/settlements/setup", { signal: c.signal })
      .then((data) => {
        if (!c.signal.aborted) {
          setSetup(data);
          setBps(data.commission_bps);
        }
      })
      .catch((cause) => {
        if (!c.signal.aborted) setError(cause);
      });
    return () => c.abort();
  }, [mode, result?.can_manage, revision]);
  const current = result?.items.find((item) => item.quote_id === selected);
  useEffect(() => {
    if (selected && detailRef.current) {
      detailRef.current.focus({ preventScroll: true });
      detailRef.current.scrollIntoView({ block: "start" });
    }
  }, [selected]);
  const actions = current
    ? settlementActions(
        current,
        Boolean(result?.can_manage),
        mode === "customer",
      )
    : [];
  async function perform(action: () => Promise<unknown>, message: string) {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(undefined);
    setNotice("");
    try {
      await action();
      setNotice(message);
      setDecision("");
      setReason("");
      refresh();
      if (mode === "admin") settlementAlerts.refresh();
    } catch (cause) {
      setError(cause);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  const enroll = (e: FormEvent) => {
    e.preventDefault();
    void perform(
      () =>
        api.post("/admin/settlements/enroll", {
          quote_id: quote,
          phone: internationalPhone(phone),
          recipient_name: name,
          verification_note: verification,
          fee_reserve_minor: Number(reserve),
          ownership_verified: verified,
        }),
      "Quote enrolled. No payment or payout was sent.",
    );
  };
  return (
    <PageRoot className="settlement-page">
      <header className="reference-dashboard-head">
        <div>
          <h1>
            {mode === "customer"
              ? "Payment protection"
              : "Payments & settlements"}
          </h1>
          <p>
            Quoted-service settlement records and collected payments requiring
            finance review. Release authorisation is not confirmation that the
            merchant has been paid.
          </p>
        </div>
        <button
          className="reference-button"
          onClick={() => {
            refresh();
            if (mode === "admin") settlementAlerts.refresh();
          }}
          disabled={loading || busy}
        >
          Refresh
        </button>
      </header>
      {notice && (
        <p role="status" className="reference-notice">
          {notice}
        </p>
      )}
      {error ? <ErrorState error={error} onRetry={refresh} /> : null}
      {mode === "admin" && (
        <SettlementReviewQueue
          onRecovered={() => {
            setOffset(0);
            refresh();
          }}
        />
      )}
      {mode === "merchant" && !storeId ? (
        <p>Choose a branch to view its settlements.</p>
      ) : (
        <>
          {result && !result.disbursements_enabled && (
            <p className="reference-notice">
              Automatic disbursement submission is disabled. Confirmed
              collections can be recorded as held, but no new merchant payout
              will be sent until the operator enables it.
            </p>
          )}
          <ReferencePanel title="Settlement records">
            <div className="reference-table-wrap">
              {loading ? (
                <p role="status">Loading settlement records…</p>
              ) : (
                <RecordListTable
                  className="reference-table"
                  aria-label="Settlements"
                >
                  <caption>
                    Amounts are ZMW. Fees are separate from merchant principal.
                  </caption>
                  <thead>
                    <tr>
                      {[
                        "Service",
                        "Business",
                        "Customer payment",
                        "Merchant principal",
                        "Status",
                        "Action",
                      ].map((label) => (
                        <th scope="col" key={label}>
                          {label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result?.items.map((item) => (
                      <tr key={item.quote_id}>
                        <td>{item.title}</td>
                        <td>{item.store_name}</td>
                        <td>{settlementMoney(item.gross_minor)}</td>
                        <td>{settlementMoney(item.provider_minor)}</td>
                        <td>{settlementLabel(item)}</td>
                        <td>
                          <button
                            className="reference-link-button"
                            onClick={() => {
                              setSelected(item.quote_id);
                              setDecision("");
                              setReason("");
                            }}
                          >
                            View record
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </RecordListTable>
              )}
              {!loading && !result?.items.length && (
                <p className="reference-note">
                  No enrolled quoted-service settlements on this page. Ordinary
                  payments are not automatically treated as escrow.
                </p>
              )}
            </div>
            <div className="reference-pagination">
              <button
                disabled={!offset || loading}
                onClick={() => setOffset((v) => Math.max(0, v - 20))}
              >
                Previous
              </button>
              <span>Page {offset / 20 + 1}</span>
              <button
                disabled={!result?.has_more || loading}
                onClick={() => setOffset((v) => v + 20)}
              >
                Next
              </button>
            </div>
          </ReferencePanel>
        </>
      )}
      {current && (
        <section
          ref={detailRef}
          tabIndex={-1}
          aria-label="Selected settlement details"
        >
          <ReferencePanel
            title={current.title}
            action={
              <button
                className="reference-link-button"
                onClick={() => {
                  setSelected("");
                  setDecision("");
                }}
              >
                Close record
              </button>
            }
          >
            <dl className="reference-detail-facts">
              <div>
                <dt>Financial status</dt>
                <dd>{settlementLabel(current)}</dd>
              </div>
              <div>
                <dt>Customer payment</dt>
                <dd>{settlementMoney(current.gross_minor)}</dd>
              </div>
              <div>
                <dt>Platform commission</dt>
                <dd>
                  {settlementMoney(current.commission_minor)} (
                  {current.commission_bps / 100}%)
                </dd>
              </div>
              <div>
                <dt>Merchant principal</dt>
                <dd>{settlementMoney(current.provider_minor)}</dd>
              </div>
              <div>
                <dt>Recipient</dt>
                <dd>
                  {current.recipient_name} · {current.recipient_phone}
                </dd>
              </div>
              <div>
                <dt>Collection reference</dt>
                <dd>{current.collection_reference || "Not collected"}</dd>
              </div>
              {current.attempt && (
                <div>
                  <dt>Payout reference</dt>
                  <dd>{current.attempt.reference}</dd>
                </div>
              )}
            </dl>
            {current.attempt?.detail && (
              <p className="reference-notice">{current.attempt.detail}</p>
            )}
            {current.problem && (
              <p className="reference-notice">Case note: {current.problem}</p>
            )}
            {current.status === "refund_pending" && (
              <p className="reference-notice">
                A refund has not been sent. Finance must arrange and reconcile
                the actual return of funds outside this integration.
              </p>
            )}
            <div className="settlement-actions">
              {mode === "admin" && (
                <Link
                  className="reference-link-button"
                  to={`/portal/admin/settlements/history/quote/${current.quote_id}`}
                >
                  View full service history and issues
                </Link>
              )}
              {actions.map((action) => (
                <button
                  className="reference-button"
                  key={action}
                  disabled={busy}
                  onClick={() => {
                    setDecision(action);
                    setReason("");
                    setHistoryToken("");
                  }}
                >
                  {actionLabels[action]}
                </button>
              ))}
            </div>
            {result?.can_manage &&
              current.status === "disputed" &&
              !current.release_evidence_ready && (
                <div className="settlement-actions">
                  <p id="release-prerequisite">
                    Provider completion and recorded work evidence are required
                    before authorising release.
                  </p>
                  <button
                    className="reference-button"
                    disabled
                    aria-describedby="release-prerequisite"
                  >
                    Resolve and authorise release
                  </button>
                </div>
              )}
            {decision && (
              <form
                className="settlement-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void perform(
                    () =>
                      api.post(`${base}/${current.quote_id}/actions`, {
                        action: decision,
                        reason,
                        history_token: historyToken,
                        history_reviewed: Boolean(historyToken),
                      }),
                    decision === "retry"
                      ? "New payout attempt authorised. This is not payout confirmation."
                      : "Settlement decision recorded.",
                  );
                }}
              >
                <p>
                  {decision === "release_recovered"
                    ? `This authorises ${settlementMoney(current.provider_minor)} to ${current.recipient_name}, ${current.recipient_phone}. The enabled worker can send this disbursement after approval. It does not collect from the customer again.`
                    : decision === "resolve_release"
                      ? "This can make held funds eligible for automatic merchant disbursement. Review the work evidence and dispute before confirming."
                      : decision === "retry"
                        ? "Only a provider-confirmed final failure or a request known not to have been submitted may be retried. Unconfirmed payouts cannot be retried."
                        : decision === "resolve_refund"
                          ? "This records a refund review requirement. It does not send or confirm a refund."
                          : "Explain the issue or finance decision. This note is visible in the settlement history."}
                </p>
                {["release_recovered", "resolve_release", "retry"].includes(
                  decision,
                ) && (
                  <SettlementHistory
                    id={current.quote_id}
                    version={revision}
                    onReviewed={setHistoryToken}
                  />
                )}
                <label htmlFor="settlement-reason">
                  Reason (10–1000 characters)
                </label>
                <textarea
                  id="settlement-reason"
                  required
                  minLength={10}
                  maxLength={1000}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
                <div className="settlement-actions">
                  <button
                    className="reference-button"
                    disabled={
                      busy ||
                      reason.trim().length < 10 ||
                      ([
                        "release_recovered",
                        "resolve_release",
                        "retry",
                      ].includes(decision) &&
                        !historyToken)
                    }
                  >
                    {decision === "release_recovered"
                      ? `Authorise ${settlementMoney(current.provider_minor)} disbursement`
                      : "Confirm decision"}
                  </button>
                  <button
                    type="button"
                    className="reference-link-button"
                    disabled={busy}
                    onClick={() => setDecision("")}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
            <h3 className="settlement-subhead">Financial history</h3>
            <ol className="settlement-history">
              {current.events.map((event, index) => (
                <li key={`${event.created_at}:${index}`}>
                  <strong>
                    {settlementLabels[event.action] ??
                      event.action.replaceAll("_", " ")}
                  </strong>
                  <p>{event.note}</p>
                  <time>
                    {new Date(event.created_at).toLocaleString("en-ZM")}
                  </time>
                </li>
              ))}
            </ol>
            {mode !== "admin" && (
              <Link
                className="reference-link-button"
                to={`${mode === "customer" ? "/account" : "/portal/owner"}/quotes?detail=${encodeURIComponent(current.quote_id)}`}
              >
                Open estimate
              </Link>
            )}
          </ReferencePanel>
        </section>
      )}
      {setup && result?.can_manage && (
        <details className="settlement-setup">
          <summary>Finance setup: commission and quote enrollment</summary>
          <p>
            Default commission applies only to newly enrolled quotes. Existing
            records retain their saved rate. Recipient verification is a
            finance-admin attestation of ownership, not an automatic gateway
            lookup.
          </p>
          <form
            className="settlement-form"
            onSubmit={(event) => {
              event.preventDefault();
              void perform(
                () =>
                  api.put("/admin/settlements/settings", {
                    commission_bps: bps,
                  }),
                "Commission saved for future enrollments.",
              );
            }}
          >
            <label htmlFor="commission-bps">
              Commission in basis points (100 = 1%)
            </label>
            <input
              id="commission-bps"
              type="number"
              min={0}
              max={9999}
              step={1}
              required
              value={bps}
              onChange={(e) => setBps(Number(e.target.value))}
            />
            <button className="reference-button" disabled={busy}>
              Save commission
            </button>
          </form>
          <form className="settlement-form" onSubmit={enroll}>
            <h3>Enroll an unpaid accepted quote</h3>
            <label htmlFor="settlement-quote">Quote</label>
            <select
              id="settlement-quote"
              required
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
            >
              <option value="">Choose a quote</option>
              {setup.eligible.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title} · {item.business} · {item.customer} · ZMW{" "}
                  {item.amount}
                </option>
              ))}
            </select>
            {!setup.eligible.length && (
              <p>
                No eligible quotes. Create and accept a new estimate without
                paying it first.
              </p>
            )}
            <label htmlFor="recipient-name">Verified wallet holder name</label>
            <input
              id="recipient-name"
              required
              minLength={2}
              maxLength={160}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <label htmlFor="recipient-phone">
              Verified merchant mobile-money number
            </label>
            <PhoneInput
              id="recipient-phone"
              name="recipient"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <label htmlFor="recipient-verification">
              Ownership verification evidence/reference
            </label>
            <textarea
              id="recipient-verification"
              required
              minLength={10}
              maxLength={1000}
              value={verification}
              onChange={(e) => setVerification(e.target.value)}
              placeholder="Record how ownership and the destination were checked. Do not enter PINs or secrets."
            />
            <label htmlFor="fee-reserve">
              Additional float reserve in ngwee (100 = K1)
            </label>
            <input
              id="fee-reserve"
              type="number"
              min={0}
              max={100000000}
              step={1}
              value={reserve}
              required
              onChange={(e) => setReserve(e.target.value)}
            />
            <label className="settlement-check">
              <input
                type="checkbox"
                checked={verified}
                onChange={(e) => setVerified(e.target.checked)}
              />
              I verified ownership of this business recipient and the fee
              reserve. Once paid, customer approval or an audited finance
              decision can authorise disbursement to this wallet.
            </label>
            <p>
              The quote must have no prior live collection attempts. Enrollment
              sends no money and cannot rewrite an existing payment or
              recipient.
            </p>
            <button
              className="reference-button"
              disabled={
                busy ||
                !setup.live_collections ||
                !verified ||
                !validPhone(phone) ||
                !quote ||
                verification.trim().length < 10 ||
                name.trim().length < 2 ||
                !Number.isInteger(Number(reserve)) ||
                Number(reserve) < 0 ||
                Number(reserve) > 100000000
              }
            >
              Enroll quote, no payment sent
            </button>
          </form>
        </details>
      )}
    </PageRoot>
  );
}

export function QuoteSettlementNotice({
  quoteId,
  paymentStatus,
}: {
  quoteId: string;
  paymentStatus?: string;
}) {
  const [item, setItem] = useState<SettlementRecord>();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setItem(undefined);
    setFailed(false);
    void api
      .get(
        `/customers/me/settlements?quote_id=${encodeURIComponent(quoteId)}`,
        { signal: controller.signal },
      )
      .then((data) => {
        if (!controller.signal.aborted) setItem(data.items?.[0]);
      })
      .catch(() => {
        if (!controller.signal.aborted) setFailed(true);
      });
    return () => controller.abort();
  }, [quoteId, paymentStatus]);
  if (failed)
    return (
      <p className="workflow-help">
        Settlement details could not be loaded. Check Payments before assuming
        funds have been released.
      </p>
    );
  if (!item) return null;
  return (
    <div className="workflow-help" role="status">
      <strong>{settlementLabel(item)}.</strong> This estimate uses the
      platform-held payment arrangement. Release follows completed work and your
      confirmation, or a finance decision on a dispute.{" "}
      <Link to={`/account/settlements?quote=${encodeURIComponent(quoteId)}`}>
        View settlement and report a payment problem
      </Link>
      .
    </div>
  );
}
