import type { ReactNode } from 'react';
export type DiscoveryIconName = 'grid' | 'bag' | 'service' | 'pin' | 'user' | 'search' | 'filter' | 'arrow' | 'left' | 'right' | 'pause' | 'play' | 'close';
const paths: Record<DiscoveryIconName, ReactNode> = {
  grid: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  bag: <><path d="M5 7h14l2 14H3L5 7Z" /><path d="M8 9V6a4 4 0 0 1 8 0v3" /></>,
  service: <path d="m14 3-3 3 2 3 3 1 3-3a6 6 0 0 1-7 8l-6 6a2 2 0 0 1-3-3l6-6a6 6 0 0 1 5-9Z" />,
  pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  user: <><circle cx="12" cy="7" r="4" /><path d="M4 21v-3a8 8 0 0 1 16 0v3" /></>,
  search: <><circle cx="10.5" cy="10.5" r="7" /><path d="m16 16 5 5" /></>,
  filter: <path d="M3 6h18M3 12h18M3 18h18M8 3v6m8 0v6M10 15v6" />,
  arrow: <path d="M4 12h16m-6-6 6 6-6 6" />,
  left: <path d="m15 5-7 7 7 7" />, right: <path d="m9 5 7 7-7 7" />,
  pause: <path d="M8 5v14M16 5v14" />, play: <path d="m8 4 12 8-12 8V4Z" />,
  close: <path d="m5 5 14 14M19 5 5 19" />,
};
export function DiscoveryIcon({ name, size = 20 }: { name: DiscoveryIconName; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
