import { PaginatedTable } from "@/components/common/PaginatedTable";
import { accountingSummary } from "@/lib/accountingSummary";
import { useState } from "react";
import { Link } from "react-router-dom";
import { ERPLayout, Section, Loading, Field, Refresh } from "./ERPShared";
import { useERP } from "./useERP";
import { money, day, type Trial, type Account } from "./erp";
import { useMarketplace } from "@/lib/context/useMarketplace";
import { usePermissions } from "@/lib/context/permissions";
import { useOwnerDashboard } from "@/hooks/useOwnerDashboard";
import { recordedCurrency } from "@/lib/recordedData";
import { ErrorState } from "@/components/common/ErrorState";
export default function ReportsPage() {
  const { selectedStore } = useMarketplace();
  const { hasPermission } = usePermissions();
  const canReadCollections = hasPermission("transactions.view");
  const collections = useOwnerDashboard(
    canReadCollections ? selectedStore?.id : undefined,
    "all",
    0,
  );
  const [from, setFrom] = useState(day().slice(0, 4) + "-01-01"),
    [to, setTo] = useState(day());
  const trial = useERP<Trial>(`trial-balance?from=${from}&to=${to}`),
    accounts = useERP<Account>("accounts");
  const balance = useERP<Trial>(`trial-balance?from=1900-01-01&to=${to}`);
  const result = (code: string, rows = trial.items) =>
    rows
      ?.filter((t) => t.account === code)
      .reduce(
        (n, t) => n + Number(t.debit_minor) - Number(t.credit_minor),
        0,
      ) ?? 0;
  const periodSummary = accountingSummary(trial.items, accounts.items);
  const allSummary = accountingSummary(balance.items, accounts.items);
  const { income, expenses: cost, profit } = periodSummary;
  const {
    assets,
    liabilities: liability,
    equity,
    profit: retained,
  } = allSummary;
  return (
    <ERPLayout
      title="Financial reports"
      description="Reports from posted manual journals only. Marketplace collections are not automatically recognised as revenue."
      action={
        <Refresh
          onClick={() => {
            trial.refresh();
            balance.refresh();
            collections.refresh();
          }}
        />
      }
    >
      {canReadCollections && (
        <Section title="Recorded collections · all time">
          <div className="erp-pad">
            <p>
              Payment activity for this branch, separate from posted accounting
              revenue and profit.
            </p>
            {collections.error ? (
              <ErrorState
                error={collections.error}
                onRetry={collections.refresh}
              />
            ) : !collections.data ? (
              <p role="status">Loading recorded collections…</p>
            ) : collections.data.money.length ? (
              <div className="erp-kpis">
                {collections.data.money.map((row) => (
                  <div key={row.currency}>
                    <span>Confirmed collections · {row.currency}</span>
                    <strong>
                      {recordedCurrency(row.collected, row.currency)}
                    </strong>
                    <small>Net of refunds · not a payout balance</small>
                    {Number(row.simulated_collected) > 0 && (
                      <p>
                        Test collections ·{" "}
                        {recordedCurrency(
                          row.simulated_collected,
                          row.currency,
                        )}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p>No recorded collections for this branch.</p>
            )}
            <Link to="/portal/owner/transactions">Open payment history →</Link>
          </div>
        </Section>
      )}
      <Section title="Accounting report period">
        <div className="erp-form-grid erp-pad">
          <Field label="From">
            <input
              required
              type="date"
              max={to}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </Field>
          <Field label="To">
            <input
              required
              type="date"
              min={from}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </Field>
        </div>
      </Section>
      {trial.items?.length === 0 ? (
        <Section title="No posted accounting entries in this period">
          <div className="erp-pad">
            <p>
              {balance.items?.length
                ? "This branch has earlier accounting entries, but none in the selected period. Widen the dates to include them."
                : "This branch has no posted accounting entries through the selected date. Recorded customer payments appear in collections above. Accounting reports start when invoices, bills, expenses or verified opening balances are posted."}
            </p>
            <p>
              Draft documents do not affect the ledger. Automatic marketplace
              posting is still planned.
            </p>
            <Link to="/portal/owner/accounting">
              Open Accounting to review or post documents →
            </Link>
          </div>
        </Section>
      ) : (
        <Loading {...trial} retry={trial.refresh} />
      )}
      {trial.items && accounts.items && trial.items.length > 0 && (
        <>
          <div className="erp-kpis">
            <div>
              <span>Posted income · period</span>
              <strong>{money(income)}</strong>
            </div>
            <div>
              <span>Posted costs · period</span>
              <strong>{money(cost)}</strong>
            </div>
            <div>
              <span>Manual book result · period</span>
              <strong>{money(profit)}</strong>
            </div>
          </div>
          <Section title="Income & costs">
            <div className="erp-bars">
              {[
                ["Sales income", income],
                ["Cost of sales", result("5000")],
                ["Other expenses", cost - result("5000")],
              ].map(([label, value]) => (
                <div className="erp-bar" key={String(label)}>
                  <span>{label}</span>
                  <meter
                    min={0}
                    max={Math.max(1, Math.abs(income), Math.abs(cost))}
                    value={Math.abs(Number(value))}
                    aria-label={String(label)}
                  />
                  <strong>{money(Number(value))}</strong>
                </div>
              ))}
            </div>
          </Section>
          <Section title="Trial balance">
            <div className="erp-scroll">
              <PaginatedTable className="erp-table">
                <caption>
                  Selected period · ZMW · Exact values shown below
                </caption>
                <thead>
                  <tr>
                    <th>Account</th>
                    <th>Debit</th>
                    <th>Credit</th>
                    <th>Net debit / (credit)</th>
                  </tr>
                </thead>
                <tbody>
                  {trial.items.map((t) => (
                    <tr key={t.account}>
                      <td>
                        {t.account} ·{" "}
                        {
                          accounts.items?.find((a) => a.code === t.account)
                            ?.name
                        }
                      </td>
                      <td className="erp-number">
                        {money(Number(t.debit_minor))}
                      </td>
                      <td className="erp-number">
                        {money(Number(t.credit_minor))}
                      </td>
                      <td className="erp-number">
                        {money(Number(t.debit_minor) - Number(t.credit_minor))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <th>Total</th>
                    <td className="erp-number">
                      {money(
                        trial.items.reduce(
                          (n, t) => n + Number(t.debit_minor),
                          0,
                        ),
                      )}
                    </td>
                    <td className="erp-number">
                      {money(
                        trial.items.reduce(
                          (n, t) => n + Number(t.credit_minor),
                          0,
                        ),
                      )}
                    </td>
                    <td>
                      <Link to="/portal/owner/accounting">
                        View source journals →
                      </Link>
                    </td>
                  </tr>
                </tfoot>
              </PaginatedTable>
            </div>
          </Section>
        </>
      )}
      <Loading {...accounts} retry={accounts.refresh} />
      <Section title={`Balance sheet · as of ${to}`}>
        {balance.items?.length === 0 ? (
          <p className="erp-empty">
            A balance sheet will appear when accounting entries have been
            posted.
          </p>
        ) : (
          <Loading {...balance} retry={balance.refresh} />
        )}
        {balance.items && accounts.items && balance.items.length > 0 && (
          <div className="erp-pad">
            <dl className="erp-facts">
              <div>
                <dt>Assets</dt>
                <dd>{money(assets)}</dd>
              </div>
              <div>
                <dt>Liabilities</dt>
                <dd>{money(liability)}</dd>
              </div>
              <div>
                <dt>Opening equity</dt>
                <dd>{money(equity)}</dd>
              </div>
              <div>
                <dt>Accumulated manual book result</dt>
                <dd>{money(retained)}</dd>
              </div>
            </dl>
            <p className="erp-hint">
              Balance check: assets − liabilities − equity − accumulated result
              = {money(assets - liability - equity - retained)}.
            </p>
          </div>
        )}
      </Section>
      <p className="erp-hint">
        Enter opening balances from verified business records. Inventory
        valuation is manually posted. Reports cover posted manual books.
        Statement matching is available in Reconciliation; automatic gateway
        posting and tax calculations remain outside this workflow.
      </p>
    </ERPLayout>
  );
}
