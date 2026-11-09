import { Link } from "react-router-dom";
import api from "@/lib/api/crud";
import { ERPLayout, Section, Loading, Feedback, Refresh } from "./ERPShared";
import { useERP, useAction } from "./useERP";
import { endpoint, stamp, type ERPEvent } from "./erp";
export default function ActivityPage() {
  const data = useERP<ERPEvent>("events"),
    action = useAction();
  return (
    <ERPLayout
      title="ERP activity inbox"
      description="Purchasing, stock and accounting updates for this branch. Read markers belong to your account."
      action={<Refresh onClick={data.refresh} />}
    >
      <Feedback {...action} />
      <Section
        title={`Recent updates${data.items ? ` · ${data.items.filter((e) => !e.read_at).length} unread` : ""}`}
      >
        <Loading {...data} retry={data.refresh} />
        {data.items?.map((e) => (
          <div
            className={`erp-event${e.read_at ? "" : " is-unread"}`}
            key={e.id}
          >
            <div>
              <p>
                <Link
                  to={e.path}
                  onClick={() => {
                    if (data.store && !e.read_at)
                      void action.run(async () => {
                        await api.post(
                          endpoint(data.store!, `events/${e.id}/read`),
                        );
                        data.refresh();
                      }, "Marked as read.");
                  }}
                >
                  {e.title}
                </Link>
              </p>
              <small>{stamp(e.created_at)}</small>
            </div>
            {!e.read_at && (
              <button
                className="erp-secondary"
                disabled={action.busy}
                onClick={() => {
                  if (data.store)
                    void action.run(async () => {
                      await api.post(
                        endpoint(data.store!, `events/${e.id}/read`),
                      );
                      data.refresh();
                    }, "Marked as read.");
                }}
              >
                Mark read
              </button>
            )}
          </div>
        ))}
      </Section>
    </ERPLayout>
  );
}
