export type WorkflowIconName = 'calendar' | 'plus' | 'search' | 'settings' | 'clock' | 'check' | 'document' | 'briefcase' | 'package' | 'creditCard' | 'arrowRight' | 'pin' | 'store' | 'truck' | 'layers' | 'pencil' | 'tools' | 'refresh' | 'volume' | 'inbox' | 'checkCircle' | 'closeCircle';
type Name = WorkflowIconName;

export function WorkflowIcon({ name, size = 16, className = '' }: { name: Name; size?: number; className?: string }) {
  const paths: Record<Name, React.ReactNode> = {
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 10h18" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></>,
    settings: <><path d="M4 7h16M4 17h16M8 4v6m8 4v6" /><circle cx="8" cy="7" r="2" /><circle cx="16" cy="17" r="2" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    document: <><path d="M6 3h9l4 4v14H6zM15 3v5h4M9 12h7M9 16h7" /></>,
    briefcase: <><rect x="3" y="7" width="18" height="14" rx="2" /><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18" /></>,
    package: <><path d="m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5m-9 5v10" /></>,
    creditCard: <><rect x="2" y="5" width="20" height="14" rx="2" /><path d="M2 10h20M6 15h4" /></>,
    arrowRight: <path d="M4 12h16m-6-6 6 6-6 6" />,
    pin: <><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    store: <><path d="M3 10 5 3h14l2 7M4 10v11h16V10M9 21v-7h6v7M8 3l-1 7m9-7 1 7" /><path d="M3 10c0 4 4 4 4 0 0 4 5 4 5 0 0 4 5 4 5 0 0 4 4 4 4 0" /></>,
    truck: <><path d="M2 5h12v12H2zM14 9h4l4 5v3h-8M18 9v5h4" /><circle cx="6" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>,
    layers: <><path d="m12 2 10 5-10 5L2 7zM2 12l10 5 10-5M2 17l10 5 10-5" /></>,
    pencil: <><path d="m15 4 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14zM4 14l5 5" /></>,
    tools: <path d="M15 3a6 6 0 0 0-7 7L3 15a3.5 3.5 0 0 0 5 5l5-5a6 6 0 0 0 8-7l-4 4-4-4 4-4Z" />,
    refresh: <><path d="M20 7a8 8 0 0 0-14-2L3 8m0-5v5h5M4 17a8 8 0 0 0 14 2l3-3m0 5v-5h-5" /></>,
    volume: <><path d="m11 4-5 4H2v8h4l5 4zM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></>,
    inbox: <><path d="M3 13 6 3h12l3 10v8H3zM3 13h5l2 3h4l2-3h5" /></>,
    checkCircle: <><circle cx="12" cy="12" r="9" /><path d="m7 12 3 3 7-7" /></>,
    closeCircle: <><circle cx="12" cy="12" r="9" /><path d="m9 9 6 6m0-6-6 6" /></>,
  };
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={`workflow-icon ${className}`}>{paths[name]}</svg>;
}
