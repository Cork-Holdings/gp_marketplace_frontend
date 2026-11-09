import { useState } from "react";
import api from "@/lib/api/crud";
import { FormPanel, Field, Feedback } from "./ERPShared";
import { useAction } from "./useERP";
import { endpoint, money, minor, type Account } from "./erp";
import "./accounting-tools.css";
import { journalDraft } from "@/lib/journalDraft";
type Line = { id: string; account: string; debit: string; credit: string };
const line = (account = ""): Line => ({
  id: crypto.randomUUID(),
  account,
  debit: "",
  credit: "",
});
export function JournalComposer({
  store,
  accounts,
  postingDate,
  dateOpen,
  saved,
}: {
  store: string;
  accounts: Account[];
  postingDate: string;
  dateOpen: boolean;
  saved: () => void;
}) {
  const action = useAction();
  const [reference, setReference] = useState(""),
    [description, setDescription] = useState(""),
    [lines, setLines] = useState<Line[]>(() => [line("1000"), line("3000")]),
    [journalId, setJournalId] = useState(crypto.randomUUID());
  const active = accounts.filter((a) => a.is_active !== false);
  const draft = journalDraft(
    lines,
    active.map((a) => a.code),
  );
  const debits = draft.debit,
    credits = draft.credit;
  const valid = Boolean(
    reference.trim() && description.trim() && dateOpen && draft.valid,
  );
  function update(id: string, patch: Partial<Line>) {
    setLines((rows) => rows.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }
  return (
    <FormPanel title="Record a balanced manual journal">
      <form
        className="erp-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (!valid) return;
          void action.run(async () => {
            await api.post(endpoint(store, "journals"), {
              id: journalId,
              reference,
              description,
              posting_date: postingDate,
              lines: lines.map((l) => ({
                account: l.account,
                debit_minor: minor(l.debit || "0"),
                credit_minor: minor(l.credit || "0"),
              })),
            });
            setJournalId(crypto.randomUUID());
            setReference("");
            setDescription("");
            setLines([line("1000"), line("3000")]);
            saved();
          }, "Balanced journal posted.");
        }}
      >
        <Feedback {...action} />
        <p className="erp-hint">
          Build a journal with 2–100 lines for verified opening balances or
          corrections. Posting date: {postingDate}. Debits and credits must
          balance. Customer and supplier payment allocations are recorded
          separately above.
        </p>
        <div className="erp-form-grid">
          <Field label="Journal reference">
            <input
              required
              maxLength={100}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </Field>
          <Field label="Explanation / source evidence">
            <input
              required
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
        </div>
        <div className="accounting-line-editor">
          {lines.map((l, i) => (
            <div className="accounting-journal-line" key={l.id}>
              <Field label={`Account · line ${i + 1}`}>
                <select
                  value={l.account}
                  onChange={(e) => update(l.id, { account: e.target.value })}
                >
                  <option value="">Choose an account</option>
                  {active.map((a) => (
                    <option key={a.code} value={a.code}>
                      {a.code} · {a.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={`Debit (ZMW) · line ${i + 1}`}>
                <input
                  inputMode="decimal"
                  pattern="[0-9]+([.][0-9]{1,2})?"
                  value={l.debit}
                  onChange={(e) => update(l.id, { debit: e.target.value })}
                />
              </Field>
              <Field label={`Credit (ZMW) · line ${i + 1}`}>
                <input
                  inputMode="decimal"
                  pattern="[0-9]+([.][0-9]{1,2})?"
                  value={l.credit}
                  onChange={(e) => update(l.id, { credit: e.target.value })}
                />
              </Field>
              <button
                type="button"
                className="erp-secondary"
                aria-label={`Remove journal line ${i + 1}`}
                disabled={lines.length <= 2 || action.busy}
                onClick={() =>
                  setLines((rows) => rows.filter((row) => row.id !== l.id))
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="erp-actions">
          <button
            type="button"
            className="erp-secondary"
            disabled={lines.length >= 100 || action.busy}
            onClick={() => setLines((rows) => [...rows, line()])}
          >
            Add journal line
          </button>
        </div>
        <div className="accounting-import-summary" role="status">
          <div>
            <span>Total debits</span>
            <strong>{money(debits)}</strong>
          </div>
          <div>
            <span>Total credits</span>
            <strong>{money(credits)}</strong>
          </div>
          <div>
            <span>Difference</span>
            <strong>{money(debits - credits)}</strong>
          </div>
        </div>
        {!valid && (
          <p className="erp-hint">
            {!dateOpen
              ? "Choose a posting date in an open accounting period."
              : "Enter a reference and explanation, select an active account on every line, and enter one debit or credit per line. Total debits and credits must be equal."}
          </p>
        )}
        <button disabled={action.busy || !valid}>Post balanced journal</button>
      </form>
    </FormPanel>
  );
}
