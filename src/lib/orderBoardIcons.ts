import type { WorkflowIconName } from '../components/common/WorkflowIcon';

const laneIcons: Record<string, WorkflowIconName> = {
  incoming: 'inbox', pending_payment: 'creditCard', paid: 'creditCard',
  packaged: 'package', preparing: 'clock', ready: 'package', delivery: 'truck', out: 'truck',
  scheduled: 'calendar', active: 'tools', done: 'checkCircle', fulfilled: 'checkCircle', served: 'checkCircle', cancelled: 'closeCircle',
};

export function orderLaneIcon(key: string): WorkflowIconName {
  return laneIcons[key] ?? 'package';
}
