import { PaginatedTable } from '@/components/common/PaginatedTable';
import { useState, type FormEvent } from "react";
import api from "@/lib/api/crud";
import { usePermissions } from "@/lib/context/permissions";
import { RecordListTable } from "@/components/common/RecordListTable";
import {
  ERPLayout,
  Field,
  FormPanel,
  Section,
  Status,
  Loading,
  Feedback,
  Refresh,
} from "./ERPShared";
import { useERP, useAction, useVariants } from "./useERP";
import {
  endpoint,
  money,
  minor,
  stamp,
  type Supplier,
  type Purchase,
  type Receipt,
} from "./erp";
export default function PurchasingPage() {
  const data = useERP<Purchase>("purchases");
  return (
    <ERPLayout
      title="Purchasing"
      description="Order from suppliers, receive goods in parts and trace every stock receipt."
      action={<Refresh onClick={data.refresh} />}
    >
      {data.store && (
        <Purchasing key={data.store} store={data.store} data={data} />
      )}
    </ERPLayout>
  );
}
function Purchasing({
  store,
  data,
}: {
  store: string;
  data: ReturnType<typeof useERP<Purchase>>;
}) {
  const suppliers = useERP<Supplier>("suppliers"),
    receipts = useERP<Receipt>("receipts"),
    variants = useVariants(store);
  const { hasPermission } = usePermissions();
  const manage = hasPermission("products.manage");
  const action = useAction();
  const [selected, setSelected] = useState(""),
    [search, setSearch] = useState("");
  const [supplier, setSupplier] = useState(""),
    [reference, setReference] = useState("");
  const [lines, setLines] = useState([
    { variant_id: "", quantity: "1", cost: "0.00" },
  ]);
  const [receive, setReceive] = useState<Record<string, string>>({});
  const [delivery, setDelivery] = useState("");
  const [requestId, setRequestId] = useState(crypto.randomUUID());
  const current = data.items?.find((p) => p.id === selected);
  const refresh = () => {
    data.refresh();
    receipts.refresh();
  };
  async function create(event: FormEvent) {
    event.preventDefault();
    if (
      await action.run(async () => {
        await api.post(endpoint(store, "purchases"), {
          supplier_id: supplier,
          reference,
          lines: lines.map((l) => ({
            variant_id: l.variant_id,
            quantity: Number(l.quantity),
            unit_cost_minor: minor(l.cost),
            received: 0,
          })),
        });
        setReference("");
        setLines([{ variant_id: "", quantity: "1", cost: "0.00" }]);
        refresh();
      }, "Purchase order created. Approve it before receiving goods.")
    )
      setSelected("");
  }
  async function state(status: string) {
    if (!current) return;
    await action.run(
      async () => {
        await api.patch(endpoint(store, `purchases/${current.id}`), {
          status,
          version: current.version,
        });
        refresh();
      },
      status === "approved"
        ? "Purchase order approved. Goods can now be received."
        : "Purchase order cancelled.",
    );
  }
  async function receiveGoods(event: FormEvent) {
    event.preventDefault();
    if (!current) return;
    await action.run(async () => {
      await api.post(endpoint(store, `purchases/${current.id}/receive`), {
        id: requestId,
        reference: delivery,
        lines: current.lines
          .map((l) => ({
            variant_id: l.variant_id,
            quantity: Number(receive[l.variant_id] || 0),
          }))
          .filter((l) => l.quantity > 0),
      });
      setRequestId(crypto.randomUUID());
      setReceive({});
      setDelivery("");
      refresh();
    }, "Goods received. Stock and movement history have been updated.");
  }
  const canReceive =
    current && ["approved", "part_received"].includes(current.status);
  const quantitiesValid =
    current?.lines.some((l) => Number(receive[l.variant_id] || 0) > 0) &&
    current.lines.every(
      (l) =>
        Number.isInteger(Number(receive[l.variant_id] || 0)) &&
        Number(receive[l.variant_id] || 0) >= 0 &&
        Number(receive[l.variant_id] || 0) <= l.quantity - l.received,
    );
  return (
    <>
      <Feedback {...action} />
      {manage && (
        <>
          <SupplierForm store={store} saved={suppliers.refresh} />
          <FormPanel title="Create purchase order">
            <form className="erp-form" onSubmit={create}>
              <div className="erp-form-grid">
                <Field label="Supplier">
                  <select
                    required
                    value={supplier}
                    onChange={(e) => setSupplier(e.target.value)}
                  >
                    <option value="">Choose a supplier</option>
                    {suppliers.items?.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Order reference">
                  <input
                    required
                    maxLength={100}
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Your purchase order reference"
                  />
                </Field>
              </div>
              <Loading
                items={suppliers.items}
                error={suppliers.error}
                retry={suppliers.refresh}
              />
              {variants.error && (
                <p role="alert">
                  Catalogue could not load. Refresh this page to retry.
                </p>
              )}
              {lines.map((l, i) => (
                <div className="erp-line-editor" key={i}>
                  <Field label={`Item ${i + 1}`}>
                    <select
                      required
                      value={l.variant_id}
                      onChange={(e) =>
                        setLines(
                          lines.map((x, j) =>
                            j === i ? { ...x, variant_id: e.target.value } : x,
                          ),
                        )
                      }
                    >
                      <option value="">Choose an item / variant</option>
                      {variants.items?.map((v) => (
                        <option value={v.id} key={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Quantity">
                    <input
                      required
                      type="number"
                      min="1"
                      max="1000000"
                      step="1"
                      value={l.quantity}
                      onChange={(e) =>
                        setLines(
                          lines.map((x, j) =>
                            j === i ? { ...x, quantity: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </Field>
                  <Field label="Unit cost (ZMW)">
                    <input
                      required
                      inputMode="decimal"
                      pattern="[0-9]+([.][0-9]{1,2})?"
                      value={l.cost}
                      onChange={(e) =>
                        setLines(
                          lines.map((x, j) =>
                            j === i ? { ...x, cost: e.target.value } : x,
                          ),
                        )
                      }
                    />
                  </Field>
                  <button
                    type="button"
                    className="erp-secondary"
                    aria-label={`Remove item ${i + 1}`}
                    disabled={lines.length === 1}
                    onClick={() => setLines(lines.filter((_, j) => j !== i))}
                  >
                    ×
                  </button>
                </div>
              ))}
              <div className="erp-actions">
                <button
                  type="button"
                  className="erp-secondary"
                  disabled={lines.length >= 100}
                  onClick={() =>
                    setLines([
                      ...lines,
                      { variant_id: "", quantity: "1", cost: "0.00" },
                    ])
                  }
                >
                  Add item
                </button>
                <button
                  disabled={
                    action.busy ||
                    !suppliers.items?.length ||
                    !variants.items?.length
                  }
                >
                  Create draft order
                </button>
              </div>
              <p className="erp-hint">
                Costs exclude automatic tax calculation. Receiving goods does
                not pay the supplier.
              </p>
            </form>
          </FormPanel>
        </>
      )}
      <div className="erp-split">
        <Section title="Purchase orders">
          <div className="erp-pad">
            <Field label="Find a purchase order">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Reference or supplier"
              />
            </Field>
          </div>
          <Loading {...data} retry={data.refresh} />
          {data.items && (
            <div className="erp-scroll">
              <RecordListTable
                className="erp-table"
                aria-label="Purchase orders"
              >
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Status</th>
                    <th>Value</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {data.items
                    .filter((p) =>
                      (p.reference + " " + p.supplier_name)
                        .toLowerCase()
                        .includes(search.toLowerCase()),
                    )
                    .map((p) => (
                      <tr key={p.id}>
                        <td>
                          <strong>{p.reference}</strong>
                          <small>{p.supplier_name}</small>
                        </td>
                        <td>
                          <Status value={p.status} />
                        </td>
                        <td className="erp-number">
                          {money(
                            p.lines.reduce(
                              (n, l) => n + l.quantity * l.unit_cost_minor,
                              0,
                            ),
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="erp-secondary"
                            onClick={() => {
                              setSelected(p.id);
                              setReceive({});
                              setDelivery("");
                              setRequestId(crypto.randomUUID());
                            }}
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </RecordListTable>
            </div>
          )}
        </Section>
        <Section title={current ? current.reference : "Order detail"}>
          {!current ? (
            <p className="erp-empty">
              Choose an order to review its items and receive goods.
            </p>
          ) : (
            <>
              <ol className="erp-steps" aria-label="Purchase progress">
                {["Draft", "Approved", "Part received", "Received"].map(
                  (title, i) => (
                    <li
                      key={title}
                      className={
                        [
                          "draft",
                          "approved",
                          "part_received",
                          "received",
                        ].indexOf(current.status) >= i
                          ? "is-done"
                          : ""
                      }
                    >
                      <span>{i + 1}</span>
                      {title}
                    </li>
                  ),
                )}
              </ol>
              <div className="erp-pad">
                <dl className="erp-facts">
                  <div>
                    <dt>Supplier</dt>
                    <dd>{current.supplier_name}</dd>
                  </div>
                  <div>
                    <dt>Status</dt>
                    <dd>
                      <Status value={current.status} />
                    </dd>
                  </div>
                  <div>
                    <dt>Created</dt>
                    <dd>{stamp(current.created_at)}</dd>
                  </div>
                  <div>
                    <dt>Order value</dt>
                    <dd>
                      {money(
                        current.lines.reduce(
                          (n, l) => n + l.quantity * l.unit_cost_minor,
                          0,
                        ),
                      )}
                    </dd>
                  </div>
                </dl>
              </div>
              <div className="erp-scroll">
                <PaginatedTable className="erp-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Ordered</th>
                      <th>Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {current.lines.map((l) => (
                      <tr key={l.variant_id}>
                        <td>{l.name}</td>
                        <td>{l.quantity}</td>
                        <td>{l.received}</td>
                      </tr>
                    ))}
                  </tbody>
                </PaginatedTable>
              </div>
              {manage && (
                <div className="erp-pad">
                  <div className="erp-actions">
                    {current.status === "draft" && (
                      <button
                        disabled={action.busy}
                        onClick={() => void state("approved")}
                      >
                        Approve order
                      </button>
                    )}
                    {["draft", "approved"].includes(current.status) && (
                      <button
                        className="erp-secondary"
                        disabled={action.busy}
                        onClick={() => void state("cancelled")}
                      >
                        Cancel order
                      </button>
                    )}
                  </div>
                  {current.status === "draft" && (
                    <p className="erp-hint">
                      Approve this order before recording a delivery.
                    </p>
                  )}
                  {canReceive && (
                    <form className="erp-form" onSubmit={receiveGoods}>
                      <h3>Receive a delivery</h3>
                      <Field label="Delivery reference">
                        <input
                          required
                          maxLength={100}
                          value={delivery}
                          onChange={(e) => setDelivery(e.target.value)}
                          placeholder="Supplier delivery note"
                        />
                      </Field>
                      {current.lines
                        .filter((l) => l.received < l.quantity)
                        .map((l) => (
                          <Field
                            key={l.variant_id}
                            label={l.name}
                            hint={`${l.quantity - l.received} outstanding`}
                          >
                            <input
                              type="number"
                              min="0"
                              max={l.quantity - l.received}
                              step="1"
                              value={receive[l.variant_id] || ""}
                              onChange={(e) =>
                                setReceive({
                                  ...receive,
                                  [l.variant_id]: e.target.value,
                                })
                              }
                              placeholder="Quantity received now"
                            />
                          </Field>
                        ))}
                      <button
                        disabled={
                          action.busy || !quantitiesValid || !delivery.trim()
                        }
                      >
                        Receive goods
                      </button>
                      <p className="erp-hint">
                        Only enter goods physically received. Stock increases
                        immediately.
                      </p>
                    </form>
                  )}
                </div>
              )}
            </>
          )}
        </Section>
      </div>
      <Section title="Goods receipts">
        <Loading {...receipts} retry={receipts.refresh} />
        {receipts.items && (
          <div className="erp-scroll">
            <PaginatedTable className="erp-table">
              <thead>
                <tr>
                  <th>Delivery</th>
                  <th>Purchase order</th>
                  <th>Received</th>
                </tr>
              </thead>
              <tbody>
                {receipts.items.map((r) => (
                  <tr key={r.id}>
                    <td>{r.reference}</td>
                    <td>{r.purchase_reference}</td>
                    <td>{stamp(r.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </PaginatedTable>
          </div>
        )}
      </Section>
      <Section title="Supplier directory">
        <Loading {...suppliers} retry={suppliers.refresh} />
        <div className="erp-scroll">
          <PaginatedTable className="erp-table">
            <thead>
              <tr>
                <th>Supplier</th>
                <th>Contact</th>
                <th>Address</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.items?.map((s) => (
                <tr key={s.id}>
                  <td>{s.name}</td>
                  <td>
                    {s.phone || "No phone recorded"}
                    <small>{s.email || "No email recorded"}</small>
                  </td>
                  <td>{s.address || "Not recorded"}</td>
                </tr>
              ))}
            </tbody>
          </PaginatedTable>
        </div>
      </Section>
      <p className="erp-hint">
        Showing up to 500 recent records per section. Stock movements keep the
        permanent receipt trail.
      </p>
    </>
  );
}
function SupplierForm({ store, saved }: { store: string; saved: () => void }) {
  const action = useAction();
  const [name, setName] = useState(""),
    [phone, setPhone] = useState(""),
    [email, setEmail] = useState(""),
    [address, setAddress] = useState("");
  return (
    <FormPanel title="Add supplier">
      <form
        className="erp-form"
        onSubmit={(e) => {
          e.preventDefault();
          void action.run(async () => {
            await api.post(endpoint(store, "suppliers"), {
              name,
              phone,
              email,
              address,
            });
            setName("");
            setPhone("");
            setEmail("");
            setAddress("");
            saved();
          }, "Supplier added.");
        }}
      >
        <Feedback {...action} />
        <div className="erp-form-grid">
          <Field label="Supplier name">
            <input
              required
              value={name}
              maxLength={150}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>
          <Field label="Phone (optional)">
            <input
              type="tel"
              value={phone}
              maxLength={50}
              onChange={(e) => setPhone(e.target.value)}
            />
          </Field>
          <Field label="Email (optional)">
            <input
              type="email"
              value={email}
              maxLength={200}
              onChange={(e) => setEmail(e.target.value)}
            />
          </Field>
          <Field label="Address (optional)">
            <input
              value={address}
              maxLength={500}
              onChange={(e) => setAddress(e.target.value)}
            />
          </Field>
        </div>
        <button disabled={action.busy}>Save supplier</button>
      </form>
    </FormPanel>
  );
}
