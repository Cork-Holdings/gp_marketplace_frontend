import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { usePlatformDocuments } from "@/hooks/usePlatformDocuments";
import {
  platformApi,
  essentialFeatures,
  type Plan,
  type PlatformDocument,
} from "@/lib/platform";
import { ErrorState } from "@/components/common/ErrorState";
import { recordedCurrency } from "@/lib/recordedData";
import "./PlatformManagement.css";
import "./admin-plan-editor.css";

const blank = (): PlatformDocument<Plan> => ({
  kind: "plan",
  slug: "",
  version: 0,
  data: {
    name: "",
    description: "",
    active: false,
    is_default: false,
    monthly_minor: 0,
    yearly_minor: 0,
    features: [...essentialFeatures],
  },
});
export default function AdminPlanEditorPage({
  create = false,
}: {
  create?: boolean;
}) {
  const { slug } = useParams();
  const navigate = useNavigate();
  const list = usePlatformDocuments<Plan>("plan", true);
  const [editing, setEditing] = useState<PlatformDocument<Plan>>(),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>();
  useEffect(() => {
    if (create) {
      setEditing(blank());
      return;
    }
    if (list.items) {
      const plan = list.items.find((doc) => doc.slug === slug);
      setEditing(plan ? structuredClone(plan) : undefined);
    }
  }, [create, slug, list.items]);
  const change = (patch: Partial<Plan>) =>
    setEditing((current) =>
      current ? { ...current, data: { ...current.data, ...patch } } : current,
    );
  async function save(event: FormEvent) {
    event.preventDefault();
    if (!editing || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      await platformApi.save(editing);
      navigate("/portal/admin/plans", { state: { message: "Plan saved." } });
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(false);
    }
  }
  const available = list.features.filter((feature) => feature.available);
  return (
    <div className="platform-manager admin-plan-editor">
      <Link className="module-back" to="/portal/admin/plans">
        ← Back to subscription plans
      </Link>
      <header>
        <div>
          <h1>{create ? "Create plan" : "Edit plan"}</h1>
          <p>
            {create
              ? "Choose the price and business tools for a new plan."
              : `Update ${editing?.data.name ?? "this plan"} and its included business tools.`}
          </p>
        </div>
      </header>
      {list.error ? (
        <ErrorState error={list.error} onRetry={list.refresh} />
      ) : !list.items ? (
        <p role="status">Loading plan…</p>
      ) : !editing ? (
        <section className="platform-editor">
          <h2>Plan not found</h2>
          <p>Return to the plan list to choose an existing plan.</p>
        </section>
      ) : (
        <div className="admin-plan-editor-layout">
          <form id="plan-editor" className="platform-editor" onSubmit={save}>
            {error && <ErrorState error={error} />}
            <section>
              <h2>Plan details</h2>
              <p>The identifier is fixed after creation.</p>
              <div className="platform-two">
                <label>
                  Plan identifier
                  <input
                    value={editing.slug}
                    onChange={(e) =>
                      setEditing({ ...editing, slug: e.target.value })
                    }
                    pattern="[a-z0-9]+(-[a-z0-9]+)*"
                    maxLength={80}
                    placeholder="e.g. business-plus"
                    required
                    disabled={editing.version > 0 || busy}
                  />
                </label>
                <label>
                  Plan name
                  <input
                    value={editing.data.name}
                    onChange={(e) => change({ name: e.target.value })}
                    maxLength={80}
                    required
                    disabled={busy}
                  />
                </label>
              </div>
              <label>
                Description
                <textarea
                  value={editing.data.description}
                  onChange={(e) => change({ description: e.target.value })}
                  maxLength={1000}
                  disabled={busy}
                />
              </label>
            </section>
            <section>
              <h2>Pricing and visibility</h2>
              <div className="platform-two">
                <label>
                  Monthly price (ZMW)
                  <input
                    type="number"
                    min="0"
                    max="1000000"
                    step="0.01"
                    value={editing.data.monthly_minor / 100}
                    onChange={(e) =>
                      change({
                        monthly_minor: Math.round(Number(e.target.value) * 100),
                      })
                    }
                    disabled={busy || editing.data.is_default}
                    required
                  />
                </label>
                <label>
                  Yearly price (ZMW)
                  <input
                    type="number"
                    min="0"
                    max="10000000"
                    step="0.01"
                    value={editing.data.yearly_minor / 100}
                    onChange={(e) =>
                      change({
                        yearly_minor: Math.round(Number(e.target.value) * 100),
                      })
                    }
                    disabled={busy || editing.data.is_default}
                    required
                  />
                </label>
              </div>
              <label className="platform-check">
                <input
                  type="checkbox"
                  checked={editing.data.active}
                  onChange={(e) => change({ active: e.target.checked })}
                  disabled={busy || editing.data.is_default}
                />
                Active · visible to owners
              </label>
              <label className="platform-check">
                <input
                  type="checkbox"
                  checked={editing.data.is_default}
                  onChange={(e) =>
                    change(
                      e.target.checked
                        ? {
                            is_default: true,
                            active: true,
                            monthly_minor: 0,
                            yearly_minor: 0,
                          }
                        : { is_default: false },
                    )
                  }
                  disabled={
                    busy ||
                    !!(
                      editing.version > 0 &&
                      list.items?.some(
                        (doc) =>
                          doc.slug === editing.slug && doc.data.is_default,
                      )
                    )
                  }
                />
                Free default for unassigned businesses
              </label>
            </section>
            <section>
              <h2>Included business tools</h2>
              <p>
                Selected modules appear in the business workspace. Staff still
                need the corresponding role permissions.
              </p>
              <fieldset>
                <legend>Core operations</legend>
                <div className="admin-plan-feature-grid">
                  {available
                    .filter((f) => essentialFeatures.includes(f.key))
                    .map((feature) => (
                      <label className="platform-check" key={feature.key}>
                        <input type="checkbox" checked disabled />
                        {feature.name}
                        <small>Included in every plan</small>
                      </label>
                    ))}
                </div>
              </fieldset>
              <fieldset>
                <legend>Optional modules</legend>
                <div className="admin-plan-feature-grid">
                  {available
                    .filter((f) => !essentialFeatures.includes(f.key))
                    .map((feature) => (
                      <label className="platform-check" key={feature.key}>
                        <input
                          type="checkbox"
                          disabled={busy}
                          checked={editing.data.features.includes(feature.key)}
                          onChange={(e) =>
                            change({
                              features: e.target.checked
                                ? [...editing.data.features, feature.key]
                                : editing.data.features.filter(
                                    (key) => key !== feature.key,
                                  ),
                            })
                          }
                        />
                        {feature.name}
                      </label>
                    ))}
                </div>
              </fieldset>
            </section>
            <p className="platform-notice">
              Core fulfilment remains available for existing customer work.
              Inactive assigned plans fall back to the free default. Plan
              assignment and billing are separate actions.
            </p>
            <div className="platform-actions">
              <button className="primary" disabled={busy}>
                {busy ? "Saving…" : "Save plan"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => navigate("/portal/admin/plans")}
              >
                Cancel
              </button>
            </div>
          </form>
          <aside
            className="platform-editor admin-plan-preview"
            aria-label="Plan preview"
          >
            <span>Plan preview</span>
            <h2>{editing.data.name || "Your plan name"}</h2>
            <p>
              {editing.data.description ||
                "Add a description to explain this plan."}
            </p>
            <strong>
              {recordedCurrency(
                (editing.data.monthly_minor / 100).toFixed(2),
                "ZMW",
              )}
              <small> / month</small>
            </strong>
            <p>
              {recordedCurrency(
                (editing.data.yearly_minor / 100).toFixed(2),
                "ZMW",
              )}{" "}
              / year
            </p>
            <span className="platform-status">
              {editing.data.active ? "Active" : "Inactive"}
              {editing.data.is_default ? " · Default" : ""}
            </span>
            <h3>
              {
                available.filter((f) => editing.data.features.includes(f.key))
                  .length
              }{" "}
              included tools
            </h3>
            <ul>
              {available
                .filter((f) => editing.data.features.includes(f.key))
                .map((f) => (
                  <li key={f.key}>{f.name}</li>
                ))}
            </ul>
          </aside>
        </div>
      )}
    </div>
  );
}
