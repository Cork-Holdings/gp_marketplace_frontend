import { Fragment, useId, useState, type ReactNode } from "react";
import { useWorkflowView } from "@/hooks/useWorkflowView";
import { WORKFLOW_VIEWS, type WorkflowGroup } from "@/lib/workflowView";
import { StatusBadge } from "./StatusBadge";
import { WorkflowIcon } from "./WorkflowIcon";
import { ErrorState } from "./ErrorState";
import "./customer-workflow-list.css";
import { TablePagination } from "./TablePagination";
import { useTablePagination } from "@/hooks/useTablePagination";

export type CustomerWorkflowItem = {
  id: string;
  title: string;
  reference?: string;
  context: string;
  date: string;
  status: string;
  value: string;
  group: WorkflowGroup;
  actionLabel: string;
  description?: string;
  facts: { label: string; value: ReactNode }[];
  preview?: ReactNode;
  tracker?: ReactNode;
};

type Props = {
  items: CustomerWorkflowItem[];
  label: string;
  contextHeading?: string;
  dateHeading?: string;
  valueHeading?: string;
  monetary?: boolean;
  paginated?: boolean;
  onOpen: (id: string) => void;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  empty: ReactNode;
};

const GROUPS = [
  { key: "attention", label: "Needs your attention" },
  { key: "ongoing", label: "Ongoing" },
  { key: "history", label: "History" },
] as const;

