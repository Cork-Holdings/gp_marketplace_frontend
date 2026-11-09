import { PaginatedTable } from "@/components/common/PaginatedTable";
import { Link } from "react-router-dom";
import { JournalComposer } from "./JournalComposer";
import { useState } from "react";
import api from "@/lib/api/crud";
import { RecordListTable } from "@/components/common/RecordListTable";
import {
  ERPLayout,
  Section,
  Loading,
  Field,
  FormPanel,
  Status,
  Feedback,
  Refresh,
} from "./ERPShared";
import { useERP, useAction } from "./useERP";
import { PaymentAllocations } from "./PaymentAllocations";
import {
  endpoint,
  money,
  minor,
  day,
  human,
  type Account,
  type Contact,
  type Supplier,
  type Purchase,
  type Document,
  type Journal,
} from "./erp";
export default function AccountingPage() {
  const documents = useERP<Document>("documents");
  return (
    <ERPLayout
      title="Accounting"
      description="Manual ZMW books for this branch. Documents, balanced postings and payments are distinct records."
      action={<Refresh onClick={documents.refresh} />}
    >
      {documents.store && (
        <Books
          key={documents.store}
          store={documents.store}
          documents={documents}
        />
      )}
    </ERPLayout>
  );
}
function Books({
  store,
  documents,
}: {
  store: string;
  documents: ReturnType<typeof useERP<Document>>;
}) {
  const journals = useERP<Journal>("journals"),
    accounts = useERP<Account>("accounts"),
    suppliers = useERP<Supplier>("finance-suppliers"),
    customers = useERP<Contact>("finance-customers"),
    purchases = useERP<Purchase>("finance-purchases"),
    periods = useERP<{ through_date: string }>("period-history");
  const action = useAction();
  const [revision, setRevision] = useState(0);
  const [kind, setKind] = useState("invoice"),
    [reference, setReference] = useState(""),
    [description, setDescription] = useState(""),
    [amount, setAmount] = useState(""),
    [due, setDue] = useState(day()),
    [party, setParty] = useState(""),
    [source, setSource] = useState(""),
    [docId, setDocId] = useState(crypto.randomUUID());
  const [postingDate, setPostingDate] = useState(day());
  const [reverse, setReverse] = useState(""),
    [reason, setReason] = useState("");
  const closedThrough = periods.items?.[0]?.through_date.slice(0, 10);
  const dateOpen =
    !!postingDate &&
    !!periods.items &&
    (!closedThrough || postingDate > closedThrough);
  const refresh = () => {
    documents.refresh();
    journals.refresh();
    setRevision((n) => n + 1);
  };
  const customerKind = kind === "invoice" || kind === "credit_note";
  const supplierKind = kind === "bill";
  const sources = supplierKind
    ? purchases.items
        ?.filter(
          (p) =>
            ["part_received", "received"].includes(p.status) &&
            p.supplier_id === party,
        )
        .map((p) => ({ id: p.id, label: p.reference }))
    : documents.items
        ?.filter(
          (d) =>
            d.kind === "invoice" &&
            d.status === "posted" &&
            d.customer_id === party,
        )
        .map((d) => ({ id: d.id, label: d.reference }));
  const formValid =
    reference.trim() &&
    description.trim() &&
    amount !== "" &&
    Number(amount) > 0 &&
    due &&
    ((!customerKind && !supplierKind) || party) &&
    (!["bill", "credit_note"].includes(kind) || source);
  return (
    <>
      <div className="accounting-tool-links">
        <Link to="/portal/owner/accounting/accounts">Chart of accounts →</Link>
        <Link to="/portal/owner/accounting/imports">
          Import accounts, journals & documents →
        </Link>
        <Link to="/portal/owner/reports">Financial reports →</Link>
      </div>
      <p className="erp-hint">
        Manual posting only. These books do not automatically import marketplace
        sales, calculate tax, transfer money or prove a gateway payment.
      </p>
      <Feedback {...action} />
      <FormPanel title="Create invoice, supplier bill or expense">
        <form
          className="erp-form"
          onSubmit={(e) => {
            e.preventDefault();
            void action.run(async () => {
              await api.post(endpoint(store, "documents"), {
                id: docId,
                kind,
                reference,
                description,
                amount_minor: minor(amount),
                customer_id: customerKind ? party : null,
                supplier_id: supplierKind ? party : null,
                source_id: ["bill", "credit_note"].includes(kind)
                  ? source
                  : null,
                due_date: due,
              });
              setDocId(crypto.randomUUID());
              setReference("");
              setDescription("");
              setAmount("");
              refresh();
            }, "Draft document saved. Review it before posting.");
          }}
        >
          <div className="erp-form-grid">
            <Field label="Document type">
              <select
                value={kind}
                onChange={(e) => {
                  setKind(e.target.value);
                  setParty("");
                  setSource("");
                }}
              >
                <option value="invoice">Customer invoice</option>
                <option value="bill">Supplier bill</option>
                <option value="expense">Paid expense (external payment)</option>
                <option value="credit_note">Credit note</option>
              </select>
            </Field>
            <Field label="Reference">
              <input
                required
                maxLength={100}
                value={reference}
                onChange={(e) => setReference(e.target.value)}
              />
            </Field>
            {(customerKind || supplierKind) && (
              <Field label={supplierKind ? "Supplier" : "Customer"}>
                <select
                  required
                  value={party}
                  onChange={(e) => {
                    setParty(e.target.value);
                    setSource("");
                  }}
                >
                  <option value="">
                    Choose {supplierKind ? "supplier" : "customer"}
                  </option>
                  {(supplierKind ? suppliers.items : customers.items)?.map(
                    (p) => (
                      <option value={p.id} key={p.id}>
                        {p.name}
                      </option>
                    ),
                  )}
                </select>
              </Field>
            )}
            {["bill", "credit_note"].includes(kind) && (
              <Field
                label={
                  supplierKind
                    ? "Received purchase order"
                    : "Original posted invoice"
                }
              >
                <select
                  required
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                >
                  <option value="">Choose original record</option>
                  {sources?.map((s) => (
                    <option value={s.id} key={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Amount (ZMW)">
              <input
                required
                inputMode="decimal"
                pattern="[0-9]+([.][0-9]{1,2})?"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Field>
            <Field label="Due date">
              <input
                required
                type="date"
                value={due}
                onChange={(e) => setDue(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Description / evidence reference">
            <textarea
              required
              maxLength={1000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <p className="erp-hint">
            Invoices: receivables / sales. Bills: inventory / payables. Paid
            expenses: expenses / cash. Credit notes: sales / receivables. No
            automatic tax. Enter evidence for externally paid expenses.
          </p>
          <button disabled={action.busy || !formValid}>
            Save draft document
          </button>
        </form>
      </FormPanel>
      <Section title="Business documents">
        <Loading {...documents} retry={documents.refresh} />
        <div className="erp-pad">
          <Field
            label="Posting date for document actions"
            hint={
              closedThrough
                ? `Posting dates through ${closedThrough} are closed. Choose a later posting date.`
                : undefined
            }
          >
            <input
              type="date"
              value={postingDate}
              onChange={(e) => setPostingDate(e.target.value)}
              required
            />
          </Field>
        </div>
        <div className="erp-scroll">
          <RecordListTable
            className="erp-table"
            aria-label="Business documents"
          >
            <thead>
              <tr>
                <th>Document</th>
                <th>Party / description</th>
                <th>Due</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {documents.items?.map((d) => (
                <tr key={d.id}>
                  <td>
                    <strong>{d.reference}</strong>
                    <small>{human(d.kind)}</small>
                  </td>
                  <td>
                    {d.customer_name || d.supplier_name || "Business expense"}
                    <small>{d.description}</small>
                  </td>
                  <td>{d.due_date.slice(0, 10)}</td>
                  <td className="erp-number">{money(d.amount_minor)}</td>
                  <td>
                    <Status value={d.status} />
                  </td>
                  <td>
                    {d.status === "draft" ? (
                      <button
                        disabled={action.busy || !dateOpen}
                        onClick={() =>
                          void action.run(async () => {
                            await api.post(
                              endpoint(store, `documents/${d.id}/post`),
                              { posting_date: postingDate },
                            );
                            refresh();
                          }, "Document posted to the ledger.")
                        }
                      >
                        Post document
                      </button>
                    ) : (
                      <span className="erp-hint">See journal below</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </RecordListTable>
        </div>
      </Section>
      {!dateOpen && (
        <p className="erp-hint">
          Choose a posting date in an open accounting period before posting or
          reversing entries.
        </p>
      )}
      {(!periods.items || periods.error) && (
        <Loading
          error={periods.error}
          items={periods.items}
          retry={periods.refresh}
        />
      )}
      <PaymentAllocations
        store={store}
        saved={refresh}
        revision={revision}
        closedThrough={closedThrough}
      />
      <JournalComposer
        store={store}
        accounts={accounts.items ?? []}
        postingDate={postingDate}
        dateOpen={dateOpen}
        saved={refresh}
      />
      <Section title="Posted journal history">
        <Loading {...journals} retry={journals.refresh} />
        <div className="erp-scroll">
          <PaginatedTable className="erp-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Posting date</th>
                <th>Entries</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {journals.items?.map((j) => (
                <tr key={j.id}>
                  <td>
                    <strong>{j.reference}</strong>
                    <small>{j.description}</small>
                    <small>{j.actor}</small>
                  </td>
                  <td>{j.posting_date.slice(0, 10)}</td>
                  <td>
                    {j.lines.map((l, i) => (
                      <div key={i}>
                        {l.account} · {l.debit_minor ? "Dr" : "Cr"}{" "}
                        {money(l.debit_minor || l.credit_minor)}
                      </div>
                    ))}
                  </td>
                  <td>
                    {j.reversal_of ? (
                      <Status value="reversed" />
                    ) : journals.items?.some((r) => r.reversal_of === j.id) ? (
                      <span>Reversal recorded</span>
                    ) : j.blocked_reason ? (
                      <div>
                        <p className="erp-hint">{j.blocked_reason}</p>
                        <button type="button" disabled>
                          Reverse
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className="erp-secondary"
                        onClick={() => {
                          setReverse(j.id);
                          setReason("");
                        }}
                      >
                        Reverse
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </PaginatedTable>
        </div>
        {reverse && (
          <form
            className="erp-form"
            onSubmit={(e) => {
              e.preventDefault();
              void action.run(async () => {
                await api.post(endpoint(store, `journals/${reverse}/reverse`), {
                  posting_date: postingDate,
                  reason,
                });
                setReverse("");
                refresh();
              }, "Reversal posted. Original history is preserved.");
            }}
          >
            <h3>
              Reverse {journals.items?.find((j) => j.id === reverse)?.reference}
            </h3>
            <Field label="Reason for reversal">
              <input
                required
                maxLength={500}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </Field>
            <div className="erp-actions">
              <button disabled={action.busy || !reason.trim() || !dateOpen}>
                Confirm reversal
              </button>
              <button
                type="button"
                className="erp-secondary"
                onClick={() => setReverse("")}
              >
                Keep original
              </button>
            </div>
          </form>
        )}
      </Section>
      <p className="erp-hint">
        Up to 500 recent documents and journals. Reports aggregate all posted
        entries in the selected period.
      </p>
    </>
  );
}
