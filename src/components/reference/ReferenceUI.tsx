import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ReferenceIcon } from './ReferenceIcon';
import { featurePath, type ReferenceRole } from '@/lib/referenceNavigation';
import './reference.css';
import './brand-refinements.css';

export function MarketplaceBrand({ compact = false }: { compact?: boolean }) {
  return <span className={`reference-brand${compact ? ' is-compact' : ''}`}><span className="reference-brand-lockup"><img src="/brand/geepay-wordmark.png" width={1774} height={887} alt="GeePay"/><strong>Marketplace</strong></span><small>Powered by Clickmore</small></span>;
}

export function Soon({ children = 'Coming soon' }: { children?: ReactNode }) {
  return <span className="reference-soon">{children}</span>;
}

export function ReferencePanel({ title, children, to, soon = false, className = '', action }: { title: string; children: ReactNode; to?: string; soon?: boolean; className?: string; action?: ReactNode }) {
  return <section className={`reference-panel ${className}`} aria-label={title}>
    <header className="reference-panel-head"><h2>{title}</h2><div className="reference-panel-actions">{soon && <Soon/>}{action ?? (to ? <Link to={to}>View All</Link> : null)}</div></header>
    {children}
  </section>;
}

export function PendingPanel({ text = 'This feature is being prepared.', icon = 'chart' }: { text?: string; icon?: string }) {
  return <div className="reference-pending"><ReferenceIcon name={icon} size={30}/><p>Coming soon</p><small>{text}</small></div>;
}

export function Metric({ title, value, icon, tone = 'blue', delta, soon = false, to, caption }: { title: string; value?: ReactNode; icon: string; tone?: string; delta?: string; soon?: boolean; to?: string; caption?: string }) {
  const content = <><span className={`reference-tile tone-${tone}`}><ReferenceIcon name={icon} size={24}/></span><div><span className="reference-metric-label">{title}</span>{soon ? <Soon/> : <strong className="reference-metric-value">{value ?? '—'}</strong>}{caption&&<small className="reference-metric-caption">{caption}</small>}{delta && !soon && <span className="reference-metric-delta">↑ {delta}<small>vs previous period</small></span>}</div></>;
  const className = `reference-metric tone-${tone}${soon ? ' is-unavailable' : ''}`;
  return to ? <Link to={to} className={className}>{content}</Link> : <div className={className}>{content}</div>;
}

/** Only photographic fragments are rendered from client-supplied artwork.
 * All interface content, labels, charts and controls are native HTML/SVG. */
export function ReferencePhoto({ atlas = 1, crop, alt = '', className = '' }: { atlas?: number; crop: [number, number, number, number]; alt?: string; className?: string }) {
  const dimensions = atlas === 1 ? [1024,1536] : [1536,1024];
  return <svg viewBox={crop.join(' ')} preserveAspectRatio="xMidYMid slice" className={`reference-photo ${className}`} role={alt ? 'img' : undefined} aria-label={alt || undefined} aria-hidden={alt ? undefined : true}><image href={`/images/reference/client-${atlas}.png`} width={dimensions[0]} height={dimensions[1]} /></svg>;
}

export function Photo({ src, alt = '', className = '', eager = false }: { src?: string | null; alt?: string; className?: string; eager?:boolean }) {
  const [failed, setFailed] = useState('');
  if (!src || failed === src) return <span className={`reference-photo-fallback ${className}`} role={alt ? 'img' : undefined} aria-label={alt || undefined}><ReferenceIcon name="image" size={24}/></span>;
  return <img src={src} alt={alt} width={240} height={160} className={className} loading={eager?'eager':'lazy'} fetchPriority={eager?'high':undefined} decoding="async" onError={()=>setFailed(src)}/>;
}

export function QuickAction({ label, icon, to, primary = false, soon = false }: { label: string; icon: string; to?: string; primary?: boolean; soon?: boolean }) {
  const content = <><ReferenceIcon name={icon}/><span>{label}</span>{soon&&<Soon/>}</>;
  return to ? <Link className={`reference-quick-action${primary ? ' is-primary' : ''}`} to={to}>{content}</Link> : <button type="button" className={`reference-quick-action${primary ? ' is-primary' : ''}`} disabled={soon}>{content}</button>;
}

export function FutureTool({ role, label, feature, icon, tone = 'blue' }: { role: ReferenceRole; label: string; feature: string; icon: string; tone?: string }) {
  return <Link className="reference-tool" to={featurePath(role,feature)}><span className={`reference-tile tone-${tone}`}><ReferenceIcon name={icon}/></span><span>{label}</span><Soon/></Link>;
}

export function Money({ minor }: { minor: number }) { return <>K {(minor/100).toLocaleString('en-ZM',{minimumFractionDigits:2,maximumFractionDigits:2})}</>; }
