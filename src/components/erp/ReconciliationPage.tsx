import { PaginatedTable } from '@/components/common/PaginatedTable';
import { useMemo, useState } from "react";
import api from "@/lib/api/crud";
import { parseBankCSV } from "@/lib/erpBankCSV";
import {
  ERPLayout,
  Section,
  FormPanel,
  Field,
  Loading,
  Feedback,
  Refresh,
} from "./ERPShared";
import { useERP, useAction } from "./useERP";
import { endpoint, money, day, stamp, type Journal } from "./erp";
type BankLine = {
  id: string;
  line_date: string;
  reference: string;
  amount_minor: number;
  statement_reference: string;
  journal_id?: string;
  journal_reference?: string;
};
type Period = {
  through_date: string;
  reason: string;
  actor: string;
  created_at: string;
};
type MatchHistory = {
  id: string;
  bank_reference: string;
  journal_reference: string;
  action: string;
  reason: string;
  actor: string;
  created_at: string;
};
export default function ReconciliationPage() {
  const lines = useERP<BankLine>("bank-lines");
  return (
    <ERPLayout
      title="Reconciliation & periods"
      description="Match imported statement lines to recorded cash journals, then protect reviewed accounting periods."
      action={<Refresh onClick={lines.refresh} />}
    >
      {lines.store && (
        <Controls key={lines.store} store={lines.store} lines={lines} />
      )}
    </ERPLayout>
  );
}
function Controls({
  store,
  lines,
}: {
  store: string;
  lines: ReturnType<typeof useERP<BankLine>>;
}) {
  const journals = useERP<Journal>("journals"),
    history = useERP<MatchHistory>("bank-match-history"),
    periods = useERP<Period>("period-history"),
    action = useAction();
  const [csv, setCsv] = useState(""),
    [reference, setReference] = useState(""),
    [request, setRequest] = useState(crypto.randomUUID()),
    [selected, setSelected] = useState(""),
    [journal, setJournal] = useState(""),
    [reason, setReason] = useState(""),
    [remove, setRemove] = useState(false),
    [through, setThrough] = useState(""),
    [closeReason, setCloseReason] = useState(""),
    [confirm, setConfirm] = useState(false);
  const preview = useMemo(() => {
    if (!csv.trim()) return { items: [], error: "" };
    try {
      return { items: parseBankCSV(csv), error: "" };
    } catch (e) {
      return { items: [], error: (e as Error).message };
    }
  }, [csv]);
  const row = lines.items?.find((l) => l.id === selected),
    closed = periods.items?.[0]?.through_date.slice(0, 10);
  const choices = journals.items?.filter(
    (j) =>
      !journals.items?.some((r) => r.reversal_of === j.id) &&
      !lines.items?.some((l) => l.journal_id === j.id) &&
      j.lines
        .filter((l) => l.account === "1000")
        .reduce((n, l) => n + l.debit_minor - l.credit_minor, 0) ===
        row?.amount_minor,
  );
  const refresh = () => {
    lines.refresh();
    history.refresh();
    periods.refresh();
    journals.refresh();
  };
  return (
    <>
      <Feedback {...action} />
      <FormPanel title="Import bank / cash statement CSV">
        <form
          className="erp-form"
          onSubmit={(e) => {
            e.preventDefault();
            void action.run(async () => {
              await api.post(endpoint(store, "bank-statements"), {
                id: request,
                reference,
                lines: preview.items,
              });
              setRequest(crypto.randomUUID());
              setCsv("");
              setReference("");
              refresh();
            }, "Statement imported. Review and match each line.");
          }}
        >
          <Field label="Statement reference">
            <input
              required
              maxLength={100}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </Field>
          <Field label="Choose CSV file (optional)">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  if (file.size > 90000) {
                    void action.run(async () => {
                      throw new Error("Choose a CSV no larger than 90 KB.");
                    });
                    return;
                  }
                  void file.text().then(setCsv);
                }
              }}
            />
          </Field>
          <Field
            label="Statement CSV"
            hint="Columns: date,reference,amount. Dates: YYYY-MM-DD. Money in is positive; money out is negative. Amounts are ZMW. Up to 500 lines."
          >
            <textarea
              value={csv}
              onChange={(e) => setCsv(e.target.value)}
              placeholder="date,reference,amount"
              rows={6}
            />
          </Field>
          {preview.error && (
            <p className="erp-feedback is-error" role="alert">
              {preview.error}
            </p>
          )}
          {preview.items.length > 0 && (
            <>
              <p className="erp-hint">
                {preview.items.length} lines ready · Preview of the first 5:
              </p>
              <div className="erp-scroll">
                <PaginatedTable className="erp-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Reference</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.items.slice(0, 5).map((l, i) => (
                      <tr key={i}>
                        <td>{l.date}</td>
                        <td>{l.reference}</td>
                        <td>{money(l.amount_minor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </PaginatedTable>
              </div>
            </>
          )}
          <button
            disabled={
              action.busy ||
              !reference.trim() ||
              !preview.items.length ||
              !!preview.error
            }
          >
            Import statement lines
          </button>
        </form>
      </FormPanel>
      <Section title="Statement matching">
        <Loading {...lines} retry={lines.refresh} />
        <div className="erp-scroll">
          <PaginatedTable className="erp-table">
            <thead>
              <tr>
                <th>Bank line</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Matched journal</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {lines.items?.map((l) => (
                <tr key={l.id}>
                  <td>
                    {l.reference}
                    <small>{l.statement_reference}</small>
                  </td>
                  <td>{l.line_date.slice(0, 10)}</td>
                  <td className="erp-number">{money(l.amount_minor)}</td>
                  <td>{l.journal_reference || "Unmatched"}</td>
                  <td>
                    <button
                      className="erp-secondary"
                      onClick={() => {
                        setSelected(l.id);
                        setRemove(!!l.journal_id);
                        setJournal(l.journal_id || "");
                        setReason("");
                      }}
                    >
                      {l.journal_id ? "Undo match" : "Match journal"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </PaginatedTable>
        </div>
        {row && (
          <form
            className="erp-form"
            onSubmit={(e) => {
              e.preventDefault();
              void action.run(
                async () => {
                  await api.post(
                    endpoint(store, `bank-lines/${row.id}/match`),
                    { journal_id: journal, reason, remove },
                  );
                  setSelected("");
                  refresh();
                },
                remove
                  ? "Match removed. The decision history is retained."
                  : "Statement line matched to the journal.",
              );
            }}
          >
            <h3>
              {remove ? "Undo match" : "Match journal"} · {row.reference}
            </h3>
            {!remove && (
              <Field label="Matching cash journal">
                <select
                  required
                  value={journal}
                  onChange={(e) => setJournal(e.target.value)}
                >
                  <option value="">
                    Choose a journal with the same signed cash amount
                  </option>
                  {choices?.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.reference} · {j.posting_date.slice(0, 10)}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {!remove && !choices?.length && (
              <p className="erp-hint">
                No unmatched journal has the same cash amount. Record or correct
                the accounting entry first.
              </p>
            )}
            <Field label="Matching decision / reason">
              <input
                required
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </Field>
            <div className="erp-actions">
              <button disabled={action.busy || !journal || !reason.trim()}>
                {remove ? "Confirm undo match" : "Confirm match"}
              </button>
              <button
                type="button"
                className="erp-secondary"
                onClick={() => setSelected("")}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </Section>
      <Section title="Reconciliation history">
        <Loading {...history} retry={history.refresh} />
        <ol className="erp-timeline">
          {history.items?.map((h) => (
            <li key={h.id}>
              <strong>
                {h.bank_reference} · {h.action}
              </strong>
              <p>
                {h.journal_reference} · {h.reason}
              </p>
              <small>
                {h.actor} · {stamp(h.created_at)}
              </small>
            </li>
          ))}
        </ol>
      </Section>
      <FormPanel title="Close a reviewed accounting period">
        <form
          className="erp-form"
          onSubmit={(e) => {
            e.preventDefault();
            void action.run(async () => {
              await api.post(endpoint(store, "close-period"), {
                through_date: through,
                reason: closeReason,
              });
              setConfirm(false);
              setCloseReason("");
              refresh();
            }, "Accounting period closed. Earlier posting dates are protected.");
          }}
        >
          <p className="erp-hint">
            {closed
              ? `Posting dates through ${closed} are closed.`
              : "No accounting period has been closed."}{" "}
            Closing prevents new postings and reversals on or before the chosen
            date. It does not change account balances. This version does not
            reopen closed periods; corrections must use an open posting date.
          </p>
          <Field label="Close through date">
            <input
              required
              type="date"
              value={through}
              max={day()}
              onChange={(e) => {
                setThrough(e.target.value);
                setConfirm(false);
              }}
            />
          </Field>
          <Field label="Review / closing reason">
            <input
              required
              maxLength={500}
              value={closeReason}
              onChange={(e) => setCloseReason(e.target.value)}
            />
          </Field>
          <label className="erp-check">
            <input
              type="checkbox"
              checked={confirm}
              onChange={(e) => setConfirm(e.target.checked)}
            />
            I have reviewed the entries and want to prevent further posting
            through this date.
          </label>
          <button
            disabled={
              action.busy ||
              !confirm ||
              !through ||
              (!!closed && through <= closed) ||
              !closeReason.trim()
            }
          >
            Close reviewed period
          </button>
        </form>
      </FormPanel>
      <Section title="Period closing history">
        <Loading {...periods} retry={periods.refresh} />
        <ol className="erp-timeline">
          {periods.items?.map((p) => (
            <li key={p.through_date}>
              <strong>Closed through {p.through_date.slice(0, 10)}</strong>
              <p>{p.reason}</p>
              <small>
                {p.actor} · {stamp(p.created_at)}
              </small>
            </li>
          ))}
        </ol>
      </Section>
    </>
  );
}
