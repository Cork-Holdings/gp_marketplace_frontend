import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { RecordListTable } from "@/components/common/RecordListTable";
import { usePlatformDocuments } from "@/hooks/usePlatformDocuments";
import { platformApi, type Plan, type PlanRequest } from "@/lib/platform";
import { ErrorState } from "@/components/common/ErrorState";
import "./PlatformManagement.css";
const money = (minor: number) =>
  `K ${(minor / 100).toLocaleString("en-ZM", { minimumFractionDigits: 2 })}`;
export function AdminPlansPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const list = usePlatformDocuments<Plan>("plan", true);
  const [busy, setBusy] = useState(false),
    [message, setMessage] = useState(
      typeof location.state?.message === "string" ? location.state.message : "",
    ),
    [error, setError] = useState<unknown>();
  const [requests, setRequests] = useState<PlanRequest[]>(),
    [requestError, setRequestError] = useState<unknown>();
  const [review, setReview] = useState<PlanRequest | null>(null),
    [note, setNote] = useState("");
  const [requestsRevision, setRequestsRevision] = useState(0);
  useEffect(() => {
    let ignore = false;
    void platformApi.requests().then(
      (data) => {
        if (!ignore) {
          setRequests(data.items);
          setRequestError(undefined);
        }
      },
      (err) => {
        if (!ignore) setRequestError(err);
      },
    );
    return () => {
      ignore = true;
    };
  }, [requestsRevision]);
  async function assign(event: FormEvent) {
    event.preventDefault();
    if (!review || !note.trim() || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      await platformApi.assign(
        review.merchant_id,
        review.plan_slug,
        note.trim(),
      );
      setReview(null);
      setNote("");
      setRequestsRevision((v) => v + 1);
      setMessage(
        "Manual access assigned. No payment was recorded and no recurring charge was created.",
      );
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="platform-manager">
      <header>
        <div>
          <h1>Subscription plans</h1>
          <p>
            Set prices, choose available modules and control which plans owners
            can request.
          </p>
        </div>
        <button
          className="primary"
          onClick={() => navigate("/portal/admin/plans/new")}
          disabled={busy}
        >
          Create plan
        </button>
      </header>
      <p className="platform-notice">
        Prices are in ZMW. The free default keeps existing operations available.
        Paid upgrades are review requests only; automatic subscription
        collection and renewals are not enabled.
      </p>
      {message && (
        <p className="platform-notice platform-success" role="status">
          {message}
        </p>
      )}
      {error && <ErrorState error={error} />}
      <div>
        <div>
          {list.error ? (
            <ErrorState error={list.error} onRetry={list.refresh} />
          ) : !list.items ? (
            <p role="status">Loading plans…</p>
          ) : (
            <div className="platform-table-wrap">
              <RecordListTable aria-label="Subscription plans">
                <thead>
                  <tr>
                    <th scope="col">Plan</th>
                    <th scope="col">Monthly / yearly</th>
                    <th scope="col">Status</th>
                    <th scope="col">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {list.items.map((doc) => (
                    <tr key={doc.slug}>
                      <td>
                        <strong>{doc.data.name}</strong>
                        <small>{doc.data.description}</small>
                      </td>
                      <td>
                        {money(doc.data.monthly_minor)}
                        <small>{money(doc.data.yearly_minor)} / year</small>
                      </td>
                      <td>
                        <span className="platform-status">
                          {doc.data.active ? "Active" : "Inactive"}
                          {doc.data.is_default ? " · Default" : ""}
                        </span>
                      </td>
                      <td>
                        <Link
                          to={`/portal/admin/plans/${encodeURIComponent(doc.slug)}/edit`}
                        >
                          Edit plan
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </RecordListTable>
            </div>
          )}
        </div>
      </div>
      <section className="platform-section">
        <h2>Plan change requests</h2>
        <p>
          Review the requested interval and contact the business. Manual access
          assignment does not collect payment or create a subscription.
        </p>
        {requestError ? (
          <ErrorState
            error={requestError}
            onRetry={() => setRequestsRevision((v) => v + 1)}
          />
        ) : !requests ? (
          <p>Loading requests…</p>
        ) : requests.length ? (
          <div className="platform-table-wrap">
            <RecordListTable aria-label="Plan change requests">
              <thead>
                <tr>
                  <th>Business</th>
                  <th>Requested plan</th>
                  <th>Interval</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.merchant_id}>
                    <td>{r.merchant_name}</td>
                    <td>{r.plan_slug}</td>
                    <td>{r.billing_interval}</td>
                    <td>
                      <button
                        onClick={() => {
                          setReview(r);
                          setNote("");
                        }}
                      >
                        Review manual access
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </RecordListTable>
          </div>
        ) : (
          <p className="platform-notice">No pending plan requests.</p>
        )}
        {review && (
          <form className="platform-editor platform-section" onSubmit={assign}>
            <h2>Manual access · {review.merchant_name}</h2>
            <p>
              Assign {review.plan_slug} without taking payment. Record why this
              business is receiving access.
            </p>
            <label>
              Reason / approval note
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                required
              />
            </label>
            <div className="platform-actions">
              <button className="primary" disabled={busy || !note.trim()}>
                Assign manual access
              </button>
              <button
                type="button"
                onClick={() => setReview(null)}
                disabled={busy}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  );
}
