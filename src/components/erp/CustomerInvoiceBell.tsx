import { Link } from "react-router-dom";
import { useCustomerInvoices } from "@/hooks/useCustomerInvoices";
import { ReferenceIcon } from "@/components/reference/ReferenceIcon";
export function CustomerInvoiceBell() {
  const data = useCustomerInvoices();
  const unread = data.items?.filter((i) => !i.read_at).length;
  return (
    <Link
      className="reference-icon-button"
      to="/account/invoices"
      aria-label={
        data.error
          ? "Invoice notifications unavailable"
          : `Invoice notifications${unread ? `, ${unread} unread` : ""}`
      }
      title="Invoice notifications"
    >
      <ReferenceIcon name="bell" />
      {Boolean(unread) && <span className="reference-count">{unread}</span>}
    </Link>
  );
}
