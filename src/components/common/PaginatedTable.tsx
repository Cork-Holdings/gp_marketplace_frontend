import { cloneElement, type ReactNode, type TableHTMLAttributes } from "react";
import { recordElements } from "@/lib/recordElements";
import { TablePagination } from "./TablePagination";
import { useTablePagination } from "@/hooks/useTablePagination";

/** Leaves captions, headings, totals and row actions intact while paging the body. */
export function PaginatedTable({
  children,
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  const sections = recordElements(children);
  const bodies = sections.filter((node) => node.type === "tbody");
  const rows = bodies.flatMap((body) =>
    recordElements(body.props.children as ReactNode),
  );
  const paging = useTablePagination(
    rows.map((row, index) => String(row.key ?? index)),
  );
  if (bodies.length !== 1) return <table {...props}>{children}</table>;
  const label = props["aria-label"] ?? "Table records";
  return (
    <div className="paginated-table">
      <div className="paginated-table-scroll">
        <table {...props}>
          {sections.map((section) =>
            section.type === "tbody"
              ? cloneElement(section, {}, rows.slice(paging.start, paging.end))
              : section,
          )}
        </table>
      </div>
      <TablePagination paging={paging} label={label} />
    </div>
  );
}
