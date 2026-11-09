import { useEffect, useState, useSyncExternalStore } from "react";
import {
  paginationWindow,
  DEFAULT_TABLE_PAGE_SIZE,
} from "@/lib/tablePagination";

const subscribePrint = (notify: () => void) => {
  const media = window.matchMedia("print");
  media.addEventListener("change", notify);
  return () => media.removeEventListener("change", notify);
};
const isPrinting = () => window.matchMedia("print").matches;
const serverPrint = () => false;

/** Local pages cover the loaded dataset; remote paging remains with its caller. */
export function useTablePagination(
  keys: string[],
  pageSize = DEFAULT_TABLE_PAGE_SIZE,
) {
  const scope = JSON.stringify(keys);
  const [selection, setSelection] = useState({ scope, page: 0 });
  useEffect(() => {
    setSelection((current) =>
      current.scope === scope ? current : { scope, page: 0 },
    );
  }, [scope]);
  const printing = useSyncExternalStore(
    subscribePrint,
    isPrinting,
    serverPrint,
  );
  const state = paginationWindow(
    keys.length,
    selection.scope === scope ? selection.page : 0,
    pageSize,
  );
  return {
    ...state,
    printing,
    setPage: (page: number) => setSelection({ scope, page }),
    start: printing ? 0 : state.start,
    end: printing ? state.total : state.end,
  };
}
