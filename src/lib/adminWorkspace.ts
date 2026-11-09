export const adminEquivalentPath = (path: string): string | undefined =>
  (
    ({
      "/portal/owner/purchasing": "/portal/admin/erp?view=purchases",
      "/portal/owner/stock-control": "/portal/admin/erp?view=stock",
      "/portal/owner/accounting/accounts": "/portal/admin/erp?view=accounts",
      "/portal/owner/accounting/imports": "/portal/admin/erp?view=imports",
      "/portal/owner/accounting": "/portal/admin/erp?view=documents",
      "/portal/owner/reconciliation": "/portal/admin/erp?view=bank-lines",
      "/portal/owner/reports": "/portal/admin/erp?view=trial-balance",
      "/portal/owner/customers": "/portal/admin/customers",
      "/portal/owner/people": "/portal/admin/erp?view=people",
      "/portal/owner/activity": "/portal/admin/erp?view=events",
    }) as Record<string, string>
  )[path];

type Column = readonly [key: string, label: string];
export type AdminView = {
  label: string;
  permission: string;
  columns: readonly Column[];
  erp?: boolean;
};
export const adminViews: Record<string, AdminView> = {
 accounts:{label:"Chart of accounts",permission:"transactions.view",erp:true,columns:[["code","Code"],["name","Account"],["kind","Type"],["is_active","Active"],["balance_minor","Net debit / (credit)"]]},
 imports:{label:"Accounting imports",permission:"transactions.view",erp:true,columns:[["file_name","File"],["kind","Import type"],["record_count","Records"],["actor","Imported by"],["created_at","Date"]]},
  customers: {
    label: "Customers",
    permission: "merchants.view",
    columns: [
      ["name", "Customer"],
      ["email", "Email"],
      ["phone", "Phone"],
      ["is_active", "Status"],
      ["created_at", "Registered"],
    ],
  },
  products: {
    label: "Products & Services",
    permission: "products.view",
    columns: [
      ["name", "Item"],
      ["business", "Business"],
      ["branch_name", "Branch"],
      ["price", "Price"],
      ["purchase_flow", "Customer step"],
      ["stock_quantity", "Base stock"],
      ["variants", "Variants"],
      ["is_active", "Status"],
    ],
  },
  categories: {
    label: "Menu categories",
    permission: "products.view",
    columns: [
      ["name", "Category"],
      ["business", "Business"],
      ["branch_name", "Branch"],
      ["items", "Items"],
    ],
  },
  quotes: {
    label: "Quotes & estimates",
    permission: "orders.view",
    columns: [
      ["name", "Request"],
      ["business", "Business"],
      ["customer", "Customer"],
      ["status", "Status"],
      ["amount", "Amount"],
      ["scheduled_at", "Proposed time"],
    ],
  },
  jobs: {
    label: "Service jobs",
    permission: "orders.view",
    columns: [
      ["name", "Service"],
      ["business", "Business"],
      ["customer", "Customer"],
      ["provider", "Provider"],
      ["status", "Status"],
      ["scheduled_start_at", "Scheduled"],
    ],
  },
  bookings: {
    label: "Bookings",
    permission: "orders.view",
    columns: [
      ["name", "Booking"],
      ["business", "Business"],
      ["customer", "Customer"],
      ["status", "Status"],
      ["starts_at", "Starts"],
      ["ends_at", "Ends"],
    ],
  },
  "custom-orders": {
    label: "Custom orders",
    permission: "orders.view",
    columns: [
      ["name", "Request"],
      ["business", "Business"],
      ["customer", "Customer"],
      ["status", "Status"],
      ["promised_at", "Promised"],
    ],
  },
  suppliers: {
    label: "Suppliers",
    erp: true,
    permission: "products.view",
    columns: [
      ["name", "Supplier"],
      ["phone", "Phone"],
      ["email", "Email"],
      ["address", "Address"],
    ],
  },
  purchases: {
    label: "Purchase orders",
    erp: true,
    permission: "products.view",
    columns: [
      ["reference", "Order"],
      ["supplier_name", "Supplier"],
      ["status", "Status"],
      ["created_at", "Created"],
    ],
  },
  receipts: {
    label: "Goods receipts",
    erp: true,
    permission: "products.view",
    columns: [
      ["reference", "Delivery"],
      ["purchase_reference", "Purchase order"],
      ["created_at", "Received"],
    ],
  },
  stock: {
    label: "Stock movements",
    erp: true,
    permission: "products.view",
    columns: [
      ["name", "Item"],
      ["sku", "SKU"],
      ["quantity", "Change"],
      ["balance", "Balance after"],
      ["reason", "Reason"],
      ["actor", "Recorded by"],
      ["created_at", "Recorded"],
    ],
  },
  documents: {
    label: "Accounting documents",
    erp: true,
    permission: "transactions.view",
    columns: [
      ["reference", "Reference"],
      ["kind", "Type"],
      ["status", "Status"],
      ["customer_name", "Customer"],
      ["supplier_name", "Supplier"],
      ["amount_minor", "Amount"],
      ["created_at", "Created"],
    ],
  },
  journals: {
    label: "Posted journals",
    erp: true,
    permission: "transactions.view",
    columns: [
      ["reference", "Journal"],
      ["posting_date", "Posting date"],
      ["description", "Description"],
      ["actor", "Recorded by"],
    ],
  },
  balances: {
    label: "Customer & supplier balances",
    erp: true,
    permission: "transactions.view",
    columns: [
      ["reference", "Document"],
      ["kind", "Type"],
      ["amount_minor", "Amount"],
      ["paid_minor", "Paid"],
      ["credited_minor", "Credited"],
    ],
  },
  "payment-records": {
    label: "External payment evidence",
    erp: true,
    permission: "transactions.view",
    columns: [
      ["document_reference", "Document"],
      ["reference", "Evidence reference"],
      ["amount_minor", "Amount"],
      ["paid_on", "Date paid"],
      ["reversed", "Reversed"],
    ],
  },
  "trial-balance": {
    label: "Trial balance",
    erp: true,
    permission: "transactions.view",
    columns: [
      ["account", "Account"],
      ["debit_minor", "Debit"],
      ["credit_minor", "Credit"],
    ],
  },
  "bank-lines": {
    label: "Bank statement lines",
    erp: true,
    permission: "transactions.view",
    columns: [
      ["statement_reference", "Statement"],
      ["reference", "Line reference"],
      ["line_date", "Date"],
      ["amount_minor", "Amount"],
      ["journal_reference", "Matched journal"],
    ],
  },
  "bank-match-history": {
    label: "Reconciliation history",
    erp: true,
    permission: "transactions.view",
    columns: [
      ["bank_reference", "Bank line"],
      ["journal_reference", "Journal"],
      ["action", "Decision"],
      ["reason", "Reason"],
      ["actor", "Recorded by"],
      ["created_at", "Recorded"],
    ],
  },
  "period-history": {
    label: "Closed accounting periods",
    erp: true,
    permission: "transactions.view",
    columns: [
      ["through_date", "Closed through"],
      ["reason", "Reason"],
      ["actor", "Recorded by"],
      ["created_at", "Recorded"],
    ],
  },
  employees: {
    label: "Branch team",
    erp: true,
    permission: "admin.manage",
    columns: [
      ["name", "Team member"],
      ["role", "Role"],
    ],
  },
  people: {
    label: "Leave & attendance",
    erp: true,
    permission: "admin.manage",
    columns: [
      ["employee_name", "Team member"],
      ["kind", "Type"],
      ["starts_on", "From"],
      ["ends_on", "To"],
      ["status", "Status"],
      ["detail", "Details"],
    ],
  },
  events: {
    label: "ERP activity",
    erp: true,
    permission: "transactions.view",
    columns: [
      ["title", "Update"],
      ["created_at", "Recorded"],
    ],
  },
};

