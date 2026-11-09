export const DEFAULT_TABLE_PAGE_SIZE = 25;

export function paginationWindow(
  total: number,
  requestedPage: number,
  size = DEFAULT_TABLE_PAGE_SIZE,
) {
  const pageSize = Math.max(1, Math.floor(size) || DEFAULT_TABLE_PAGE_SIZE);
  const count = Math.max(0, Math.floor(total) || 0);
  const pages = Math.max(1, Math.ceil(count / pageSize));
  const page = Math.max(0, Math.min(pages - 1, Math.floor(requestedPage) || 0));
  return {
    page,
    pages,
    pageSize,
    start: page * pageSize,
    end: Math.min(count, (page + 1) * pageSize),
    total: count,
  };
}
