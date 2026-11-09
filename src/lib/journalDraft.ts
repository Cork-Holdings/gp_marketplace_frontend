import { erpMinor } from "./erpMoney.ts";
export function journalDraft(
  lines: { account: string; debit: string; credit: string }[],
  activeCodes: string[],
) {
  const amount = (value: string) => {
    try {
      return erpMinor(value || "0");
    } catch {
      return undefined;
    }
  };
  const values = lines.map((l) => ({
    account: l.account,
    debit: amount(l.debit),
    credit: amount(l.credit),
  }));
  const debit = values.reduce((n, l) => n + (l.debit ?? 0), 0),
    credit = values.reduce((n, l) => n + (l.credit ?? 0), 0);
  return {
    debit,
    credit,
    valid:
      lines.length >= 2 &&
      lines.length <= 100 &&
      debit > 0 &&
      debit === credit &&
      values.every(
        (l) =>
          activeCodes.includes(l.account) &&
          l.debit !== undefined &&
          l.credit !== undefined &&
          ((l.debit > 0 && l.credit === 0) || (l.credit > 0 && l.debit === 0)),
      ),
    lines: values,
  };
}
