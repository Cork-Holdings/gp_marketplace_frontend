import { useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api/crud";
import { RecordListTable } from "@/components/common/RecordListTable";
import {
  ERPLayout,
  Section,
  Loading,
  Field,
  Feedback,
  Refresh,
} from "./ERPShared";
import { useERP, useAction } from "./useERP";
import { endpoint, stamp, type Contact, type Note, type History } from "./erp";
export default function CustomersPage() {
  const data = useERP<Contact>("customers");
  const [selected, setSelected] = useState(""),
    [search, setSearch] = useState("");
  return (
    <ERPLayout
      title="Customers"
      description="Existing customer identities, business history and follow-ups in one place."
      action={<Refresh onClick={data.refresh} />}
    >
      <div className="erp-split">
        <Section title="Customer directory">
          <div className="erp-pad">
            <Field label="Find a customer">
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, email or phone"
              />
            </Field>
          </div>
          <Loading {...data} retry={data.refresh} />
          <div className="erp-scroll">
            <RecordListTable className="erp-table" aria-label="Customers">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Activity</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {data.items
                  ?.filter((c) =>
                    (c.name + " " + c.email + " " + c.phone)
                      .toLowerCase()
                      .includes(search.toLowerCase()),
                  )
                  .map((c) => (
                    <tr key={c.id}>
                      <td>
                        <strong>{c.name}</strong>
                        <small>
                          {c.email || c.phone || "No contact details"}
                        </small>
                      </td>
                      <td>{c.records} records</td>
                      <td>
                        <button
                          className="erp-secondary"
                          onClick={() => setSelected(c.id)}
                        >
                          Open profile
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </RecordListTable>
          </div>
        </Section>
        {data.store &&
        selected &&
        data.items?.some((c) => c.id === selected) ? (
          <Profile
            key={data.store + selected}
            store={data.store}
            customer={data.items.find((c) => c.id === selected)!}
          />
        ) : (
          <Section title="Customer profile">
            <p className="erp-empty">
              Choose a customer to see their activity and add a follow-up.
            </p>
          </Section>
        )}
      </div>
    </ERPLayout>
  );
}
function Profile({ store, customer }: { store: string; customer: Contact }) {
  const history = useERP<History>(`customers/${customer.id}/history`),
    notes = useERP<Note>("notes"),
    action = useAction();
  const [body, setBody] = useState(""),
    [due, setDue] = useState("");
  return (
    <div>
      <Section title={customer.name}>
        <div className="erp-pad">
          <dl className="erp-facts">
            <div>
              <dt>Email</dt>
              <dd>{customer.email || "Not provided"}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{customer.phone || "Not provided"}</dd>
            </div>
          </dl>
        </div>
        <Loading {...history} retry={history.refresh} />
        <ol className="erp-timeline">
          {history.items?.map((h) => (
            <li key={h.kind + h.id}>
              <strong>
                {h.kind} · {h.title}
              </strong>
              <p>{h.status.replaceAll("_", " ")}</p>
              <small>
                {stamp(h.created_at)} · <Link to={h.path}>Open record →</Link>
              </small>
            </li>
          ))}
        </ol>
      </Section>
      <Section title="Notes & follow-ups">
        <Feedback {...action} />
        <form
          className="erp-form"
          onSubmit={(e) => {
            e.preventDefault();
            void action.run(async () => {
              await api.post(endpoint(store, "notes"), {
                customer_id: customer.id,
                body,
                due_date: due || null,
              });
              setBody("");
              setDue("");
              notes.refresh();
            }, "Customer note saved.");
          }}
        >
          <Field label="Contact note / next step">
            <textarea
              required
              maxLength={2000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </Field>
          <Field label="Follow-up date (optional)">
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
            />
          </Field>
          <button disabled={action.busy || !body.trim()}>
            Save customer note
          </button>
        </form>
        <Loading {...notes} retry={notes.refresh} />
        <ol className="erp-timeline">
          {notes.items
            ?.filter((n) => n.customer_id === customer.id)
            .map((n) => (
              <li key={n.id}>
                <p>{n.body}</p>
                {n.due_date && <p>Follow up: {n.due_date.slice(0, 10)}</p>}
                <small>
                  {n.actor} · {stamp(n.created_at)}
                </small>
              </li>
            ))}
        </ol>
      </Section>
    </div>
  );
}
