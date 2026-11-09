import { Link } from "react-router-dom";
import { useEffect } from "react";
import { ReferenceIcon } from "@/components/reference/ReferenceIcon";
import { usePermissions } from "@/lib/context/permissions";
import { usePlan } from "@/lib/context/plan";
import { ReferencePanel } from "@/components/reference/ReferenceUI";
import { useERP } from "./useERP";
import type { ERPEvent } from "./erp";
export function ERPActivitySummary() {
  const { hasPermission } = usePermissions();
  const plan = usePlan();
  return hasPermission("erp.finance") && plan.data ? <Activity /> : null;
}
function Activity() {
  const events = useERP<ERPEvent>("events");
  const unread = events.items?.filter((e) => !e.read_at);
  return (
    <ReferencePanel title="ERP updates" to="/portal/owner/activity">
      <div className="reference-note">
        {events.error ? (
          <>
            <p>ERP updates could not be loaded.</p>
            <button className="reference-link-button" onClick={events.refresh}>
              Try again
            </button>
          </>
        ) : unread ? (
          <>
            <p>
              <strong>
                {unread.length} unread{" "}
                {unread.length === 1 ? "update" : "updates"}
              </strong>{" "}
              · purchasing, stock and manual books
            </p>
            {unread.slice(0, 3).map((e) => (
              <p key={e.id}>
                <Link to="/portal/owner/activity">{e.title} →</Link>
              </p>
            ))}
          </>
        ) : (
          <p role="status">Loading ERP updates…</p>
        )}
      </div>
    </ReferencePanel>
  );
}
export function ERPNotificationBell() {
  const events = useERP<ERPEvent>("events");
  const refresh = events.refresh;
  useEffect(() => {
    const timer = window.setInterval(() => {
      if (!document.hidden) refresh();
    }, 15000);
    return () => window.clearInterval(timer);
  }, [refresh]);
  const count = events.items?.filter((e) => !e.read_at).length ?? 0;
  return (
    <Link
      className="reference-icon-button"
      style={{ position: "relative" }}
      to="/portal/owner/activity"
      aria-label={`ERP activity inbox${count ? `, ${count} unread recent updates` : ""}`}
      title={
        events.error
          ? "ERP updates could not load. Open the inbox to retry."
          : "ERP activity inbox"
      }
    >
      <ReferenceIcon name="bell" />
      {count > 0 && (
        <span
          className="reference-count"
          style={{
            position: "absolute",
            right: -4,
            top: -3,
            minWidth: 18,
            fontSize: 10,
          }}
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
