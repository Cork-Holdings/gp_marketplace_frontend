export function historyAddress(value: unknown) {
  if (typeof value === 'string') return value || 'Not recorded';
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'Not recorded';
  const address = value as Record<string, unknown>;
  return [address.line1, address.line2, address.city, address.country].filter(part => typeof part === 'string' && part.trim()).join(', ') || 'Not recorded';
}

export function historyLabel(value: unknown) {
  if (typeof value !== "string" || !value.trim()) return "Not recorded";
  const labels: Record<string, string> = {
    customer_confirmed: "Customer confirmed completion",
    provider_completed: "Work submitted for customer review",
    assigned: "Provider assigned",
    dispatched: "Provider dispatched",
    arrived: "Provider arrived",
    in_progress: "Work started",
    note: "Work note",
    successful: "Payment confirmed",
    collection_recovered: "Existing payment recorded for settlement",
    release_recovered: "Merchant disbursement authorised",
  };
  return (
    labels[value] ??
    value.replaceAll("_", " ").replace(/^./, (letter) => letter.toUpperCase())
  );
}
export function historyAmount(value: unknown, currency: unknown = "ZMW") {
  if (
    (typeof value !== "number" && typeof value !== "string") ||
    value === "" ||
    !Number.isFinite(Number(value))
  )
    return "Not recorded";
  const code =
    typeof currency === "string" && /^[A-Z]{3}$/.test(currency)
      ? currency
      : "ZMW";
  try {
    return new Intl.NumberFormat("en-ZM", {
      style: "currency",
      currency: code,
    }).format(Number(value));
  } catch {
    return `${code} ${Number(value).toFixed(2)}`;
  }
}
export function historyDate(
  value: unknown,
  part: "date" | "time" | "full" = "full",
) {
  if (typeof value !== "string" || !Number.isFinite(Date.parse(value)))
    return "Time not recorded";
  const options: Intl.DateTimeFormatOptions = { timeZone: "Africa/Lusaka" };
  if (part !== "time")
    Object.assign(options, { day: "numeric", month: "short", year: "numeric" });
  if (part !== "date")
    Object.assign(options, { hour: "numeric", minute: "2-digit" });
  return new Intl.DateTimeFormat("en-ZM", options).format(new Date(value));
}
