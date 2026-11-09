import { PaginatedTable } from '@/components/common/PaginatedTable';
import { useEffect, useState } from "react";
import api from "@/lib/api/crud";
import { Section, Field, Loading, Feedback } from "./ERPShared";
import { useERP, useAction } from "./useERP";
import {
  endpoint,
  money,
  minor,
  day,
  type Balance,
  type PaymentRecord,
} from "./erp";
export function PaymentAllocations({
  store,
  saved,
  revision,
  closedThrough,
}: {
  store: string;
  saved: () => void;
  revision: number;
  closedThrough?: string;
}) {
  const balances = useERP<Balance>("balances"),
    payments = useERP<PaymentRecord>("payment-records"),
    action = useAction();
  const refreshBalances = balances.refresh,
    refreshPayments = payments.refresh;
  useEffect(() => {
    refreshBalances();
    refreshPayments();
  }, [revision, refreshBalances, refreshPayments]);
  const [selected, setSelected] = useState(""),
    [amount, setAmount] = useState(""),
    [reference, setReference] = useState(""),
    [date, setDate] = useState(day()),
    [request, setRequest] = useState(crypto.randomUUID());
  const row = balances.items?.find((b) => b.id === selected);
  const outstanding = row
    ? Number(row.amount_minor) -
      Number(row.paid_minor) -
      Number(row.credited_minor)
    : 0;
  return (
    <>
      <Section title="Customer & supplier balances">
        <Feedback {...action} />
        <Loading {...balances} retry={balances.refresh} />
        <div className="erp-scroll">
          <PaginatedTable className="erp-table">
            <thead>
              <tr>
                <th>Document / party</th>
                <th>Due date</th>
                <th>Remaining</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {balances.items?.map((b) => (
                <tr key={b.id}>
                  <td>
                    <strong>{b.reference}</strong>
                    <small>
                      {b.customer_name || b.supplier_name} ·{" "}
                      {b.kind === "bill" ? "Payable" : "Receivable"}
                    </small>
                  </td>
                  <td>{b.due_date.slice(0, 10)}</td>
                  <td className="erp-number">
                    {money(
                      Number(b.amount_minor) -
                        Number(b.paid_minor) -
                        Number(b.credited_minor),
                    )}
                  </td>
                  <td>
                    <button
                      className="erp-secondary"
                      disabled={
                        Number(b.amount_minor) -
                          Number(b.paid_minor) -
                          Number(b.credited_minor) <=
                        0
                      }
                      onClick={() => {
                        setSelected(b.id);
                        setAmount("");
                        setReference("");
                        setRequest(crypto.randomUUID());
                      }}
                    >
                      Record external payment
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
              void action.run(async () => {
                await api.post(endpoint(store, `documents/${row.id}/payment`), {
                  id: request,
                  amount_minor: minor(amount),
                  reference,
                  paid_on: date,
                });
                setRequest(crypto.randomUUID());
                setSelected("");
                balances.refresh();
                payments.refresh();
                saved();
              }, "External payment evidence recorded and allocated.");
            }}
          >
            <h3>Record payment · {row.reference}</h3>
            <p className="erp-hint">
              Record money already paid outside this workflow, with its evidence
              reference. This action posts an accounting entry and does not send
              or collect money. Remaining: {money(outstanding)}.
            </p>
            <div className="erp-form-grid">
              <Field label="Recorded payment amount (ZMW)">
                <input
                  required
                  inputMode="decimal"
                  pattern="[0-9]+([.][0-9]{1,2})?"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </Field>
              <Field label="External payment reference">
                <input
                  required
                  maxLength={150}
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  placeholder="Bank / cash receipt reference"
                />
              </Field>
              <Field label="Date paid">
                <input
                  required
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </Field>
            </div>
            <div className="erp-actions">
              <button
                disabled={
                  action.busy ||
                  (!!closedThrough && date <= closedThrough) ||
                  !reference.trim() ||
                  !(Number(amount) > 0) ||
                  Number(amount) * 100 > outstanding
                }
              >
                Record payment evidence
              </button>
              {closedThrough && date <= closedThrough && (
                <p className="erp-hint">
                  That date is in a closed accounting period. Choose a payment
                  date in an open period.
                </p>
              )}
              <button
                className="erp-secondary"
                type="button"
                onClick={() => setSelected("")}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </Section>
      <Section title="External payment evidence">
        <Loading {...payments} retry={payments.refresh} />
        <div className="erp-scroll">
          <PaginatedTable className="erp-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Evidence reference</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.items?.map((p) => (
                <tr key={p.id}>
                  <td>{p.document_reference}</td>
                  <td>{p.reference}</td>
                  <td>{p.paid_on.slice(0, 10)}</td>
                  <td className="erp-number">{money(p.amount_minor)}</td>
                  <td>{p.reversed ? "Reversed" : "Recorded externally"}</td>
                </tr>
              ))}
            </tbody>
          </PaginatedTable>
        </div>
        <p className="erp-hint erp-pad">
          Correct a payment by reversing its PAY journal below. Original payment
          evidence is retained.
        </p>
      </Section>
    </>
  );
}
