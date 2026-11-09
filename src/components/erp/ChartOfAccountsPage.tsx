import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api/crud";
import { RecordListTable } from "@/components/common/RecordListTable";
import { PaginatedTable } from "@/components/common/PaginatedTable";
import {
  ERPLayout,
  Section,
  Field,
  Loading,
  Refresh,
  Feedback,
} from "./ERPShared";
import { useERP, useAction } from "./useERP";
import { endpoint, money, day, type Account } from "./erp";
import "./accounting-tools.css";

type ChartAccount = Account & {
  description: string;
  is_active: boolean;
  is_system: boolean;
  version: number;
  debit_minor: number;
  credit_minor: number;
  balance_minor: number;
};
type Ledger = {
  id: string;
  reference: string;
  description: string;
  posting_date: string;
  debit_minor: number;
  credit_minor: number;
  actor: string;
  reversal_of?: string;
};
const blank = {
  code: "",
  name: "",
  kind: "asset",
  description: "",
  is_active: true,
  version: 0,
};
export default function ChartOfAccountsPage() {
  const chart = useERP<ChartAccount>("accounts");
  return (
    <ERPLayout
      title="Chart of accounts"
      description="Your branch’s account codes, classifications and posted ledger balances in ZMW."
      action={<Refresh onClick={chart.refresh} />}
    >
      <div className="accounting-tool-links">
        <Link to="/portal/owner/accounting">← Accounting</Link>
        <Link to="/portal/owner/accounting/imports">
          Import accounts or journals →
        </Link>
      </div>
      {chart.store && (
        <Chart key={chart.store} chart={chart} store={chart.store} />
      )}
    </ERPLayout>
  );
}
function Chart({
  chart,
  store,
}: {
  chart: ReturnType<typeof useERP<ChartAccount>>;
  store: string;
}) {
  const action = useAction(),
    editor = useRef<HTMLDivElement>(null),
    ledgerRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState(""),
    [kind, setKind] = useState("all"),
    [editing, setEditing] = useState<ChartAccount | null | undefined>();
  const [form, setForm] = useState(blank),
    [selected, setSelected] = useState("");
  const [from, setFrom] = useState(day().slice(0, 4) + "-01-01"),
    [to, setTo] = useState(day());
  const validDates =
    /^\d{4}-\d{2}-\d{2}$/.test(from) &&
    /^\d{4}-\d{2}-\d{2}$/.test(to) &&
    from <= to;
  const ledger = useERP<Ledger>(
    `accounts/${encodeURIComponent(selected)}/ledger?from=${from}&to=${to}`,
    Boolean(selected) && validDates,
  );
  const rows =
    chart.items?.filter(
      (a) =>
        (kind === "all" || a.kind === kind) &&
        `${a.code} ${a.name} ${a.description}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    ) ?? [];
  const current = chart.items?.find((a) => a.code === selected);
  const valid =
    /^[A-Z0-9][A-Z0-9._-]{1,19}$/.test(form.code) && Boolean(form.name.trim());
  function edit(a: ChartAccount | null) {
    setEditing(a);
    setForm(
      a
        ? {
            code: a.code,
            name: a.name,
            kind: a.kind,
            description: a.description,
            is_active: a.is_active,
            version: a.version,
          }
        : blank,
    );
    requestAnimationFrame(() => editor.current?.focus());
  }
  return (
    <>
      <Feedback {...action} />
      <div className="erp-kpis">
        {["asset", "liability", "equity", "income", "expense"].map((type) => (
          <div key={type}>
            <span>{type[0].toUpperCase() + type.slice(1)} accounts</span>
            <strong>
              {chart.items
                ? chart.items.filter((a) => a.kind === type).length
                : "—"}
            </strong>
          </div>
        ))}
      </div>
      <Section
        title="Accounts"
        action={
          <button type="button" onClick={() => edit(null)}>
            Add account
          </button>
        }
      >
        <div className="erp-pad erp-form-grid">
          <Field label="Find an account">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Code, name or description"
            />
          </Field>
          <Field label="Account type">
            <select value={kind} onChange={(e) => setKind(e.target.value)}>
              <option value="all">All types</option>
              {["asset", "liability", "equity", "income", "expense"].map(
                (k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ),
              )}
            </select>
          </Field>
        </div>
        <Loading {...chart} retry={chart.refresh} />
        {rows.length > 0 ? (
          <RecordListTable className="erp-table" aria-label="Chart of accounts">
            <thead>
              <tr>
                <th>Code / account</th>
                <th>Type</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Net debit / (credit)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.code}>
                  <th scope="row">
                    <strong>
                      {a.code} · {a.name}
                    </strong>
                    <small>
                      {a.description || "No description"}
                      {a.is_system ? " · Control account" : ""}
                    </small>
                  </th>
                  <td>{a.kind}</td>
                  <td className="erp-number">{money(a.debit_minor)}</td>
                  <td className="erp-number">{money(a.credit_minor)}</td>
                  <td className="erp-number">{money(a.balance_minor)}</td>
                  <td>{a.is_active ? "Active" : "Inactive"}</td>
                  <td>
                    <button
                      type="button"
                      className="erp-secondary"
                      onClick={() => edit(a)}
                      aria-label={`Edit account ${a.code}`}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="erp-secondary"
                      onClick={() => {
                        setSelected(a.code);
                        requestAnimationFrame(() => ledgerRef.current?.focus());
                      }}
                      aria-label={`View ledger ${a.code}`}
                    >
                      Ledger
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </RecordListTable>
        ) : (
          chart.items && (
            <p className="erp-empty">No accounts match these filters.</p>
          )
        )}
        <p className="erp-hint erp-pad">
          Balances include all posted entries and reversals for this branch.
          Control accounts remain active for invoice, payment and bill postings.
          Classification and codes cannot be changed; add a new account when a
          different classification is needed.
        </p>
      </Section>
      {editing !== undefined && (
        <div ref={editor} tabIndex={-1}>
          <Section title={editing ? "Edit account" : "Add account"}>
            <form
              className="erp-form"
              onSubmit={(e) => {
                e.preventDefault();
                void action.run(async () => {
                  await (editing
                    ? api.put(
                        endpoint(
                          store,
                          `accounts/${encodeURIComponent(form.code)}`,
                        ),
                        form,
                      )
                    : api.post(endpoint(store, "accounts"), form));
                  setEditing(undefined);
                  chart.refresh();
                }, "Account saved.");
              }}
            >
              <div className="erp-form-grid">
                <Field
                  label="Account code"
                  hint="2–20 uppercase letters, numbers, dots, underscores or hyphens. Codes are permanent."
                >
                  <input
                    required
                    maxLength={20}
                    spellCheck={false}
                    disabled={Boolean(editing)}
                    value={form.code}
                    onChange={(e) =>
                      setForm({ ...form, code: e.target.value.toUpperCase() })
                    }
                  />
                </Field>
                <Field label="Account name">
                  <input
                    required
                    maxLength={120}
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </Field>
                <Field label="Classification">
                  <select
                    disabled={Boolean(editing)}
                    value={form.kind}
                    onChange={(e) => setForm({ ...form, kind: e.target.value })}
                  >
                    {["asset", "liability", "equity", "income", "expense"].map(
                      (k) => (
                        <option key={k}>{k}</option>
                      ),
                    )}
                  </select>
                </Field>
              </div>
              <Field label="Description (optional)">
                <textarea
                  maxLength={1000}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </Field>
              <label className="erp-check">
                <input
                  type="checkbox"
                  disabled={editing?.is_system}
                  checked={form.is_active}
                  onChange={(e) =>
                    setForm({ ...form, is_active: e.target.checked })
                  }
                />
                Active for new postings
              </label>
              {!valid && (
                <p className="erp-hint">
                  Enter a valid account code and account name before saving.
                </p>
              )}
              <div className="erp-actions">
                <button disabled={action.busy || !valid}>Save account</button>
                <button
                  type="button"
                  className="erp-secondary"
                  onClick={() => setEditing(undefined)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </Section>
        </div>
      )}
      {current && (
        <div ref={ledgerRef} tabIndex={-1}>
          <Section
            title={`Account ledger · ${current.code} · ${current.name}`}
            action={
              <button
                type="button"
                className="erp-secondary"
                onClick={() => setSelected("")}
              >
                Close ledger
              </button>
            }
          >
            <div className="erp-pad erp-form-grid">
              <Field label="Ledger from">
                <input
                  type="date"
                  max={to || undefined}
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </Field>
              <Field label="Ledger to">
                <input
                  type="date"
                  min={from || undefined}
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </Field>
            </div>
            {validDates ? (
              <Loading {...ledger} retry={ledger.refresh} />
            ) : (
              <p className="erp-hint erp-pad" role="status">
                Choose a valid from and to date, with the end on or after the
                start.
              </p>
            )}
            {ledger.items && (
              <PaginatedTable className="erp-table" aria-label="Account ledger">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Reference / description</th>
                    <th>Debit</th>
                    <th>Credit</th>
                    <th>Recorded by</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.items.map((l) => (
                    <tr key={l.id}>
                      <td>{l.posting_date.slice(0, 10)}</td>
                      <td>
                        <strong>{l.reference}</strong>
                        <small>
                          {l.description}
                          {l.reversal_of ? " · Reversal" : ""}
                        </small>
                      </td>
                      <td>{money(l.debit_minor)}</td>
                      <td>{money(l.credit_minor)}</td>
                      <td>{l.actor}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th colSpan={2}>Selected-period totals</th>
                    <td>
                      {money(
                        ledger.items.reduce(
                          (n, l) => n + Number(l.debit_minor),
                          0,
                        ),
                      )}
                    </td>
                    <td>
                      {money(
                        ledger.items.reduce(
                          (n, l) => n + Number(l.credit_minor),
                          0,
                        ),
                      )}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </PaginatedTable>
            )}
            {ledger.items?.length === 0 && (
              <p className="erp-empty">
                No entries in this account during the selected period.
              </p>
            )}
          </Section>
        </div>
      )}
    </>
  );
}
