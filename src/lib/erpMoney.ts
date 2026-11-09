/** Exact minor-unit parsing for manual ERP records; never round user input silently. */
export function erpMinor(value: string): number {
  if (!/^\d+(\.\d{1,2})?$/.test(value))
    throw new Error("Enter an amount with up to two decimal places.");
  const [whole, fraction = ""] = value.split(".");
  const amount = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  if (!Number.isSafeInteger(amount) || amount > 100000000000)
    throw new Error("Amount is too large.");
  return amount;
}
