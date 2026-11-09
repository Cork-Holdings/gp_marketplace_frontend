type Account = { code: string; kind: string };
type Entry = {
  account: string;
  debit_minor: number | string;
  credit_minor: number | string;
};
export function accountingSummary(
  entries: Entry[] = [],
  accounts: Account[] = [],
) {
  const kinds = new Map(accounts.map((a) => [a.code, a.kind]));
  const amounts = { asset: 0, liability: 0, equity: 0, income: 0, expense: 0 };
  const unknown: string[] = [];
  for (const entry of entries) {
    const kind = kinds.get(entry.account);
    if (!kind || !(kind in amounts)) {
      unknown.push(entry.account);
      continue;
    }
    amounts[kind as keyof typeof amounts] +=
      Number(entry.debit_minor) - Number(entry.credit_minor);
  }
  return {
    assets: amounts.asset,
    liabilities: -amounts.liability,
    equity: -amounts.equity,
    income: -amounts.income,
    expenses: amounts.expense,
    profit: -amounts.income - amounts.expense,
    unknown,
  };
}
