import { erpMinor } from "./erpMoney.ts";
export type BankCSVLine = {
  date: string;
  reference: string;
  amount_minor: number;
};
/** Small, bounded CSV reader, including quoted commas, escaped quotes and CRLF. */
export function parseBankCSV(csv: string): BankCSVLine[] {
  if (csv.length > 90000)
    throw new Error("Choose a statement with at most 500 lines and 90 KB.");
  const rows: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false;
  const value = csv.replace(/^\uFEFF/, "");
  for (let i = 0; i < value.length; i++) {
    const ch = value[i];
    if (ch === '"') {
      if (quoted && value[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = !quoted;
    } else if (ch === "," && !quoted) {
      row.push(field.trim());
      field = "";
    } else if ((ch === "\n" || ch === "\r") && !quoted) {
      if (ch === "\r" && value[i + 1] === "\n") i++;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else field += ch;
  }
  if (quoted) throw new Error("A quoted CSV field is unfinished.");
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  if (
    rows[0]?.map((v) => v.toLowerCase()).join(",") === "date,reference,amount"
  )
    rows.shift();
  if (!rows.length || rows.length > 500)
    throw new Error("Use 1 to 500 statement lines.");
  return rows.map((r, i) => {
    if (
      r.length !== 3 ||
      !/^\d{4}-\d{2}-\d{2}$/.test(r[0]) ||
      Number.isNaN(Date.parse(r[0] + "T12:00:00Z")) ||
      new Date(r[0] + "T12:00:00Z").toISOString().slice(0, 10) !== r[0] ||
      !r[1] ||
      r[1].length > 200
    )
      throw new Error(
        `Check the date, reference and amount on CSV row ${i + 1}.`,
      );
    const negative = r[2].startsWith("-");
    const amount = erpMinor(r[2].replace(/^[+-]/, "")) * (negative ? -1 : 1);
    if (!amount) throw new Error(`CSV row ${i + 1} has a zero amount.`);
    return { date: r[0], reference: r[1], amount_minor: amount };
  });
}
