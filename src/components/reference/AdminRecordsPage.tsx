import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "@/lib/api/crud";
import { usePermissions } from "@/lib/context/permissions";
import { RecordListTable } from "@/components/common/RecordListTable";
import { ErrorState } from "@/components/common/ErrorState";
import { ReferencePanel } from "./ReferenceUI";
import {
  adminViews,
  adminDisplayValue,
  operationViews,
  erpViewKeys,
} from "@/lib/adminWorkspace";
import "./admin-records.css";

type Row = Record<string, unknown>;
type Store = {
  id: string;
  name: string;
  branch_name?: string;
  currency: string;
};
type Result = { key: string; items?: Row[]; total?: number; error?: unknown };
export default function AdminRecordsPage({
  scope,
}: {
  scope: "customers" | "products" | "categories" | "operations" | "erp";
}) {
  const [params, setParams] = useSearchParams();
  const { hasPermission, loading: permissionsLoading } = usePermissions();
  const options = (
    scope === "erp"
      ? erpViewKeys
      : scope === "operations"
        ? operationViews
        : [scope]
  ).filter((key) => hasPermission(adminViews[key].permission));
  const requested = params.get("view"),
    kind = requested
      ? options.includes(requested)
        ? requested
        : undefined
      : options[0];
  const config = kind ? adminViews[kind] : undefined;
  const branch = params.get("store") ?? "";
  const [storeState, setStoreState] = useState<{
    items?: Store[];
    error?: unknown;
  }>({});
  const [storeSearch, setStoreSearch] = useState(""),
    [storeQuery, setStoreQuery] = useState("");
  const [search, setSearch] = useState(""),
    [query, setQuery] = useState(""),
    [offset, setOffset] = useState(0),
    [revision, setRevision] = useState(0);
  const [state, setState] = useState<Result>({ key: "" }),
    [selected, setSelected] = useState<Row>();
  const detailRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (selected) detailRef.current?.focus();
  }, [selected]);
  const [from, setFrom] = useState(new Date().getFullYear() + "-01-01"),
    [to, setTo] = useState(
      new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Lusaka" }).format(
        new Date(),
      ),
    );
  const key = JSON.stringify([kind, branch, query, offset, from, to, revision]);
  useEffect(() => {
    if (scope === "customers") return;
    const controller = new AbortController();
    setStoreState({});
    void api
      .get("/admin/stores?limit=100&q=" + encodeURIComponent(storeQuery), {
        signal: controller.signal,
      })
      .then(
        (data) => {
          if (!controller.signal.aborted) setStoreState({ items: data.stores });
        },
        (error) => {
          if (!controller.signal.aborted) setStoreState({ error });
        },
      );
    return () => controller.abort();
  }, [scope, storeQuery, revision]);
  useEffect(() => {
    setSelected(undefined);
    if (!config || permissionsLoading || (config.erp && !branch)) {
      setState({ key });
      return;
    }
    const controller = new AbortController();
    setState({ key });
    const url = config.erp
      ? `/admin/stores/${encodeURIComponent(branch)}/erp/${kind}?from=${from}&to=${to}`
      : `/admin/workspace/${kind}?limit=25&offset=${offset}&q=${encodeURIComponent(query)}${branch ? "&store_id=" + encodeURIComponent(branch) : ""}`;
    void api.get(url, { signal: controller.signal }).then(
      (data) => {
        if (!controller.signal.aborted)
          setState({ key, items: data.items, total: data.total });
      },
      (error) => {
        if (!controller.signal.aborted) setState({ key, error });
      },
    );
    return () => controller.abort();
  }, [key, config, kind, branch, query, offset, from, to, permissionsLoading]);
  const change = (name: string, value: string) => {
    setOffset(0);
    setSearch("");
    setQuery("");
    setParams((current) => {
      const next = new URLSearchParams(current);
      if (value) next.set(name, value);
      else next.delete(name);
      return next;
    });
  };
  const current = state.key === key ? state : undefined;
  const rows = config?.erp
    ? current?.items?.filter((row) =>
        JSON.stringify(row).toLowerCase().includes(query.toLowerCase()),
      )
    : current?.items;
  const store = storeState.items?.find((item) => item.id === branch);
  const title =
    scope === "erp"
      ? "Business ERP oversight"
      : scope === "operations"
        ? "Service & booking records"
        : scope === "categories"
          ? "Categories"
          : adminViews[scope].label;
  return (
    <div className="admin-records">
      <header className="reference-dashboard-head">
        <div>
          <h1>{title}</h1>
          <p>
            {scope === "erp"
              ? "Choose a business branch to inspect its saved ERP records. Changes remain in the merchant workspace."
              : scope === "categories"
                ? "Saved menu categories grouped by their owning business."
                : "Recorded platform data with search, details and business filters."}
          </p>
        </div>
        <button
          className="reference-button"
          onClick={() => setRevision((n) => n + 1)}
        >
          Refresh records
        </button>
      </header>
      <ReferencePanel title="Find records">
        <div className="admin-records-filters">
          {options.length > 1 && (
            <label>
              Record type
              <select
                value={kind ?? ""}
                onChange={(e) => change("view", e.target.value)}
              >
                {options.map((key) => (
                  <option key={key} value={key}>
                    {adminViews[key].label}
                  </option>
                ))}
              </select>
            </label>
          )}
          {scope !== "customers" && (
            <>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setStoreQuery(storeSearch);
                }}
              >
                <label>
                  Find a business
                  <input
                    type="search"
                    value={storeSearch}
                    maxLength={120}
                    placeholder="Business or branch name"
                    onChange={(e) => setStoreSearch(e.target.value)}
                  />
                </label>
                <button className="reference-link-button">Find business</button>
              </form>
              <label>
                Business branch
                <select
                  value={branch}
                  onChange={(e) => change("store", e.target.value)}
                >
                  <option value="">
                    {config?.erp ? "Choose a branch" : "All businesses"}
                  </option>
                  {branch && !store && (
                    <option value={branch}>
                      Selected branch · {branch.slice(0, 8)}
                    </option>
                  )}
                  {storeState.items?.map((s) => (
                    <option value={s.id} key={s.id}>
                      {s.name} · {s.branch_name || s.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </label>
            </>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setOffset(0);
              setQuery(search);
            }}
          >
            <label>
              Search records
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                maxLength={120}
                placeholder="Name, reference or status"
              />
            </label>
            <button className="reference-link-button">Search</button>
          </form>
          {kind === "trial-balance" && (
            <>
              <label>
                From
                <input
                  type="date"
                  required
                  value={from}
                  max={to}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </label>
              <label>
                To
                <input
                  type="date"
                  required
                  min={from}
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </label>
            </>
          )}
        </div>
        {storeState.error && (
          <ErrorState
            error={storeState.error}
            onRetry={() => setRevision((n) => n + 1)}
          />
        )}
      </ReferencePanel>
      {permissionsLoading ? (
        <p className="reference-note" role="status">
          Checking access…
        </p>
      ) : !config ? (
        <p className="reference-notice">
          Your admin role does not include this view. Ask a super administrator
          to review your access.
        </p>
      ) : config.erp && !branch ? (
        <div className="reference-note admin-records-empty">
          <h2>Choose a business first</h2>
          <p>
            Select a branch above to view purchasing, stock, accounting or
            people records.
          </p>
        </div>
      ) : (
        <ReferencePanel title={config.label}>
          <p className="reference-note">
            {config.erp
              ? `${store?.name ?? "Selected branch"} · read-only · up to 500 recent records. ${query ? "Search filters the loaded records." : ""}`
              : `${current?.total ?? "Loading"} recorded entries · 25 per page`}
            {scope === "products" &&
              " · Base stock is separate from variant balances."}
          </p>
          {current?.error ? (
            <ErrorState
              error={current.error}
              onRetry={() => setRevision((n) => n + 1)}
            />
          ) : !rows ? (
            <p className="reference-note" role="status">
              Loading records…
            </p>
          ) : rows.length ? (
            <div className="reference-table-wrap">
              <RecordListTable
                className="reference-table"
                aria-label={config.label}
              >
                <thead>
                  <tr>
                    {config.columns.map(([field, label]) => (
                      <th scope="col" key={field}>
                        {label}
                      </th>
                    ))}
                    <th scope="col">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={String(row.id ?? row.account ?? index)}>
                      {config.columns.map(([field]) => (
                        <td key={field} data-label={field}>
                          {adminDisplayValue(
                            field,
                            row[field],
                            String(row.currency ?? store?.currency ?? "ZMW"),
                          )}
                        </td>
                      ))}
                      <td>
                        <button
                          className="reference-link-button"
                          onClick={() => setSelected(row)}
                        >
                          View record
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </RecordListTable>
            </div>
          ) : (
            <p className="reference-note" role="status">
              {query
                ? "No matching records. Try another search."
                : "No recorded entries for this view. New records will appear here when the business creates them."}
            </p>
          )}
          {!config.erp && current?.total !== undefined && (
            <div className="reference-pagination">
              <button
                disabled={!offset}
                onClick={() => setOffset((n) => Math.max(0, n - 25))}
              >
                Previous
              </button>
              <span>
                Page {Math.floor(offset / 25) + 1} of{" "}
                {Math.max(1, Math.ceil(current.total / 25))}
              </span>
              <button
                disabled={offset + 25 >= current.total}
                onClick={() => setOffset((n) => n + 25)}
              >
                Next
              </button>
            </div>
          )}
        </ReferencePanel>
      )}
      {selected && (
        <ReferencePanel
          title="Selected record"
          action={
            <button
              className="reference-link-button"
              onClick={() => setSelected(undefined)}
            >
              Close details
            </button>
          }
        >
          <div className="admin-records-detail" tabIndex={-1} ref={detailRef}>
            <h2>
              {String(
                selected.name ??
                  selected.reference ??
                  selected.title ??
                  selected.account ??
                  "Record",
              )}
            </h2>
            <dl className="reference-detail-facts">
              {Object.entries(selected)
                .filter(
                  ([field, value]) =>
                    field !== "path" &&
                    value !== null &&
                    typeof value !== "object",
                )
                .map(([field, value]) => (
                  <div key={field}>
                    <dt>{field.replaceAll("_", " ")}</dt>
                    <dd>
                      {adminDisplayValue(
                        field,
                        value,
                        String(selected.currency ?? store?.currency ?? "ZMW"),
                      )}
                    </dd>
                  </div>
                ))}
            </dl>
            {Array.isArray(selected.lines) && (
              <>
                <h3>Lines</h3>
                <ul>
                  {(selected.lines as Row[]).map((line, i) => (
                    <li key={i}>
                      {Object.entries(line)
                        .map(
                          ([field, value]) =>
                            `${field.replaceAll("_", " ")} · ${adminDisplayValue(field, value)}`,
                        )
                        .join(" / ")}
                    </li>
                  ))}
                </ul>
              </>
            )}
            {(kind === "quotes" || (kind === "jobs" && selected.quote_id)) && (
              <Link
                className="reference-link-button"
                to={`/portal/admin/settlements/history/quote/${selected.quote_id ?? selected.id}`}
              >
                Review service, payment and issue history (finance access
                required) →
              </Link>
            )}
          </div>
        </ReferencePanel>
      )}
    </div>
  );
}
