import { PaginatedTable } from '@/components/common/PaginatedTable';
import { useEffect, useId, useState } from "react";
import { Link } from "react-router-dom";
import api from "@/lib/api/crud";
import { useMarketplace } from "@/lib/context/useMarketplace";
import { usePermissions } from "@/lib/context/permissions";
import { usePlan } from "@/lib/context/plan";
import { ErrorState } from "@/components/common/ErrorState";
import { recordedCurrency } from "@/lib/recordedData";
import type { WorkspaceRole } from "@/lib/erpModules";
import "./module-snapshot.css";

type Row = Record<string, unknown>;
type Source = {
  url: string;
  label: string;
  permission: string;
  feature?: string;
  field?: string;
  platform?: boolean;
};
type Loaded = { source: Source; data: Record<string, unknown>; rows: Row[] };
type Snapshot = {
  key: string;
  loaded?: Loaded[];
  errors?: unknown[];
  updated?: string;
};
export function ModuleSnapshot({
  role,
  moduleId,
}: {
  role: WorkspaceRole;
  moduleId?: string;
}) {
  const { selectedStore } = useMarketplace();
  const { hasPermission, loading } = usePermissions();
  const { data: plan } = usePlan();
  const [revision, setRevision] = useState(0),
    [snapshot, setSnapshot] = useState<Snapshot>({ key: "" });
  const chartId = useId();
  const owner = `/owner/stores/${selectedStore?.id}`,
    admin = "/admin/workspace/";
  let sources: Source[] = [];
  if (role === "admin") {
    if (["inventory", "customers", "sales"].includes(moduleId ?? "")) {
      const kinds =
        moduleId === "inventory"
          ? ["products", "categories"]
          : moduleId === "customers"
            ? ["customers"]
            : ["quotes", "jobs", "bookings", "custom-orders"];
      sources = kinds.map((kind) => ({
        url: admin + kind + "?limit=25",
        label: (
          {
            products: "Products & services",
            categories: "Menu categories",
            customers: "Customers",
            quotes: "Quotes",
            jobs: "Service jobs",
            bookings: "Bookings",
            "custom-orders": "Custom orders",
          } as Record<string, string>
        )[kind],
        permission:
          kind === "customers"
            ? "merchants.view"
            : ["products", "categories"].includes(kind)
              ? "products.view"
              : "orders.view",
      }));
    } else if (moduleId === "administration")
      sources = [
        {
          url: "/admin/platform/plan",
          label: "Subscription plans",
          permission: "admin.manage",
        },
      ];
    else if (moduleId === "online-presence")
      sources = [
        {
          url: "/admin/platform/page",
          label: "Website pages",
          permission: "admin.manage",
        },
        {
          url: "/admin/platform/marketplace",
          label: "Marketplace content",
          permission: "admin.manage",
        },
      ];
    else if (moduleId === "trust")
      sources = [
        {
          url: "/admin/kyc?status=pending&limit=25",
          label: "Pending KYC reviews",
          permission: "kyc.view",
          field: "verifications",
        },
      ];
    else if (
      hasPermission("orders.view") &&
      hasPermission("transactions.view") &&
      hasPermission("merchants.view")
    )
      sources = [
        {
          url: "/admin/dashboard",
          label: "Platform activity",
          permission: "admin.manage",
          platform: true,
        },
      ];
  } else if (selectedStore) {
    const erp = (
      kind: string,
      label: string,
      permission: string,
      feature: string,
    ) => ({ url: owner + "/erp/" + kind, label, permission, feature });
    if (moduleId === "people")
      sources = [
        erp("employees", "Employees", "erp.people", "hr"),
        erp("people", "Leave & attendance", "erp.people", "hr"),
      ];
    else if (moduleId === "finance" || moduleId === "reports")
      sources = [
        erp("documents", "Accounting documents", "erp.finance", "accounting"),
        erp("journals", "Posted journals", "erp.finance", "accounting"),
      ];
    else if (moduleId === "inventory")
      sources = [
        erp("purchases", "Purchase orders", "products.view", "inventory"),
        erp("suppliers", "Suppliers", "products.view", "inventory"),
      ];
    else if (moduleId === "customers")
      sources = [
        erp("customers", "Customers", "erp.customers", "crm"),
        erp("notes", "Follow-up notes", "erp.customers", "crm"),
      ];
    else if (moduleId === "calendar")
      sources = [
        {
          url: owner + "/reservations?limit=50",
          label: "Bookings",
          permission: "orders.view",
          field: "reservations",
        },
      ];
    else if (moduleId === "administration" || moduleId === "online-presence")
      sources = [
        {
          url: "/owner/stores",
          label: "Available branches",
          permission: "stores.view",
          field: "stores",
        },
      ];
    else
      sources = [
        {
          url: owner + "/dashboard?period=all",
          label: "Business activity",
          permission: "orders.view",
          platform: true,
        },
      ];
  }
  sources = sources.filter(
    (s) =>
      hasPermission(s.permission) &&
      (!s.feature || plan?.plan.data.features.includes(s.feature)),
  );
  const signature = JSON.stringify(sources),
    key = signature + ":" + revision;
  useEffect(() => {
    if (loading) return;
    const controller = new AbortController();
    const requested = JSON.parse(signature) as Source[];
    void Promise.allSettled(
      requested.map(async (source) => {
        const data = await api.get(source.url, { signal: controller.signal });
        const raw = source.platform
          ? []
          : Array.isArray(data)
            ? data
            : (data.items ?? data[source.field ?? "items"] ?? []);
        return { source, data, rows: Array.isArray(raw) ? raw : [] };
      }),
    ).then((results) => {
      if (controller.signal.aborted) return;
      setSnapshot({
        key,
        loaded: results.flatMap((r) =>
          r.status === "fulfilled" ? [r.value] : [],
        ),
        errors: results.flatMap((r) =>
          r.status === "rejected" ? [r.reason] : [],
        ),
        updated: new Date().toISOString(),
      });
    });
    return () => controller.abort();
  }, [key, signature, loading]);
  if (role === "owner" && !selectedStore)
    return <p className="module-empty">Choose a branch to see its activity.</p>;
  const current = snapshot.key === key ? snapshot : undefined;
  const loaded = current?.loaded;
  const platform = loaded?.find((s) => s.source.platform)?.data;
  const metrics: { label: string; value: string | number }[] =
    loaded
      ?.filter((s) => !s.source.platform)
      .map((s) => ({
        label: s.source.label,
        value: typeof s.data.total === "number" ? s.data.total : s.rows.length,
      })) ?? [];
  if (platform) {
    if (role === "admin")
      metrics.push(
        { label: "Merchants", value: Number(platform.merchants) },
        { label: "Customers", value: Number(platform.customers) },
        { label: "Stores", value: Number(platform.stores) },
      );
    if (Array.isArray(platform.money))
      for (const m of platform.money as Row[])
        metrics.push({
          label: `Confirmed collections · ${m.currency}`,
          value: recordedCurrency(m.collected, String(m.currency)),
        });
  }
  const statusRows =
    loaded?.find((s) => s.rows.some((r) => typeof r.status === "string"))
      ?.rows ?? [];
  const counts: Record<string, number> = {};
  for (const row of statusRows) {
    const status = String(row.status ?? "Unspecified");
    counts[status] = (counts[status] ?? 0) + 1;
  }
  if (platform?.order_counts && typeof platform.order_counts === "object")
    Object.assign(counts, platform.order_counts);
  const bars = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...bars.map(([, n]) => n));
  const recent =
    loaded
      ?.flatMap((s) => s.rows.map((row) => ({ row, label: s.source.label })))
      .filter(({ row }) => row.created_at)
      .sort((a, b) =>
        String(b.row.created_at).localeCompare(String(a.row.created_at)),
      )
      .slice(0, 4) ?? [];
  return (
    <section className="module-snapshot" aria-label="At a glance">
      <header>
        <div>
          <h2>At a glance</h2>
          <p>
            {role === "admin"
              ? "Platform records"
              : `${selectedStore?.name} · ${selectedStore?.branch_name ?? "Selected branch"}`}
            {current?.updated &&
              ` · Updated ${new Intl.DateTimeFormat("en-ZM", { timeZone: "Africa/Lusaka", timeStyle: "short" }).format(new Date(current.updated))}`}
          </p>
        </div>
        <button type="button" onClick={() => setRevision((n) => n + 1)}>
          Refresh overview
        </button>
      </header>
      {current?.errors?.map((error, i) => (
        <ErrorState
          key={i}
          error={error}
          onRetry={() => setRevision((n) => n + 1)}
        />
      ))}
      {!loaded ? (
        <p role="status">Loading current activity…</p>
      ) : !sources.length ? (
        <p>
          Your role or plan has no summary data for this section. Use the
          available tools below.
        </p>
      ) : (
        <>
          <div className="module-snapshot-metrics">
            {metrics.map((metric, i) => (
              <div key={metric.label} className={`snapshot-tone-${i % 3}`}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>
          {bars.length > 0 && (
            <div className="module-snapshot-breakdown">
              <h3>Work by status</h3>
              <p id={chartId}>
                Counts from the loaded records.{" "}
                {role === "admin" && platform
                  ? "Order counts cover the platform."
                  : "The breakdown reflects the records loaded for this overview."}
              </p>
              <div aria-describedby={chartId}>
                {bars.map(([status, count]) => (
                  <div className="module-status-bar" key={status}>
                    <span>{status.replaceAll("_", " ")}</span>
                    <span className="module-bar-track">
                      <span
                        style={{ width: `${(count / max) * 100}%` }}
                        aria-hidden="true"
                      />
                    </span>
                    <strong>{count}</strong>
                  </div>
                ))}
              </div>
              <details>
                <summary>View exact values</summary>
                <PaginatedTable>
                  <caption>Status counts</caption>
                  <thead>
                    <tr>
                      <th scope="col">Status</th>
                      <th scope="col">Records</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bars.map(([status, count]) => (
                      <tr key={status}>
                        <th scope="row">{status.replaceAll("_", " ")}</th>
                        <td>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </PaginatedTable>
              </details>
            </div>
          )}
          {recent.length > 0 && (
            <div className="module-snapshot-recent">
              <h3>Recent activity</h3>
              <ul>
                {recent.map(({ row, label }, i) => (
                  <li key={String(row.id ?? i)}>
                    <span>
                      <strong>
                        {String(
                          row.reference ??
                            row.name ??
                            row.title ??
                            row.employee_name ??
                            label,
                        )}
                      </strong>
                      <small>
                        {label} ·{" "}
                        {String(row.status ?? "Recorded").replaceAll("_", " ")}
                      </small>
                    </span>
                    <time>
                      {new Intl.DateTimeFormat("en-ZM", {
                        timeZone: "Africa/Lusaka",
                        dateStyle: "medium",
                      }).format(new Date(String(row.created_at)))}
                    </time>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!bars.length &&
            !recent.length &&
            metrics.every((m) => m.value === 0) && (
              <p>
                No recorded activity yet. Start with one of the available tools
                below.
              </p>
            )}
          <p className="module-snapshot-note">
            {platform
              ? "Recorded operational totals. Collections and accounting profit are separate."
              : role === "admin"
                ? "Directory totals are platform-wide. Status breakdowns and recent activity use up to 25 loaded records per directory."
                : "ERP summaries use up to 500 recent records. Booking summaries use up to 50 loaded records."}
            {role === "admin" && moduleId === "finance" && (
              <>
                {" "}
                <Link to="/portal/admin/erp">
                  Choose a branch for its accounting records →
                </Link>
              </>
            )}
          </p>
        </>
      )}
    </section>
  );
}
