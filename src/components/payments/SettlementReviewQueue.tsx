import { useState, type FormEvent } from "react";
import api from "@/lib/api/crud";
import { validPhone, internationalPhone } from "@/lib/phone";
import { userMessage } from "@/lib/userMessage";
import { PhoneInput } from "@/components/shared/PhoneInput";
import { RecordListTable } from "@/components/common/RecordListTable";
import { ReferencePanel } from "@/components/reference/ReferenceUI";
import { ErrorState } from "@/components/common/ErrorState";
import { settlementMoney } from "@/lib/settlement";
import { SettlementHistory } from "./SettlementHistory";
import {
  useSettlementAlerts,
  type SettlementAlert,
} from "./SettlementAlertsContext";

export function SettlementReviewQueue({
  onRecovered,
}: {
  onRecovered: () => void;
}) {
  const { data, error, loading, offset, setOffset, refresh, read } =
    useSettlementAlerts();
  const [selected, setSelected] = useState("");
  const [notice, setNotice] = useState("");
  const [readError, setReadError] = useState<unknown>();
  if (error)
    return (
      <ErrorState
        error={error}
        title="Settlement review queue unavailable"
        onRetry={refresh}
      />
    );
  if (!data?.can_manage) return null;
  const item = data.items.find((row) => row.quote_id === selected);
  return (
    <section id="settlement-review-queue" className="settlement-review-queue">
      <ReferencePanel title={`Collected but unsettled (${data.total})`}>
        <p className="reference-note">
          Verified customer collections without a settlement record. Reading an
          alert does not resolve it. Never collect these payments again.
        </p>
        {notice && (
          <p className="workflow-feedback" role="status">
            {notice}
          </p>
        )}
        {readError && <ErrorState error={readError} />}
        <div className="reference-table-wrap">
          <RecordListTable
            className="reference-table"
            aria-label="Collected but unsettled payments"
          >
            <thead>
              <tr>
                <th scope="col">Service / business</th>
                <th scope="col">Customer</th>
                <th scope="col">Collected</th>
                <th scope="col">Review</th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((row) => (
                <tr key={row.quote_id}>
                  <td>
                    {row.unread && (
                      <span
                        className="settlement-unread-dot"
                        aria-label="Unread"
                      />
                    )}
                    <strong>{row.title}</strong>
                    <small className="block">{row.business}</small>
                  </td>
                  <td>{row.customer}</td>
                  <td>
                    {new Intl.NumberFormat("en-ZM", {
                      style: "currency",
                      currency: row.currency,
                    }).format(row.gross_minor / 100)}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="reference-link-button"
                      onClick={() => {
                        setSelected(row.quote_id);
                        setNotice("");
                        if (row.unread)
                          void read(row.quote_id).catch(setReadError);
                      }}
                    >
                      Review payment
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </RecordListTable>
        </div>
        {!data.items.length && (
          <p className="reference-note">
            No collected quoted-service payments awaiting settlement review on
            this page.
          </p>
        )}
        <div className="reference-pagination">
          <button
            disabled={!offset || loading}
            onClick={() => {
              setSelected("");
              setOffset(Math.max(0, offset - 20));
            }}
          >
            Previous
          </button>
          <span>Page {offset / 20 + 1}</span>
          <button
            disabled={!data.has_more || loading}
            onClick={() => {
              setSelected("");
              setOffset(offset + 20);
            }}
          >
            Next
          </button>
        </div>
      </ReferencePanel>
      {item && (
        <RecoveryForm
          key={item.quote_id}
          item={item}
          onClose={() => setSelected("")}
          onDone={() => {
            setSelected("");
            setNotice(
              "Existing payment recorded. No new collection or disbursement was sent. Open its settlement record below to review and explicitly authorise release.",
            );
            refresh();
            onRecovered();
          }}
        />
      )}
    </section>
  );
}

function RecoveryForm({
  item,
  onClose,
  onDone,
}: {
  item: SettlementAlert;
  onClose: () => void;
  onDone: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [reserve, setReserve] = useState("0");
  const [owned, setOwned] = useState(false);
  const [outstanding, setOutstanding] = useState(false);
  const [historyToken, setHistoryToken] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const ready =
    item.recoverable &&
    owned &&
    outstanding &&
    Boolean(historyToken) &&
    validPhone(phone) &&
    name.trim().length >= 2 &&
    note.trim().length >= 10 &&
    Number.isInteger(Number(reserve)) &&
    Number(reserve) >= 0 &&
    Number(reserve) <= 100000000;
  async function recover(event: FormEvent) {
    event.preventDefault();
    if (busy || !ready) return;
    setBusy(true);
    setError("");
    try {
      await api.post("/admin/settlements/recover", {
        quote_id: item.quote_id,
        collection_reference: item.collection_reference,
        recipient_name: name,
        phone: internationalPhone(phone),
        verification_note: note,
        fee_reserve_minor: Number(reserve),
        ownership_verified: owned,
        outstanding_verified: outstanding,
        history_token: historyToken,
        history_reviewed: true,
      });
      onDone();
    } catch (cause) {
      setError(
        userMessage(
          cause,
          "The payment could not be recorded for settlement. Refresh its history and verify the existing record before trying again.",
        ),
      );
      setHistoryToken("");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section
      className="settlement-recovery"
      aria-label="Review collected payment"
    >
      <h2>{item.title}</h2>
      <p>
        {item.business} · {item.customer} · {settlementMoney(item.gross_minor)}
      </p>
      <p>Collection reference: {item.collection_reference}</p>
      <p>
        This step records the existing payment only. It does not collect again
        or authorise disbursement.
      </p>
      <form className="settlement-form" onSubmit={recover}>
        <SettlementHistory id={item.quote_id} onReviewed={setHistoryToken} />
        {!item.recoverable && (
          <p className="settlement-history-warning" role="status">
            Recovery is unavailable until the customer confirms completion, a
            work record exists, open disputes are resolved, and the quote and
            ZMW collection match.
          </p>
        )}
        <label htmlFor="recovery-name">Verified merchant wallet holder</label>
        <input
          id="recovery-name"
          required
          minLength={2}
          maxLength={160}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <label htmlFor="recovery-phone">
          Verified merchant mobile-money number
        </label>
        <PhoneInput
          id="recovery-phone"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
        />
        <label htmlFor="recovery-note">
          Verification evidence and settlement review (10–1000 characters)
        </label>
        <textarea
          id="recovery-note"
          required
          minLength={10}
          maxLength={1000}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Record recipient ownership checks and how you verified no prior payout or refund. Do not include PINs or secrets."
        />
        <label htmlFor="recovery-reserve">
          Additional float reserve, ngwee (100 = K1)
        </label>
        <input
          id="recovery-reserve"
          type="number"
          required
          min={0}
          max={100000000}
          step={1}
          value={reserve}
          onChange={(event) => setReserve(event.target.value)}
        />
        <label className="settlement-check">
          <input
            type="checkbox"
            checked={owned}
            onChange={(event) => setOwned(event.target.checked)}
          />
          I independently verified ownership of this merchant recipient and the
          fee reserve.
        </label>
        <label className="settlement-check">
          <input
            type="checkbox"
            checked={outstanding}
            onChange={(event) => setOutstanding(event.target.checked)}
          />
          I checked that this payment has not already been refunded or paid to
          the merchant, including any manual transfer outside this app.
        </label>
        {!ready && (
          <p className="workflow-help">
            Review the history, complete recipient verification and both
            declarations to enable recording. The gateway will recheck the
            original payment.
          </p>
        )}
        {error && (
          <p className="workflow-feedback is-error" role="alert">
            {error}
          </p>
        )}
        <div className="settlement-actions">
          <button className="reference-button" disabled={busy || !ready}>
            {busy
              ? "Verifying existing collection…"
              : "Record existing payment, no disbursement"}
          </button>
          <button
            type="button"
            className="reference-link-button"
            disabled={busy}
            onClick={onClose}
          >
            Cancel review
          </button>
        </div>
      </form>
    </section>
  );
}
