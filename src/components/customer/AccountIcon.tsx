import { WorkflowIcon } from '@/components/common/WorkflowIcon';
import type { CustomerNavItem } from '@/lib/customerNavigation';

export function AccountIcon({ name }: { name: CustomerNavItem['icon'] }) {
  if (name === 'home') return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m3 10 9-7 9 7v11h-6v-7H9v7H3z" /></svg>;
  const icons = {orders: 'package', custom: 'package', bookings: 'calendar', quotes: 'document', jobs: 'briefcase', payments: 'creditCard'} as const;
  return <WorkflowIcon name={icons[name]} size={18} />;
}
