import { cloneElement, isValidElement, useId, type ReactNode } from "react";
import { useMarketplace } from "@/lib/context/useMarketplace";
import { ErrorState } from "@/components/common/ErrorState";
import { ReferenceIcon } from "@/components/reference/ReferenceIcon";
import { human } from "./erp";
import "./erp.css";
export function ERPLayout({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const { selectedStore } = useMarketplace();
  return (
    <div className="erp-workspace">
      <header className="erp-page-head">
        <div>
          <p className="erp-eyebrow">
            BUSINESS WORKSPACE ·{" "}
            {selectedStore?.branch_name || selectedStore?.name}
          </p>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        {action}
      </header>
      {selectedStore ? (
        children
      ) : (
        <p className="erp-empty">Choose a branch to continue.</p>
      )}
    </div>
  );
}
export function Status({ value }: { value: string }) {
  return (
    <span className={`erp-status is-${value}`}>
      <span aria-hidden="true" />
      {human(value)}
    </span>
  );
}
export function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  const id = useId();
  return (
    <section className="erp-section" aria-labelledby={id}>
      <header>
        <h2 id={id}>{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  const generated = useId();
  const child = isValidElement<{
    id?: string;
    name?: string;
    autoComplete?: string;
    "aria-describedby"?: string;
  }>(children)
    ? children
    : null;
  const id = child?.props.id ?? generated;
  return (
    <div className="erp-field">
      <label htmlFor={id}>{label}</label>
      {child
        ? cloneElement(child, {
            id,
            name: child.props.name ?? id,
            autoComplete: child.props.autoComplete ?? "off",
            "aria-describedby": hint
              ? `${id}-hint`
              : child.props["aria-describedby"],
          })
        : children}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </div>
  );
}
export function FormPanel({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details className="erp-form-panel">
      <summary>
        <ReferenceIcon name="plus" size={18} />
        {title}
      </summary>
      {children}
    </details>
  );
}
export function Loading({
  error,
  items,
  retry,
}: {
  error?: unknown;
  items?: unknown[];
  retry: () => void;
}) {
  return error ? (
    <ErrorState error={error} onRetry={retry} />
  ) : !items ? (
    <p role="status" className="erp-empty">
      Loading records…
    </p>
  ) : !items.length ? (
    <p className="erp-empty">No records yet. New records will appear here.</p>
  ) : null;
}
export function Feedback({
  error,
  success,
  busy,
}: {
  error: string;
  success: string;
  busy?: boolean;
}) {
  return (
    <>
      {busy && (
        <p className="erp-hint" role="status">
          Saving…
        </p>
      )}
      {error && (
        <p className="erp-feedback is-error" role="alert">
          {error}
        </p>
      )}
      {success && (
        <p className="erp-feedback" role="status">
          {success}
        </p>
      )}
    </>
  );
}
export function Refresh({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      className="erp-secondary"
      onClick={() => {
        onClick();
        window.dispatchEvent(new Event("geepay:erp-refresh"));
      }}
    >
      <ReferenceIcon name="refresh" size={16} />
      Refresh
    </button>
  );
}
