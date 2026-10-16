import { customerNavigation } from '@/lib/customerNavigation';
import { useActivityCounts } from '@/hooks/useActivityCounts';
import type { ReferenceMenuItem } from '@/lib/referenceNavigation';
import { ReferenceShell } from '@/components/reference/ReferenceShell';

export function CustomerAccountLayout() {
  const counts = useActivityCounts('customer');
  const iconMap: Record<string,string> = { home:'home', orders:'bag', custom:'package', bookings:'calendar', quotes:'document', jobs:'briefcase', payments:'wallet' };
  const items: ReferenceMenuItem[] = customerNavigation.flatMap(group => group.items.map(item => ({
    label: item.label, to: item.to, icon: iconMap[item.icon], group: group.label ?? '',
    countKey: ['quotes','jobs','bookings','custom'].includes(item.icon) ? item.icon as ReferenceMenuItem['countKey'] : undefined,
  })));
  return <ReferenceShell role="customer" items={items} counts={counts}/>;
}
