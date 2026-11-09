import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import api, { ApiError } from "@/lib/api/crud";
import { userMessage } from "@/lib/userMessage";
import { PaginatedTable } from "@/components/common/PaginatedTable";
import {
  ERPLayout,
  Section,
  Field,
  Loading,
  Feedback,
  Refresh,
} from "./ERPShared";
import { useERP } from "./useERP";
import {
  endpoint,
  money,
  type Contact,
  type Supplier,
  type Purchase,
} from "./erp";
import "./accounting-tools.css";

type Preview = {
  hash: string;
  kind: string;
  records: number;
  rows: number;
  debit_minor: number;
  credit_minor: number;
  issues: { row: number; message: string }[];
  items: {
    row: number;
    reference: string;
    description: string;
    type: string;
    date?: string;
    customer_id?: string;
    supplier_id?: string;
    source_id?: string;
    lines?: { account: string; debit_minor: number; credit_minor: number }[];
    amount_minor?: number;
    debit_minor?: number;
    credit_minor?: number;
  }[];
  applied: boolean;
  already_imported: boolean;
};
type Batch = {
  id: string;
  kind: string;
  file_name: string;
  record_count: number;
  actor: string;
  created_at: string;
};
const templates: Record<string, string> = {
  accounts:
    "code,name,kind,description\n1010,Equipment at cost,asset,Verified equipment cost\n6100,Rent expense,expense,Premises rent\n",
  journals:
    "reference,posting_date,description,account,debit,credit\nOPENING-001,2026-11-07,Verified opening balances,1000,100.00,\nOPENING-001,2026-11-07,Verified opening balances,3000,,100.00\n",
  documents:
    "kind,reference,description,amount,due_date,customer_id,supplier_id,source_id\ninvoice,INV-IMPORT-001,Describe the supplied service,100.00,2026-11-30,REPLACE_WITH_CUSTOMER_ID,,\nbill,BILL-IMPORT-001,Received goods from supplier,50.00,2026-11-30,,REPLACE_WITH_SUPPLIER_ID,REPLACE_WITH_RECEIVED_PURCHASE_ORDER_ID\n",
};
export default function AccountingImportsPage() {
  const batches = useERP<Batch>("imports");
  return (
    <ERPLayout
      title="Accounting imports"
      description="Upload a CSV, review row-level checks, then confirm the import for this branch."
      action={<Refresh onClick={batches.refresh} />}
    >
      <div className="accounting-tool-links">
        <Link to="/portal/owner/accounting">← Accounting</Link>
        <Link to="/portal/owner/accounting/accounts">Chart of accounts →</Link>
      </div>
      {batches.store && (
        <Importer key={batches.store} store={batches.store} batches={batches} />
      )}
    </ERPLayout>
  );
}
function Importer({
  store,
  batches,
}: {
  store: string;
  batches: ReturnType<typeof useERP<Batch>>;
}) {
  const [kind, setKind] = useState("accounts"),
    [csv, setCSV] = useState(""),
    [fileName, setFileName] = useState(""),
    [batchId, setBatchId] = useState(crypto.randomUUID()),
    [preview, setPreview] = useState<Preview>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState(""),
    [confirmed, setConfirmed] = useState(false);
  const customers = useERP<Contact>("finance-customers", kind === "documents"),
    suppliers = useERP<Supplier>("finance-suppliers", kind === "documents"),
    purchases = useERP<Purchase>("finance-purchases", kind === "documents");
  const reviewRef = useRef<HTMLDivElement>(null),
    fileRef = useRef<HTMLInputElement>(null),
    fileRevision = useRef(0);
  function reset() {
    fileRevision.current++;
    setPreview(undefined);
    setConfirmed(false);
    setError("");
    setSuccess("");
    setBatchId(crypto.randomUUID());
  }
  function download() {
    const url = URL.createObjectURL(
      new Blob([templates[kind]], { type: "text/csv;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = `geepay-${kind}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
  async function run(apply: boolean) {
    if (busy) return;
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const result: Preview = await api.post(
        endpoint(store, `imports/${apply ? "apply" : "preview"}`),
        {
          id: batchId,
          kind,
          csv,
          file_name: fileName || "Pasted CSV",
          preview_hash: apply ? preview?.hash : undefined,
        },
      );
      setPreview(result);
      setConfirmed(false);
      if (result.applied) {
        setSuccess(
          result.already_imported
            ? "This exact file has already been imported. No duplicate records were created."
            : kind === "documents"
              ? `${result.records} document drafts imported. Review them in Accounting before posting.`
              : `${result.records} ${kind} imported successfully.`,
        );
        batches.refresh();
        window.dispatchEvent(new Event("geepay:erp-refresh"));
      }
      requestAnimationFrame(() => reviewRef.current?.focus());
    } catch (e) {
      if (
        e instanceof ApiError &&
        e.details &&
        typeof e.details === "object" &&
        "issues" in e.details
      )
        setPreview(e.details as Preview);
      setError(
        userMessage(
          e,
          "The import could not be completed. Review the checks and try again.",
        ),
      );
    } finally {
      setBusy(false);
    }
  }
  const ready = Boolean(
    preview &&
    !preview.issues.length &&
    !preview.already_imported &&
    !preview.applied,
  );
  return (
    <>
      <ol className="accounting-import-steps" aria-label="Import progress">
        <li aria-current={!preview ? "step" : undefined}>1. Choose file</li>
        <li aria-current={preview && !preview.applied ? "step" : undefined}>
          2. Review checks
        </li>
        <li aria-current={preview?.applied ? "step" : undefined}>
          3. Confirm import
        </li>
      </ol>
      <Feedback error={error} success={success} />
      <Section title="Choose an import">
        <div className="erp-form">
          <div className="erp-form-grid">
            <Field label="Import type">
              <select
                disabled={busy}
                value={kind}
                onChange={(e) => {
                  reset();
                  setKind(e.target.value);
                  setCSV("");
                  setFileName("");
                  if (fileRef.current) fileRef.current.value = "";
                }}
              >
                <option value="accounts">Chart of accounts</option>
                <option value="journals">Journals / opening balances</option>
                <option value="documents">
                  Customer invoices / supplier bills
                </option>
              </select>
            </Field>
            <Field
              label="CSV file"
              hint="UTF-8 CSV, up to 1 MB and 500 data rows. Export an Excel sheet as CSV first."
            >
              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                disabled={busy}
                onChange={async (e) => {
                  reset();
                  setCSV("");
                  setFileName("");
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 1024 * 1024) {
                    setError("Use a CSV file no larger than 1 MB.");
                    return;
                  }
                  const revision = fileRevision.current;
                  try {
                    const text = await file.text();
                    if (revision !== fileRevision.current) return;
                    setCSV(text);
                    setFileName(file.name.slice(0, 160));
                  } catch {
                    setError(
                      "The file could not be read. Select it again or paste its CSV content.",
                    );
                  }
                }}
              />
            </Field>
          </div>
          <div className="erp-actions">
            <button type="button" className="erp-secondary" onClick={download}>
              Download CSV template
            </button>
          </div>
          <p className="erp-hint">
            {kind === "accounts"
              ? "New accounts are created as active. Existing codes are rejected so imported data cannot overwrite your chart. Use Edit in the chart to update an account."
              : kind === "journals"
                ? "Repeat a reference for each line of the same journal. Dates and descriptions must agree, and every journal must balance. Use evidenced opening balances; this does not create customer/supplier allocations or move money."
                : "Invoices and bills are imported as drafts. Use existing customer/supplier IDs. Bills require the ID of a received purchase order and cannot exceed its unbilled received value. Names are not matched automatically."}
          </p>
          <Field
            label="CSV content"
            hint="Keep the template headers in their original order. Dates use YYYY-MM-DD; amounts use ZMW with a dot and no currency symbols."
          >
            <textarea
              className="accounting-csv"
              spellCheck={false}
              wrap="off"
              disabled={busy}
              value={csv}
              onChange={(e) => {
                reset();
                setCSV(e.target.value);
                setFileName("Pasted CSV");
              }}
            />
          </Field>
          {!csv.trim() && (
            <p className="erp-hint">
              Choose a file or paste CSV content before previewing.
            </p>
          )}
          <button
            type="button"
            disabled={busy || !csv.trim()}
            onClick={() => void run(false)}
          >
            {busy ? "Checking…" : "Preview import"}
          </button>
        </div>
      </Section>
      {preview && (
        <div ref={reviewRef} tabIndex={-1}>
          <Section title="Import preview">
            <div className="accounting-import-summary">
              <div>
                <span>Data rows</span>
                <strong>{preview.rows}</strong>
              </div>
              <div>
                <span>Records</span>
                <strong>{preview.records}</strong>
              </div>
              <div>
                <span>Checks to fix</span>
                <strong>{preview.issues.length}</strong>
              </div>
              {kind === "journals" && (
                <>
                  <div>
                    <span>Total debits</span>
                    <strong>{money(preview.debit_minor)}</strong>
                  </div>
                  <div>
                    <span>Total credits</span>
                    <strong>{money(preview.credit_minor)}</strong>
                  </div>
                </>
              )}
            </div>
            {preview.already_imported && (
              <p className="erp-hint erp-pad" role="status">
                This exact file was previously imported for this branch. No
                further import is needed.
              </p>
            )}
            {preview.issues.length > 0 && (
              <div className="accounting-errors" role="alert">
                <h3>Fix these rows and preview the file again</h3>
                <PaginatedTable
                  aria-label="Import errors"
                  className="erp-table"
                >
                  <thead>
                    <tr>
                      <th>CSV row</th>
                      <th>What needs changing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.issues.map((issue, i) => (
                      <tr key={`${issue.row}:${i}`}>
                        <td>{issue.row}</td>
                        <td>{issue.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </PaginatedTable>
                <p>Nothing has been imported.</p>
              </div>
            )}
            <PaginatedTable
              aria-label="Import preview records"
              className="erp-table"
            >
              <thead>
                <tr>
                  <th>CSV row</th>
                  <th>Reference</th>
                  <th>Description</th>
                  <th>Type</th>
                  {kind === "journals" ? (
                    <>
                      <th>Debit</th>
                      <th>Credit</th>
                    </>
                  ) : kind === "documents" ? (
                    <>
                      <th>Due date</th>
                      <th>Amount</th>
                    </>
                  ) : null}
                </tr>
              </thead>
              <tbody>
                {preview.items.map((r) => (
                  <tr key={r.row}>
                    <td>{r.row}</td>
                    <td>{r.reference}</td>
                    <td>
                      {r.description}
                      {r.lines && (
                        <details className="accounting-preview-details">
                          <summary>Review journal lines</summary>
                          <p>Posting date: {r.date}</p>
                          <ul>
                            {r.lines.map((line, i) => (
                              <li key={i}>
                                <strong>{line.account}</strong> ·{" "}
                                {line.debit_minor
                                  ? `Debit ${money(line.debit_minor)}`
                                  : `Credit ${money(line.credit_minor)}`}
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                      {kind === "documents" && (
                        <details className="accounting-preview-details">
                          <summary>Review linked records</summary>
                          <dl>
                            {r.customer_id && (
                              <div>
                                <dt>Customer</dt>
                                <dd>
                                  {
                                    customers.items?.find(
                                      (c) => c.id === r.customer_id,
                                    )?.name
                                  }{" "}
                                  · {r.customer_id}
                                </dd>
                              </div>
                            )}
                            {r.supplier_id && (
                              <div>
                                <dt>Supplier</dt>
                                <dd>
                                  {
                                    suppliers.items?.find(
                                      (s) => s.id === r.supplier_id,
                                    )?.name
                                  }{" "}
                                  · {r.supplier_id}
                                </dd>
                              </div>
                            )}
                            {r.source_id && (
                              <div>
                                <dt>Received purchase order</dt>
                                <dd>
                                  {
                                    purchases.items?.find(
                                      (p) => p.id === r.source_id,
                                    )?.reference
                                  }{" "}
                                  · {r.source_id}
                                </dd>
                              </div>
                            )}
                          </dl>
                        </details>
                      )}
                    </td>
                    <td>{r.type}</td>
                    {kind === "journals" ? (
                      <>
                        <td>{money(r.debit_minor || 0)}</td>
                        <td>{money(r.credit_minor || 0)}</td>
                      </>
                    ) : kind === "documents" ? (
                      <>
                        <td>{r.date}</td>
                        <td>{money(r.amount_minor || 0)}</td>
                      </>
                    ) : null}
                  </tr>
                ))}
              </tbody>
            </PaginatedTable>
            <div className="erp-pad">
              <p className="erp-hint">
                {kind === "journals"
                  ? "Confirming posts every balanced journal in this file into the ledger. Existing history is retained; corrections use reversals."
                  : kind === "documents"
                    ? "Confirming creates all draft documents in this file. They do not affect the ledger or notify the customer until posted."
                    : "Confirming creates the new accounts listed above."}{" "}
                The server checks everything again; if any record fails, the
                whole batch is rolled back.
              </p>
              {ready && (
                <label className="erp-check">
                  <input
                    type="checkbox"
                    checked={confirmed}
                    disabled={busy}
                    onChange={(e) => setConfirmed(e.target.checked)}
                  />
                  I have reviewed the file and the selected branch.
                </label>
              )}
              {!ready && (
                <p className="erp-hint">
                  {preview.issues.length
                    ? "Resolve the listed issues before importing."
                    : preview.applied
                      ? "Import complete. See the audit history below."
                      : "A duplicate file cannot be imported again."}
                </p>
              )}
              <button
                type="button"
                disabled={busy || !ready || !confirmed}
                onClick={() => void run(true)}
              >
                {kind === "journals"
                  ? "Confirm and post journals"
                  : kind === "documents"
                    ? "Confirm and import drafts"
                    : "Confirm and import accounts"}
              </button>
            </div>
          </Section>
        </div>
      )}
      {kind === "documents" && (
        <Section title="Reference IDs for this branch">
          <div className="erp-pad">
            <p>
              Use these existing IDs in your CSV. A bill’s supplier must match
              its received purchase order.
            </p>
            <Loading {...customers} retry={customers.refresh} />
            <Loading {...suppliers} retry={suppliers.refresh} />
            <Loading {...purchases} retry={purchases.refresh} />
          </div>
          <PaginatedTable
            className="erp-table"
            aria-label="Import reference IDs"
          >
            <thead>
              <tr>
                <th>Record</th>
                <th>Name / reference</th>
                <th>ID</th>
                <th>Linked supplier</th>
              </tr>
            </thead>
            <tbody>
              {customers.items?.map((c) => (
                <tr key={c.id}>
                  <td>Customer</td>
                  <td>{c.name}</td>
                  <td>{c.id}</td>
                  <td>—</td>
                </tr>
              ))}
              {suppliers.items?.map((s) => (
                <tr key={s.id}>
                  <td>Supplier</td>
                  <td>{s.name}</td>
                  <td>{s.id}</td>
                  <td>—</td>
                </tr>
              ))}
              {purchases.items
                ?.filter((p) =>
                  ["received", "part_received"].includes(p.status),
                )
                .map((p) => (
                  <tr key={p.id}>
                    <td>Received purchase order</td>
                    <td>{p.reference}</td>
                    <td>{p.id}</td>
                    <td>
                      {p.supplier_name} · {p.supplier_id}
                    </td>
                  </tr>
                ))}
            </tbody>
          </PaginatedTable>
        </Section>
      )}
      <Section title="Import history">
        <Loading {...batches} retry={batches.refresh} />
        {batches.items?.length ? (
          <PaginatedTable
            className="erp-table"
            aria-label="Accounting import history"
          >
            <thead>
              <tr>
                <th>File</th>
                <th>Type</th>
                <th>Records</th>
                <th>Imported by</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {batches.items.map((b) => (
                <tr key={b.id}>
                  <td>{b.file_name}</td>
                  <td>{b.kind}</td>
                  <td>{b.record_count}</td>
                  <td>{b.actor}</td>
                  <td>
                    {new Date(b.created_at).toLocaleString("en-ZM", {
                      timeZone: "Africa/Lusaka",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </PaginatedTable>
        ) : (
          batches.items && (
            <p className="erp-empty">No accounting imports recorded yet.</p>
          )
        )}
      </Section>
    </>
  );
}