/** Presentation only: previewing or changing views never mutates a workflow. */
export function CustomerWorkflowList({
  items,
  label,
  contextHeading = "Business",
  dateHeading = "Requested",
  valueHeading = "Amount",
  monetary = true,
  paginated = false,
  onOpen,
  loading = false,
  error,
  onRetry,
  empty,
}: Props) {
  const { view, setView } = useWorkflowView();
  const prefix = useId();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());
  const paging = useTablePagination(items.map((item) => item.id));
  const pageItems = items.slice(paging.start, paging.end);
  const selected =
    pageItems.find((item) => item.id === selectedId) ?? pageItems[0];
  const option = WORKFLOW_VIEWS.find((item) => item.value === view)!;
  const expandable = view === "expandable_table";
  const lean = view === "table_detail";
  const ledger = view === "business_ledger";
  const toggle = (id: string) =>
    setExpandedIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const preview = (item: CustomerWorkflowItem, pane = false) => (
    <div className={pane ? "customer-list-detail" : "customer-list-expanded"}>
      {pane && (
        <>
          <p className="customer-list-eyebrow">
            Selected {label.toLowerCase().replace(/s$/, "")}
          </p>
          <h3>{item.title}</h3>
          <StatusBadge status={item.status} />
        </>
      )}
      {item.description && (
        <p className="customer-list-description">{item.description}</p>
      )}
      <dl className="customer-list-facts">
        {item.facts.map((fact) => (
          <div key={fact.label}>
            <dt>{fact.label}</dt>
            <dd>{fact.value}</dd>
          </div>
        ))}
      </dl>
      {item.preview}
      <button
        type="button"
        className="workflow-primary customer-list-detail-action"
        onClick={() => onOpen(item.id)}
      >
        {item.actionLabel}
        <WorkflowIcon name="arrowRight" />
      </button>
    </div>
  );

  const table = (records: CustomerWorkflowItem[], tableLabel: string) => (
    <table
      className={`customer-list-table${lean ? " is-lean" : ""}${ledger ? " is-ledger" : ""}`}
      aria-label={tableLabel}
    >
      <thead>
        <tr>
          {ledger && <th scope="col">{dateHeading}</th>}
          <th scope="col">{label}</th>
          {!lean && !ledger && <th scope="col">{contextHeading}</th>}
          {!lean && !ledger && <th scope="col">{dateHeading}</th>}
          <th scope="col">Status</th>
          <th scope="col" className={monetary ? "is-money" : ""}>
            {valueHeading}
          </th>
          {!lean && (
            <th scope="col">
              <span className="sr-only">Actions</span>
            </th>
          )}
        </tr>
      </thead>
      <tbody>
        {records.map((item) => {
          const expanded = expandedIds.has(item.id);
          const detailId = `${prefix}-${item.id}`;
          return (
            <Fragment key={item.id}>
              <tr
                className={
                  lean && item.id === selected?.id ? "is-selected" : ""
                }
              >
                {ledger && (
                  <td className="customer-list-date" data-label={dateHeading}>
                    {item.date}
                  </td>
                )}
                <td className="customer-list-title" data-label={label}>
                  <button
                    type="button"
                    className="customer-list-title-button"
                    aria-expanded={expandable ? expanded : undefined}
                    aria-controls={
                      expandable
                        ? detailId
                        : lean
                          ? `${prefix}-pane`
                          : undefined
                    }
                    aria-pressed={lean ? item.id === selected?.id : undefined}
                    onClick={() =>
                      expandable
                        ? toggle(item.id)
                        : lean
                          ? setSelectedId(item.id)
                          : onOpen(item.id)
                    }
                  >
                    {expandable && (
                      <span
                        aria-hidden="true"
                        className={`customer-list-chevron${expanded ? " is-open" : ""}`}
                      >
                        ›
                      </span>
                    )}
                    <span>
                      <strong>{item.title}</strong>
                      {item.reference && <small>{item.reference}</small>}
                      {(ledger || lean) && <small>{item.context}</small>}
                    </span>
                  </button>
                  {item.tracker && (
                    <div className="customer-list-tracker">{item.tracker}</div>
                  )}
                </td>
                {!lean && !ledger && (
                  <td
                    className="customer-list-context"
                    data-label={contextHeading}
                  >
                    {item.context}
                  </td>
                )}
                {!lean && !ledger && (
                  <td className="customer-list-date" data-label={dateHeading}>
                    {item.date}
                  </td>
                )}
                <td className="customer-list-status" data-label="Status">
                  <StatusBadge status={item.status} />
                </td>
                <td
                  className={`customer-list-value${monetary ? " is-money" : ""}`}
                  data-label={valueHeading}
                >
                  {item.value}
                </td>
                {!lean && (
                  <td className="customer-list-actions">
                    <button
                      type="button"
                      className="customer-list-open"
                      aria-label={`${item.actionLabel}: ${item.title}`}
                      onClick={() => onOpen(item.id)}
                    >
                      {item.actionLabel}
                      <WorkflowIcon name="arrowRight" size={14} />
                    </button>
                  </td>
                )}
              </tr>
              {expandable && (
                <tr className="customer-list-detail-row" hidden={!expanded}>
                  <td colSpan={6}>
                    <div id={detailId}>{expanded && preview(item)}</div>
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );

  return (
    <div className="customer-workflow-list">
      <div className="customer-list-view-picker">
        <label htmlFor={`${prefix}-view`}>
          <WorkflowIcon name="settings" />
          List view
        </label>
        <select
          id={`${prefix}-view`}
          value={view}
          onChange={(event) => setView(event.target.value as typeof view)}
          aria-describedby={`${prefix}-view-hint`}
        >
          {WORKFLOW_VIEWS.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
        <p id={`${prefix}-view-hint`}>{option.description}</p>
      </div>
      {loading ? (
        <div
          className="customer-list-skeleton"
          role="status"
          aria-label={`Loading ${label.toLowerCase()}`}
        >
          <span />
          <span />
          <span />
          <span />
        </div>
      ) : error ? (
        <ErrorState error={error} onRetry={onRetry} />
      ) : !items.length ? (
        empty
      ) : view === "action_queue" ? (
        <div className="customer-list-queue">
          {paginated && (
            <p className="customer-list-page-note">
              Grouped results on this page
            </p>
          )}
          {GROUPS.map((group) => {
            const records = pageItems.filter(
              (item) => item.group === group.key,
            );
            return records.length ? (
              <section
                key={group.key}
                aria-labelledby={`${prefix}-${group.key}`}
              >
                <div className="customer-list-group-heading">
                  <h3 id={`${prefix}-${group.key}`}>{group.label}</h3>
                  <span>{records.length} on this page</span>
                </div>
                {table(records, `${label}: ${group.label}`)}
              </section>
            ) : null;
          })}
        </div>
      ) : lean ? (
        <div className="customer-list-split">
          {table(pageItems, label)}
          {selected && (
            <aside id={`${prefix}-pane`} aria-label="Selected record overview">
              {preview(selected, true)}
            </aside>
          )}
        </div>
      ) : (
        table(pageItems, label)
      )}
      {!loading && !error && <TablePagination paging={paging} label={label} />}
    </div>
  );
}
