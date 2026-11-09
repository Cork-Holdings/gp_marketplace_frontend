import { PaginatedTable } from '@/components/common/PaginatedTable';
import { useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api/crud";
import { usePermissions } from "@/lib/context/permissions";
import { RecordListTable } from "@/components/common/RecordListTable";
import {
  ERPLayout,
  Section,
  Loading,
  Field,
  FormPanel,
  Feedback,
  Refresh,
} from "./ERPShared";
import { endpoint, stamp, type Movement } from "./erp";
import { useERP, useAction, useVariants } from "./useERP";
export default function StockPage() {
  const data = useERP<Movement>("stock");
  return (
    <ERPLayout
      title="Stock control"
      description="Receive, count and adjust stock with a permanent reason and movement history."
      action={<Refresh onClick={data.refresh} />}
    >
      {data.store && <Stock key={data.store} store={data.store} data={data} />}
    </ERPLayout>
  );
}
function Stock({
  store,
  data,
}: {
  store: string;
  data: ReturnType<typeof useERP<Movement>>;
}) {
  const variants = useVariants(store),
    action = useAction();
  const { hasPermission } = usePermissions();
  const [variant, setVariant] = useState(""),
    [amount, setAmount] = useState(""),
    [reason, setReason] = useState(""),
    [mode, setMode] = useState("adjust"),
    [request, setRequest] = useState(crypto.randomUUID()),
    [search, setSearch] = useState("");
  const selected = variants.items?.find((v) => v.id === variant),
    change =
      mode === "count"
        ? Number(amount) - (selected?.stock ?? 0)
        : Number(amount);
  const valid =
    selected &&
    amount !== "" &&
    Number.isInteger(Number(amount)) &&
    change !== 0 &&
    selected.stock + change >= 0 &&
    reason.trim();
  return (
    <>
      <Feedback {...action} />
      <p className="erp-hint">
        Available units below match checkout balances. Checkout commitments
        already reduce this balance; exclude committed units when recording a
        count.{" "}
        <Link to="/portal/owner/purchasing">
          Receive supplier goods in Purchasing →
        </Link>
      </p>
      {hasPermission("products.manage") && (
        <FormPanel title="Adjust stock or record a stocktake">
          <form
            className="erp-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!selected) return;
              void action.run(async () => {
                await api.post(endpoint(store, "stock"), {
                  id: request,
                  variant_id: variant,
                  quantity: change,
                  reason,
                  expected: selected.stock,
                });
                setRequest(crypto.randomUUID());
                setAmount("");
                setReason("");
                data.refresh();
                variants.refresh();
              }, "Stock updated. A permanent movement has been recorded.");
            }}
          >
            <div className="erp-form-grid">
              <Field label="Item / variant">
                <select
                  required
                  value={variant}
                  onChange={(e) => setVariant(e.target.value)}
                >
                  <option value="">Choose an item</option>
                  {variants.items?.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} · {v.stock} available
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Action">
                <select
                  value={mode}
                  onChange={(e) => {
                    setMode(e.target.value);
                    setAmount("");
                  }}
                >
                  <option value="adjust">Adjustment (+ / − units)</option>
                  <option value="count">Count available units</option>
                </select>
              </Field>
              <Field
                label={
                  mode === "count"
                    ? "Counted available quantity"
                    : "Quantity change"
                }
                hint={
                  selected
                    ? `Current: ${selected.stock} · Result: ${selected.stock + change}`
                    : undefined
                }
              >
                <input
                  required
                  type="number"
                  step="1"
                  min={mode === "count" ? 0 : undefined}
                  max="1000000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </Field>
              <Field label="Reason">
                <input
                  required
                  maxLength={300}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Damage, correction, physical count…"
                />
              </Field>
            </div>
            {!valid && (
              <p className="erp-hint">
                Choose an item, enter a valid quantity change and explain the
                reason. Stock cannot become negative.
              </p>
            )}
            <button disabled={action.busy || !valid}>
              Record stock movement
            </button>
          </form>
        </FormPanel>
      )}
      <Section title="Available stock">
        <Loading
          items={variants.items}
          error={variants.error}
          retry={variants.refresh}
        />
        <div className="erp-scroll">
          <PaginatedTable className="erp-table">
            <thead>
              <tr>
                <th>Item / variant</th>
                <th>Available</th>
              </tr>
            </thead>
            <tbody>
              {variants.items?.map((v) => (
                <tr key={v.id}>
                  <td>{v.name}</td>
                  <td className="erp-number">{v.stock}</td>
                </tr>
              ))}
            </tbody>
          </PaginatedTable>
        </div>
      </Section>
      <Section title="Movement history">
        <div className="erp-pad">
          <Field label="Find a movement">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Item, SKU or reason"
            />
          </Field>
        </div>
        <Loading {...data} retry={data.refresh} />
        <div className="erp-scroll">
          <RecordListTable className="erp-table" aria-label="Stock movements">
            <caption>
              Latest 500 movements. Opening quantities are snapshots, not new
              purchases. Item and variant ledgers are separate.
            </caption>
            <thead>
              <tr>
                <th>Item</th>
                <th>Change</th>
                <th>Balance</th>
                <th>Reason</th>
                <th>Recorded</th>
              </tr>
            </thead>
            <tbody>
              {data.items
                ?.filter(
                  (m) =>
                    m.variant_id &&
                    (m.name + " " + m.sku + " " + m.reason)
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                )
                .map((m) => (
                  <tr key={m.id}>
                    <td>
                      {m.name}
                      <small>{m.sku}</small>
                    </td>
                    <td className="erp-number">
                      {m.quantity > 0 ? "+" : ""}
                      {m.quantity}
                    </td>
                    <td className="erp-number">{m.balance}</td>
                    <td>
                      {m.reason}
                      {m.source_id && (
                        <small>Source: {m.source_id.slice(0, 8)}</small>
                      )}
                    </td>
                    <td>
                      {stamp(m.created_at)}
                      <small>{m.actor || "Opening / system record"}</small>
                    </td>
                  </tr>
                ))}
            </tbody>
          </RecordListTable>
        </div>
      </Section>
    </>
  );
}
