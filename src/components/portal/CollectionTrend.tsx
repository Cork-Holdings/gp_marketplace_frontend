import { useId, useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import type { DashboardMoney, DashboardPeriod } from '@/types/ownerDashboard';

const dateLabel = (date: string) => new Intl.DateTimeFormat('en-ZM', { timeZone: 'Africa/Lusaka', month: 'short', day: 'numeric' }).format(new Date(date));

/** Daily net amounts, including negative refund days; exact values available without hover. */
export function CollectionTrend({ money, period, simulated }: { money: DashboardMoney; period: DashboardPeriod; simulated: boolean }) {
  const id = useId();
  const [mode, setMode] = useState<'real' | 'test'>(simulated ? 'test' : 'real');
  const points = money.trend ?? [];
  if (!points.length) return null;
  const amounts = points.map(point => Number(mode === 'test' ? point.simulated_collected : point.collected));
  const total = amounts.reduce((sum, amount) => sum + amount, 0);
  const maximum = Math.max(0, ...amounts), minimum = Math.min(0, ...amounts);
  const range = maximum - minimum || 1;
  const plotTop = 14, plotHeight = 108;
  const y = (amount: number) => plotTop + (maximum - amount) / range * plotHeight;
  const baseline = maximum === 0 && minimum === 0 ? plotTop + plotHeight : y(0);
  const cell = 600 / points.length;
  const duration = period === 'today' ? 'Today' : period === 'all' ? 'Most recent 30 days' : `Last ${points.length} days`;
  const summary = `${duration}: ${formatCurrency(total, money.currency)} in net ${mode === 'test' ? 'simulated' : 'real'} collections. ${mode === 'test' ? 'No real money moved.' : 'Not profit or a payout balance.'}`;
  return <section className="mt-5 border-t border-cream-dark pt-5" aria-labelledby={`${id}-title`}>
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 id={`${id}-title`} className="text-sm font-semibold text-charcoal">Collection trend</h3><p id={`${id}-summary`} className="mt-1 max-w-prose text-xs leading-relaxed text-forest-muted" aria-live="polite">{summary}</p></div>
      <div role="group" aria-label="Chart payment type" className="flex gap-1 rounded-lg bg-cream p-1">{(['real', 'test'] as const).map(value => <button key={value} type="button" aria-pressed={mode === value} onClick={() => setMode(value)} className={`min-h-10 rounded-md px-3 text-xs font-semibold transition-colors motion-reduce:transition-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cobalt ${mode === value ? 'bg-white text-cobalt shadow-sm' : 'text-forest-muted hover:text-charcoal'}`}>{value === 'real' ? 'Real' : 'Simulated'}</button>)}</div>
    </div>
    <div className="mt-4 grid min-w-0 grid-cols-[4.5rem_minmax(0,1fr)] gap-2">
      <div aria-hidden="true" className="flex h-[136px] flex-col justify-between py-3 text-[11px] text-forest-muted tabular-nums"><span>{formatCurrency(maximum, money.currency)}</span><span>{formatCurrency(minimum, money.currency)}</span></div>
      <div className="min-w-0"><svg className="h-[136px] w-full" viewBox="0 0 600 136" preserveAspectRatio="none" role="img" aria-labelledby={`${id}-title`} aria-describedby={`${id}-summary`}>
        <line x1="0" x2="600" y1={baseline} y2={baseline} stroke="#cbd5e1" strokeWidth="1" />
        {points.map((point, index) => <rect key={point.date} x={index * cell + cell * 0.15} y={amounts[index] === 0 ? baseline : Math.min(y(amounts[index]), baseline)} width={cell * 0.7} height={Math.abs(amounts[index] === 0 ? 0 : y(amounts[index]) - baseline)} rx="2" fill={mode === 'test' ? '#30C5F4' : '#3c3d94'} fillOpacity={mode === 'test' ? 0.65 : 1}><title>{dateLabel(point.date)}: {formatCurrency(amounts[index], money.currency)} {mode === 'test' ? '(simulated)' : ''}</title></rect>)}
      </svg><div aria-hidden="true" className="flex justify-between gap-2 text-[11px] text-forest-muted"><span>{dateLabel(points[0].date)}</span>{points.length > 1 && <span>{dateLabel(points[points.length - 1].date)}</span>}</div></div>
    </div>
    {amounts.every(amount => amount === 0) && <p className="mt-2 text-xs text-forest-muted">No confirmed {mode === 'test' ? 'test' : 'real'} collections in this chart period. Pending payments are not included.</p>}
    <details className="mt-3 text-xs"><summary className="w-fit cursor-pointer rounded py-2 font-medium text-cobalt hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-cobalt">View daily amounts</summary><div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-cream-dark"><table className="w-full text-left"><caption className="sr-only">Daily net real and simulated collections in {money.currency}, Lusaka time</caption><thead><tr className="bg-cream"><th scope="col" className="px-3 py-2">Date</th><th scope="col" className="px-3 py-2 text-right">Real</th><th scope="col" className="px-3 py-2 text-right">Simulated</th></tr></thead><tbody>{points.map(point => <tr key={point.date} className="border-t border-cream-dark"><th scope="row" className="px-3 py-2 font-normal">{dateLabel(point.date)}</th><td className="px-3 py-2 text-right tabular-nums">{formatCurrency(point.collected, money.currency)}</td><td className="px-3 py-2 text-right tabular-nums">{formatCurrency(point.simulated_collected, money.currency)}</td></tr>)}</tbody></table></div></details>
    <p className="mt-2 text-[11px] leading-relaxed text-forest-muted">By payment-status update, after refunds.{period === 'all' ? ' All-time summary includes older payments; this chart shows the latest 30 days.' : ''}</p>
  </section>;
}
