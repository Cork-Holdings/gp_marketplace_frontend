import { useEffect, useRef, useState } from "react";
import api from "@/lib/api/crud";
import {
  useCustomerInvoices,
  type CustomerInvoice,
} from "@/hooks/useCustomerInvoices";
import { RecordListTable } from "@/components/common/RecordListTable";
import { ErrorState } from "@/components/common/ErrorState";
import { ReferencePanel } from "@/components/reference/ReferenceUI";
import { money } from "./erp";
import "./erp.css";
export default function CustomerInvoicesPage() {
  const data = useCustomerInvoices();
  const detailRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<CustomerInvoice>(),
    [error, setError] = useState<unknown>();
  const selectedInvoice =
    data.items?.find((invoice) => invoice.id === selected?.id) ?? selected;
  useEffect(() => {
    if (selected) detailRef.current?.focus();
  }, [selected]);
  const remaining = (i: CustomerInvoice) =>
    i.status === "reversed"
      ? 0
      : Math.max(
          0,
          Number(i.amount_minor) -
            Number(i.paid_minor) -
            Number(i.credited_minor),
        );
  const open = async (i: CustomerInvoice) => {
    setSelected(i);
    setError(undefined);
    try {
      await api.post(`/customers/me/invoices/${i.id}/read`);
      data.refresh();
      window.dispatchEvent(new Event("geepay:invoices-changed"));
    } catch (cause) {
      setError(cause);
    }
  };
  return (
    <div className="erp-workspace">
      <header className="erp-page-head">
        <div>
          <h1>Your invoices</h1>
          <p>
            Issued invoices from your businesses, with credits and recorded
            payments.
          </p>
        </div>
        <button onClick={data.refresh}>Refresh invoices</button>
      </header>
      <ReferencePanel title="Issued invoices">
        {data.error ? (
          <ErrorState error={data.error} onRetry={data.refresh} />
        ) : !data.items ? (
          <p className="reference-note" role="status">
            Loading invoices…
          </p>
        ) : !data.items.length ? (
          <p className="reference-note">
            No issued invoices yet. An invoice will appear here when a business
            posts one for your account.
          </p>
        ) : (
          <div className="erp-scroll">
            <RecordListTable className="erp-table" aria-label="Your invoices">
              <thead>
                <tr>
                  <th>Invoice</th>
                  <th>Business</th>
                  <th>Amount</th>
                  <th>Remaining</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((i) => (
                  <tr key={i.id}>
                    <td>
                      <strong>{i.reference}</strong>
                      {!i.read_at && <small>New invoice</small>}
                    </td>
                    <td>{i.business}</td>
                    <td>{money(Number(i.amount_minor))}</td>
                    <td>{money(remaining(i))}</td>
                    <td>
                      {i.status === "reversed"
                        ? "Reversed"
                        : remaining(i) === 0
                          ? "Paid / credited"
                          : Number(i.paid_minor) > 0
                            ? "Part paid"
                            : "Payment due"}
                    </td>
                    <td>
                      <button onClick={() => void open(i)}>View invoice</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </RecordListTable>
          </div>
        )}
      </ReferencePanel>
      {error && (
        <ErrorState
          error={error}
          onRetry={() => {
            if (selected) void open(selected);
          }}
        />
      )}
      {selectedInvoice && (
        <ReferencePanel
          title={`Invoice · ${selectedInvoice.reference}`}
          action={
            <button onClick={() => setSelected(undefined)}>
              Close invoice
            </button>
          }
        >
          <div className="erp-pad" ref={detailRef} tabIndex={-1}>
            <h2>{selectedInvoice.business}</h2>
            <p>{selectedInvoice.description}</p>
            <dl className="erp-facts">
              <div>
                <dt>Total</dt>
                <dd>{money(Number(selectedInvoice.amount_minor))}</dd>
              </div>
              <div>
                <dt>Recorded payments</dt>
                <dd>{money(Number(selectedInvoice.paid_minor))}</dd>
              </div>
              <div>
                <dt>Credit notes</dt>
                <dd>{money(Number(selectedInvoice.credited_minor))}</dd>
              </div>
              <div>
                <dt>Remaining</dt>
                <dd>{money(remaining(selectedInvoice))}</dd>
              </div>
              <div>
                <dt>Due date</dt>
                <dd>
                  {selectedInvoice.due_date?.slice(0, 10) || "Not specified"}
                </dd>
              </div>
            </dl>
            <p>
              This invoice records the amount owed to the business. Contact the
              business about its payment arrangements. A posted invoice is not a
              payment receipt.
            </p>
          </div>
        </ReferencePanel>
      )}
    </div>
  );
}
