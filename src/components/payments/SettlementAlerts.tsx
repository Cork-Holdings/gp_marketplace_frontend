import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api/crud";
import { useAuth } from "@/lib/context/useAuth";
import { usePaymentMode } from "@/hooks/usePaymentMode";
import { ErrorState } from "@/components/common/ErrorState";
import { ReferenceIcon } from "@/components/reference/ReferenceIcon";
import "./live-settlement.css";

import {
  SettlementAlertsContext as Context,
  useSettlementAlerts,
  type Alerts,
} from "./SettlementAlertsContext";

export function SettlementAlertsProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useAuth();
  const simulated = usePaymentMode();
  const [data, setData] = useState<Alerts>();
  const [loadedUser, setLoadedUser] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>();
  const [offset, setOffset] = useState(0);
  const [revision, setRevision] = useState(0);
  const refresh = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    if (simulated) {
      setData(undefined);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    let inFlight = false;
    const load = async () => {
      if (
        inFlight ||
        controller.signal.aborted ||
        document.visibilityState === "hidden"
      )
        return;
      inFlight = true;
      setLoading(true);
      try {
        const next = await api.get(
          `/admin/settlements/alerts?offset=${offset}`,
          { signal: controller.signal },
        );
        if (!controller.signal.aborted) {
          setData(next);
          setLoadedUser(user?.id);
          setError(undefined);
        }
      } catch (cause) {
        if (!controller.signal.aborted) setError(cause);
      } finally {
        inFlight = false;
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    void load();
    const timer = window.setInterval(load, 30000);
    window.addEventListener("focus", load);
    return () => {
      controller.abort();
      clearInterval(timer);
      window.removeEventListener("focus", load);
    };
  }, [user?.id, simulated, offset, revision]);
  const read = async (id: string) => {
    await api.post(`/admin/settlements/alerts/${id}/read`);
    setData((current) =>
      current
        ? {
            ...current,
            unread: Math.max(
              0,
              current.unread -
                (current.items.find((item) => item.quote_id === id)?.unread
                  ? 1
                  : 0),
            ),
            items: current.items.map((item) =>
              item.quote_id === id ? { ...item, unread: false } : item,
            ),
          }
        : current,
    );
    refresh();
  };
  return (
    <Context.Provider
      value={{
        data: !simulated && loadedUser === user?.id ? data : undefined,
        loading,
        error,
        offset,
        setOffset,
        refresh,
        read,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export function SettlementNotificationBell() {
  const { data, error } = useSettlementAlerts();
  const count = error ? undefined : data?.unread;
  return (
    <Link
      className="reference-icon-button settlement-notification-bell"
      to="/portal/admin/notifications"
      aria-label={
        error
          ? "Settlement notifications unavailable"
          : `Settlement notifications${count ? `, ${count} unread` : ""}`
      }
      title="Settlement notifications"
    >
      <ReferenceIcon name="bell" />
      {Boolean(count) && (
        <span className="reference-count" aria-hidden="true">
          {count! > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

export function SettlementAlertSummary() {
  const { data, error, loading, refresh } = useSettlementAlerts();
  if (error)
    return (
      <div className="settlement-alert-summary">
        <p>
          Settlement alerts could not be loaded. Outstanding payments may need
          review.
        </p>
        <button
          type="button"
          className="reference-link-button"
          onClick={refresh}
        >
          Retry alerts
        </button>
      </div>
    );
  if (!data)
    return (
      <p className="reference-note">
        {loading
          ? "Checking settlement alerts…"
          : "Settlement alerts unavailable."}
      </p>
    );
  if (!data.can_manage)
    return (
      <p className="reference-note">
        {data.can_review && data.live_enabled===false
          ? 'Live settlement review is disabled in this test session. Your finance administrator access is available.'
          : 'Settlement review is restricted to finance and super administrators.'}
      </p>
    );
  return (
    <div
      className={`settlement-alert-summary${data.total ? " needs-review" : ""}`}
      role="status"
    >
      <strong>
        {data.total
          ? `${data.total} collected ${data.total === 1 ? "payment needs" : "payments need"} settlement review`
          : "No collected quoted-service payments awaiting enrollment"}
      </strong>
      <p>
        {data.total
          ? "These payments have no settlement record. Do not collect again. Review the history and verified merchant recipient before authorising disbursement."
          : "Other payment and dispute workflows are not covered by this alert."}
      </p>
      <Link to="/portal/admin/settlements#settlement-review-queue">
        Open settlement review queue
      </Link>
    </div>
  );
}

export function SettlementNotificationsPage() {
  const { data, loading, error, offset, setOffset, refresh, read } =
    useSettlementAlerts();
  const [readError, setReadError] = useState<unknown>();
  return (
    <div className="settlement-page">
      <header className="reference-dashboard-head">
        <div>
          <h1>Settlement notifications</h1>
          <p>
            Successful quoted-service payments without a settlement record need
            finance review.
          </p>
        </div>
        <button
          className="reference-button"
          onClick={refresh}
          disabled={loading}
        >
          Refresh
        </button>
      </header>
      {error && <ErrorState error={error} onRetry={refresh} />}{" "}
      {readError && (
        <ErrorState
          error={readError}
          title="Notification could not be marked read"
        />
      )}
      {data && !data.can_manage ? (
        <p>
          {data.can_review && data.live_enabled===false ? 'Live settlement notifications are disabled in this test session. Your finance administrator access is available.' : 'Only finance and super administrators can view these notifications.'}
        </p>
      ) : (
        <section
          className="settlement-notification-list"
          aria-label="Settlement notifications"
        >
          {!data && loading ? (
            <p role="status">Loading notifications…</p>
          ) : !data?.items.length ? (
            <p>No outstanding settlement notifications on this page.</p>
          ) : (
            data.items.map((item) => (
              <article
                key={item.quote_id}
                className={item.unread ? "is-unread" : ""}
              >
                <div>
                  <h2>
                    {item.unread && (
                      <span
                        className="settlement-unread-dot"
                        aria-label="Unread"
                      />
                    )}
                    Settlement review required
                  </h2>
                  <strong>{item.title}</strong>
                  <p>
                    {item.business} · {item.customer} ·{" "}
                    {new Intl.NumberFormat("en-ZM", {
                      style: "currency",
                      currency: item.currency,
                    }).format(item.gross_minor / 100)}
                  </p>
                  <p>
                    Payment received. No settlement record exists. Reading this
                    notification does not settle or disburse it.
                  </p>
                </div>
                <Link
                  className="reference-button"
                  to="/portal/admin/settlements#settlement-review-queue"
                  onClick={() => {
                    if (item.unread)
                      void read(item.quote_id).catch(setReadError);
                  }}
                >
                  Review in finance queue
                </Link>
              </article>
            ))
          )}
        </section>
      )}
      <div className="reference-pagination">
        <button
          disabled={!offset || loading}
          onClick={() => setOffset(Math.max(0, offset - 20))}
        >
          Previous
        </button>
        <span>
          Page {offset / 20 + 1} · {data?.unread ?? "…"} unread
        </span>
        <button
          disabled={!data?.has_more || loading}
          onClick={() => setOffset(offset + 20)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
