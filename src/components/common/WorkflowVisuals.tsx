import type { ReactNode } from 'react';
import { WorkflowIcon, type WorkflowIconName } from './WorkflowIcon';

export type WorkflowArtworkKind = 'booking' | 'request' | 'order' | 'visit' | 'estimate';

/** Small, decorative workflow scenes. Labels beside them carry the meaning. */
export function WorkflowArtwork({ kind, className = '' }: { kind: WorkflowArtworkKind; className?: string }) {
  return <svg className={`workflow-artwork ${className}`} aria-hidden="true" focusable="false" width="128" height="96" viewBox="0 0 128 96" fill="none">
    <ellipse cx="65" cy="83" rx="46" ry="5" fill="currentColor" opacity=".06" />
    {kind === 'booking' ? <>
      <rect x="22" y="18" width="68" height="60" rx="9" fill="var(--surface-background)" stroke="currentColor" strokeWidth="2" />
      <path d="M22 35h68" stroke="currentColor" strokeWidth="2" /><path d="M38 12v12m36-12v12" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      {[39,56,73].map(x => <g key={x}><rect x={x-4} y="45" width="8" height="8" rx="2" fill="currentColor" opacity=".14" /><rect x={x-4} y="61" width="8" height="8" rx="2" fill="currentColor" opacity=".14" /></g>)}
      <circle cx="96" cy="66" r="19" fill="var(--info-light)" stroke="currentColor" strokeWidth="2" /><path d="M96 56v11l7 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </> : kind === 'visit' ? <>
      <path d="m17 44 29-23 29 23v33H17Z" fill="var(--surface-background)" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="M36 77V53h19v24" stroke="currentColor" strokeWidth="2" />
      <path d="M91 16c-8 0-15 7-15 15 0 13 15 24 15 24s15-11 15-24c0-8-7-15-15-15Z" fill="var(--info-light)" stroke="currentColor" strokeWidth="2" /><circle cx="91" cy="31" r="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="92" cy="72" r="16" fill="var(--surface-background)" stroke="currentColor" strokeWidth="2" /><path d="m85 72 5 5 10-11" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </> : kind === 'estimate' ? <>
      <path d="M29 12h43l14 15v54H29Z" fill="var(--surface-background)" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="M72 12v16h14M40 40h31M40 50h24M40 60h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <rect x="69" y="48" width="37" height="33" rx="7" fill="var(--info-light)" stroke="currentColor" strokeWidth="2" /><path d="M77 59h21M80 68h4m8 0h4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </> : <>
      <path d="m24 37 30-15 30 15v36L54 88 24 73Z" fill="var(--surface-background)" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="m24 37 30 15 30-15M54 52v36M39 29l30 15v13" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="m35 63 8 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      {kind === 'request' ? <><path d="m74 65 6-17 23-23 10 10-23 23Z" fill="var(--info-light)" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" /><path d="m98 30 10 10M80 48l10 10" stroke="currentColor" strokeWidth="2" /></> : <><rect x="76" y="8" width="36" height="39" rx="7" fill="var(--info-light)" stroke="currentColor" strokeWidth="2" /><path d="m85 26 6 6 12-13M84 39h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></>}
    </>}
  </svg>;
}

export function WorkflowPageHeader({ kind, title, description, eyebrow = 'Your account', children }: { kind: WorkflowArtworkKind; title: string; description: string; eyebrow?: string; children?: ReactNode }) {
  return <header className="workflow-header workflow-visual-header">
    <div className="workflow-visual-header-copy"><p className="workflow-eyebrow">{eyebrow}</p><h1>{title}</h1><p className="workflow-visual-description">{description}</p>{children}</div>
    <WorkflowArtwork kind={kind} />
  </header>;
}

export function WorkflowGlyph({ name }: { name: WorkflowIconName }) {
  return <span className="workflow-record-glyph" aria-hidden="true"><WorkflowIcon name={name} size={22} /></span>;
}

export function WorkflowMeta({ icon, children }: { icon: WorkflowIconName; children: ReactNode }) {
  return <span className="workflow-record-meta"><WorkflowIcon name={icon} size={15} /><span>{children}</span></span>;
}

export function WorkflowEmpty({ kind, title, description, children }: { kind: WorkflowArtworkKind; title: string; description: string; children?: ReactNode }) {
  return <div className="workflow-empty workflow-visual-empty"><WorkflowArtwork kind={kind} /><div><h3>{title}</h3><p>{description}</p>{children}</div></div>;
}
