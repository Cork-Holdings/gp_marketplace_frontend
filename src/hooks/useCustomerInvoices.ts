import { useEffect, useState } from "react";
import api from "@/lib/api/crud";
import { useAuth } from "@/lib/context/useAuth";
export type CustomerInvoice = {
  id: string;
  reference: string;
  description: string;
  business: string;
  branch_name?: string;
  currency: string;
  status: string;
  amount_minor: number;
  paid_minor: number;
  credited_minor: number;
  created_at: string;
  due_date?: string;
  read_at?: string;
};
export function useCustomerInvoices() {
  const { user } = useAuth();
  const [revision, setRevision] = useState(0);
  const [state, setState] = useState<{
    user?: string;
    items?: CustomerInvoice[];
    error?: unknown;
  }>({});
  useEffect(() => {
    const controller = new AbortController();
    let busy = false;
    const load = async () => {
      if (
        busy ||
        controller.signal.aborted ||
        document.visibilityState === "hidden"
      )
        return;
      busy = true;
      try {
        const result = await api.get("/customers/me/invoices", {
          signal: controller.signal,
        });
        if (!controller.signal.aborted)
          setState({ user: user?.id, items: result.items });
      } catch (error) {
        if (!controller.signal.aborted) setState({ user: user?.id, error });
      } finally {
        busy = false;
      }
    };
    void load();
    const timer = window.setInterval(load, 15000);
    window.addEventListener("geepay:invoices-changed", load);
    return () => {
      controller.abort();
      clearInterval(timer);
      window.removeEventListener("geepay:invoices-changed", load);
    };
  }, [user?.id, revision]);
  return {
    ...(state.user === user?.id ? state : {}),
    refresh: () => setRevision((n) => n + 1),
  };
}