export const operationViews = ["quotes", "jobs", "bookings", "custom-orders"];
export const erpViewKeys = Object.keys(adminViews).filter(
  (key) => adminViews[key].erp,
);

export function adminDisplayValue(
  key: string,
  value: unknown,
  currency = "ZMW",
): string {
  if (value === null || value === undefined || value === "") return "—";
  if (key.endsWith("_minor"))
    return `${currency} ${(Number(value) / 100).toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (
    key === "price" ||
    key === "amount" ||
    key === "deposit_amount" ||
    key === "balance_amount"
  )
    return `${currency} ${Number(value).toLocaleString("en-ZM", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (typeof value === "boolean")
    return key === "is_active"
      ? value
        ? "Active"
        : "Inactive"
      : value
        ? "Yes"
        : "No";
  if (/(_at|_on|_date)$/.test(key) && typeof value === "string") {
    const date = new Date(
      value.length === 10 ? value + "T12:00:00+02:00" : value,
    );
    if (!Number.isNaN(date.getTime()))
      return new Intl.DateTimeFormat("en-ZM", {
        timeZone: "Africa/Lusaka",
        dateStyle: "medium",
        ...(value.length > 10 ? { timeStyle: "short" as const } : {}),
      }).format(date);
  }
  return String(value).replaceAll("_", " ");
}
