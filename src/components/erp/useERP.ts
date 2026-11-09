import { useCallback, useEffect, useState } from "react";
import { useMarketplace } from "@/lib/context/useMarketplace";
import { OwnerService } from "@/lib/api/services/owner";
import { list } from "./erp";
export function useERP<T>(path: string, enabled = true) {
  const { selectedStore } = useMarketplace();
  const store = selectedStore?.id;
  const [version, setVersion] = useState(0);
  const [state, setState] = useState<{
    key: string;
    items?: T[];
    error?: unknown;
  }>({ key: "" });
  const refresh = useCallback(() => setVersion((n) => n + 1), []);
  useEffect(() => {
    window.addEventListener("geepay:erp-refresh", refresh);
    if (path === "events") {
      window.addEventListener("geepay:erp-events-changed", refresh);
    }
    return () => {
      window.removeEventListener("geepay:erp-refresh", refresh);
      window.removeEventListener("geepay:erp-events-changed", refresh);
    };
  }, [path, refresh]);
  useEffect(() => {
    if (!store || !enabled) return;
    const controller = new AbortController();
    setState((previous) =>
      path === "events" && previous.key === store + path && previous.items
        ? previous
        : { key: store + path },
    );
    void list<T>(store, path, controller.signal)
      .then((items) => {
        if (!controller.signal.aborted) setState({ key: store + path, items });
      })
      .catch((error) => {
        if (!controller.signal.aborted) setState({ key: store + path, error });
      });
    return () => controller.abort();
  }, [store, path, version, enabled]);
  const current = enabled && state.key === store + path ? state : undefined;
  return { store, items: current?.items, error: current?.error, refresh };
}
export function useAction() {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [success, setSuccess] = useState("");
  return {
    busy,
    error,
    success,
    run: async (action: () => Promise<unknown>, message = "Saved.") => {
      if (busy) return;
      setBusy(true);
      setError("");
      setSuccess("");
      try {
        await action();
        window.dispatchEvent(new Event("geepay:erp-events-changed"));
        setSuccess(message);
        return true;
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Unable to save. Please try again.",
        );
        return false;
      } finally {
        setBusy(false);
      }
    },
  };
}
export type VariantOption = { id: string; name: string; stock: number };
export function useVariants(store?: string) {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const refresh = () => setRevision((n) => n + 1);
    window.addEventListener("geepay:erp-refresh", refresh);
    return () => window.removeEventListener("geepay:erp-refresh", refresh);
  }, []);
  const [state, setState] = useState<{
    store?: string;
    items?: VariantOption[];
    error?: unknown;
  }>({});
  useEffect(() => {
    let ignore = false;
    if (!store) return;
    setState({ store });
    void OwnerService.listProducts(store).then(
      (products) => {
        if (!ignore)
          setState({
            store,
            items: products
              .filter((p) => p.is_active !== false)
              .flatMap((p) =>
                (p.variants ?? [])
                  .filter((v) => v.id && v.is_active !== false)
                  .map((v) => ({
                    id: v.id!,
                    name: `${p.name} · ${v.sku || "Default"}`,
                    stock: Number(v.stock_quantity ?? 0),
                  })),
              ),
          });
      },
      (error) => {
        if (!ignore) setState({ store, error });
      },
    );
    return () => {
      ignore = true;
    };
  }, [store, revision]);
  return {
    ...(state.store === store ? state : {}),
    refresh: () => setRevision((n) => n + 1),
  };
}
