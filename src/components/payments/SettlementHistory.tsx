import { PaginatedTable } from '@/components/common/PaginatedTable';
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "@/lib/api/crud";
import { useFetchWrapper } from "@/hooks/useFetchWrapper";
import { ErrorState } from "@/components/common/ErrorState";
import { StatusBadge } from "@/components/common/StatusBadge";
import { ReferenceIcon } from "@/components/reference/ReferenceIcon";
import {
  historyAmount,
  historyAddress,
  historyDate,
  historyLabel,
} from "@/lib/settlementHistoryPresentation";
import "./live-settlement.css";

type Row = Record<string, unknown>;
type History = {
  data: {
    record: Row;
    lines: Row[];
    events: Row[];
    evidence: Row[];
    issues: Row[];
    payments: Row[];
    financial_events: Row[];
    audit_note: string;
  };
  review_token: string;
};
const text = (value: unknown) =>
  typeof value === "string" || typeof value === "number"
    ? String(value)
    : value
      ? JSON.stringify(value)
      : "Not recorded";

export function SettlementHistory({
  id,
  kind = "quote",
  version = 0,
  onReviewed,
}: {
  id: string;
  kind?: string;
  version?: number;
  onReviewed?: (token: string) => void;
}) {
  const [revision, setRevision] = useState(0);
  const [checked, setChecked] = useState(false);
  const { data, loading, error } = useFetchWrapper(
    () =>
      api.get(
        `/admin/settlements/history/${encodeURIComponent(kind)}/${encodeURIComponent(id)}`,
      ),
    [kind, id, version, revision],
  );
  const history = data as History | undefined;
  useEffect(() => {
    setChecked(false);
    onReviewed?.("");
  }, [id, kind, version, revision, onReviewed]);
  if (error)
    return (
      <ErrorState
        error={error}
        title="History review unavailable"
        onRetry={() => setRevision((value) => value + 1)}
      />
    );
  if (loading || !history)
    return <p role="status">Loading the full recorded history…</p>;
  const { record, lines, payments, evidence, issues, audit_note } =
    history.data;
  const job = record.job as Row | undefined;
  const timeline = [
    ...history.data.events,
    ...history.data.financial_events,
  ].sort(
    (a, b) =>
      text(a.at).localeCompare(text(b.at)) ||
      text(a.id).localeCompare(text(b.id)),
  );
  const serviceIssues = timeline.filter((event) => event.to === "disputed");
  const openCases = issues.filter((issue) =>
    ["open", "under_review"].includes(text(issue.status)),
  );
  const confirmedAt =
    job?.confirmed_at ??
    timeline.find((event) => event.to === "customer_confirmed")?.at;
  const status = text(job?.status ?? record.status);
  return (
    <section
      className="settlement-full-history"
      aria-label="Full recorded history"
    >
      <header className="settlement-history-heading">
        <div>
          <h3>{kind === "quote" ? "Service" : "Goods"} history and issues</h3>
          <p>Review the record before making a financial decision.</p>
        </div>
        <button
          type="button"
          className="reference-link-button"
          onClick={() => setRevision((value) => value + 1)}
        >
          <ReferenceIcon name="refresh" size={16} /> Reload history
        </button>
      </header>
      <div className="settlement-history-overview">
        <div className="settlement-history-title">
          <div>
            <strong>{text(record.title)}</strong>
            <p>{text(record.business)}</p>
          </div>
          <StatusBadge status={status} />
        </div>
        <p className="settlement-history-description">
          {text(record.description ?? record.specification ?? record.notes)}
        </p>
        <dl className="settlement-history-facts">
          <div>
            <dt>Customer</dt>
            <dd>{text(record.customer)}</dd>
          </div>
          {kind === "quote" && (
            <div>
              <dt>Assigned provider</dt>
              <dd>{text(record.assigned_provider)}</dd>
            </div>
          )}
          <div>
            <dt>Requested</dt>
            <dd>{historyDate(record.created_at)}</dd>
          </div>
          <div>
            <dt>
              {kind === "quote" ? "Service location" : "Delivery / collection"}
            </dt>
            <dd>
              {historyAddress(
                record.service_address ??
                  record.delivery_address ??
                  record.fulfilment_type,
              )}
            </dd>
          </div>
          {Boolean(record.responded_at ?? record.offer_responded_at) && (
            <div>
              <dt>Quote response</dt>
              <dd>
                {historyDate(record.responded_at ?? record.offer_responded_at)}
              </dd>
            </div>
          )}
          {kind === "quote" && (
            <div>
              <dt>Customer confirmation</dt>
              <dd>
                {confirmedAt
                  ? historyDate(confirmedAt)
                  : status === "customer_confirmed"
                    ? "Recorded; timestamp unavailable"
                    : "Not confirmed"}
              </dd>
            </div>
          )}
        </dl>
      </div>
      <section
        className="settlement-history-section"
        aria-label="Charges and goods"
      >
        <h4>
          <ReferenceIcon name="document" size={18} />{" "}
          {kind === "quote" ? "Agreed charges" : "Goods and quantities"}{" "}
          <span>{lines.length}</span>
        </h4>
        {lines.length ? (
          <div className="settlement-charge-wrap">
            <PaginatedTable className="settlement-charge-table">
              <caption className="sr-only">
                Recorded charges and goods, amounts in {text(record.currency)}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Description</th>
                  <th scope="col">Qty × price</th>
                  <th scope="col">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr key={text(line.id ?? index)}>
                    <td>
                      <strong>
                        {text(
                          line.description ?? line.product_name ?? line.name,
                        )}
                      </strong>
                      {line.fulfilled_quantity !== undefined && (
                        <small>
                          Fulfilled {text(line.fulfilled_quantity)} ·{" "}
                          {historyLabel(line.status)}
                        </small>
                      )}
                    </td>
                    <td>
                      {text(line.quantity ?? line.requested_quantity)} ×{" "}
                      {historyAmount(line.unit_price, record.currency)}
                    </td>
                    <td>
                      {historyAmount(
                        line.line_total ?? line.total,
                        record.currency,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <th colSpan={2} scope="row">
                    Agreed total
                  </th>
                  <td>
                    {historyAmount(
                      record.total ?? record.agreed_total,
                      record.currency,
                    )}
                  </td>
                </tr>
              </tfoot>
            </PaginatedTable>
          </div>
        ) : (
          <p className="settlement-history-empty">
            No itemised charges recorded.
          </p>
        )}
      </section>
      <section
        className="settlement-history-section"
        aria-label="Payment history"
      >
        <h4>
          <ReferenceIcon name="wallet" size={18} /> Payment history{" "}
          <span>{payments.length}</span>
        </h4>
        {payments.length ? (
          <ul className="settlement-payment-rows">
            {payments.map((payment, index) => (
              <li key={text(payment.id ?? index)}>
                <div className="settlement-payment-top">
                  <div>
                    <StatusBadge status={text(payment.status)} />
                    {Boolean(payment.simulated) && <small>Simulation</small>}
                    {payment.stage !== undefined && (
                      <small>{historyLabel(payment.stage)}</small>
                    )}
                  </div>
                  <strong>
                    {historyAmount(payment.amount, payment.currency)}
                  </strong>
                </div>
                <div className="settlement-payment-meta">
                  <time>{historyDate(payment.created_at)}</time>
                  <span>
                    Collection recorded
                    {payment.provider_status
                      ? ` · ${historyLabel(payment.provider_status)}`
                      : ""}
                  </span>
                </div>
                <details className="settlement-reference-detail">
                  <summary>Transaction reference</summary>
                  <code>{text(payment.reference)}</code>
                </details>
              </li>
            ))}
          </ul>
        ) : (
          <p className="settlement-history-empty">
            No payment attempts recorded.
          </p>
        )}
        <p className="settlement-history-caption">
          Customer payment and completed work do not, on their own, confirm
          merchant disbursement.
        </p>
      </section>
      <div className="settlement-history-columns">
        <section
          className="settlement-history-section"
          aria-label="Recorded activity"
        >
          <h4>
            <ReferenceIcon name="clock" size={18} /> Activity timeline{" "}
            <span>{timeline.length}</span>
          </h4>
          {timeline.length ? (
            <ol className="settlement-activity-timeline">
              {timeline.map((event, index) => {
                const date = historyDate(event.at, "date");
                const previousDate = index
                  ? historyDate(timeline[index - 1].at, "date")
                  : "";
                return (
                  <li key={`${text(event.id)}:${index}`}>
                    {date !== previousDate && (
                      <p className="settlement-activity-date">{date}</p>
                    )}
                    <div className="settlement-activity-entry">
                      <time>{historyDate(event.at, "time")}</time>
                      <span
                        className="settlement-activity-dot"
                        aria-hidden="true"
                      />
                      <div>
                        <strong>
                          {historyLabel(event.to ?? event.action)}
                        </strong>
                        <p>{text(event.actor ?? "System")}</p>
                        {Boolean(event.note) && (
                          <p className="settlement-activity-note">
                            {text(event.note)}
                          </p>
                        )}
                        {Boolean(event.from) && (
                          <small>
                            Previous state: {historyLabel(event.from)}
                          </small>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="settlement-history-empty">
              No earlier status events were recorded for this route.
            </p>
          )}
        </section>
        <div>
          <section
            className="settlement-history-section"
            aria-label="Work record and evidence"
          >
            <h4>
              <ReferenceIcon name="briefcase" size={18} /> Work record and
              evidence <span>{evidence.length}</span>
            </h4>
            {evidence.length ? (
              <ul className="settlement-evidence-rows">
                {evidence.map((entry, index) => (
                  <li key={text(entry.id ?? index)}>
                    <div className="settlement-evidence-title">
                      <strong>{historyLabel(entry.kind)}</strong>
                      <time>{historyDate(entry.at)}</time>
                    </div>
                    <p>{text(entry.note)}</p>
                    <small>Recorded by {text(entry.actor)}</small>
                    {Boolean(entry.has_attachment) && (
                      <p className="settlement-history-caption">
                        Attachment recorded. File preview is not available in
                        this view.
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="settlement-history-empty">
                No separate work-evidence entries recorded.
              </p>
            )}
          </section>
          <section
            className="settlement-history-section"
            aria-label="Reported issues and disputes"
          >
            <h4>
              <ReferenceIcon name="shield" size={18} /> Reported issues and
              disputes <span>{issues.length + serviceIssues.length}</span>
            </h4>
            {openCases.length > 0 && (
              <p className="settlement-history-warning" role="status">
                {openCases.length} unresolved{" "}
                {openCases.length === 1 ? "case blocks" : "cases block"}{" "}
                disbursement. Review and resolve it before proceeding.
              </p>
            )}
            {Boolean(job?.dispute_reason) && (
              <p className="settlement-history-warning">
                Service issue: {text(job.dispute_reason)}. Current status:{" "}
                {historyLabel(job?.status)}.
              </p>
            )}
            {serviceIssues.map((event, index) => (
              <div className="settlement-issue-entry" key={index}>
                <strong>Issue reported in service history</strong>
                <p>{text(event.note)}</p>
                <time>{historyDate(event.at)}</time>
              </div>
            ))}
            {issues.map((issue, index) => (
              <div
                className="settlement-issue-entry"
                key={text(issue.id ?? index)}
              >
                <strong>{historyLabel(issue.status)}</strong>
                <p>{text(issue.reason)}</p>
                <dl>
                  <div>
                    <dt>Evidence</dt>
                    <dd>{text(issue.evidence_note)}</dd>
                  </div>
                  <div>
                    <dt>Resolution</dt>
                    <dd>{text(issue.resolution_note)}</dd>
                  </div>
                </dl>
                <time>{historyDate(issue.created_at)}</time>
              </div>
            ))}
            {!issues.length &&
              !serviceIssues.length &&
              !job?.dispute_reason && (
                <p className="settlement-history-empty">
                  No reported issues found in the recorded history.
                </p>
              )}
          </section>
        </div>
      </div>
      <p className="settlement-history-audit">
        <ReferenceIcon name="help" size={16} />
        <span>{audit_note}</span>
      </p>
      {onReviewed && (
        <label className="settlement-check settlement-history-ack">
          <input
            type="checkbox"
            checked={checked}
            onChange={(event) => {
              setChecked(event.target.checked);
              onReviewed(event.target.checked ? history.review_token : "");
            }}
          />
          <span>
            I reviewed the full recorded request, charges, payment, work
            history, evidence and reported issues. I understand the stated audit
            gaps.
          </span>
        </label>
      )}
    </section>
  );
}
export function SettlementHistoryPage() {
  const { kind = "quote", id = "" } = useParams();
  return (
    <div className="settlement-page">
      <h1>Finance history review</h1>
      <p>This view does not collect, refund or disburse money.</p>
      <Link to="/portal/admin/settlements">
        Back to payments and settlements
      </Link>
      <SettlementHistory id={id} kind={kind} />
    </div>
  );
}
