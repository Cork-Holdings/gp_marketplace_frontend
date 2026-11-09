import type { useTablePagination } from "@/hooks/useTablePagination";
import "./table-pagination.css";

export function TablePagination({
  paging,
  label = "Records",
}: {
  paging: ReturnType<typeof useTablePagination>;
  label?: string;
}) {
  if (paging.total <= paging.pageSize || paging.printing) return null;
  return (
    <nav className="table-pagination" aria-label={`${label} pagination`}>
      <p role="status">
        {paging.start + 1}–{paging.end} of {paging.total} loaded records · Page{" "}
        {paging.page + 1} of {paging.pages}
      </p>
      <div>
        <button
          type="button"
          disabled={paging.page === 0}
          onClick={() => paging.setPage(paging.page - 1)}
        >
          Previous
        </button>
        <button
          type="button"
          disabled={paging.page + 1 >= paging.pages}
          onClick={() => paging.setPage(paging.page + 1)}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
