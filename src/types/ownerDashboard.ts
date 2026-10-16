export type DashboardPeriod = 'today' | '7d' | '30d' | 'all';
export interface DashboardMoney {
  trend: { date: string; collected: string; simulated_collected: string }[];
  currency: string;
  collected: string;
  simulated_collected: string;
  refunded: string;
  simulated_refunded: string;
  outstanding: string;
  awaiting_count: number;
  pending_count: number;
}
export interface DashboardTask {
  id: string;
  kind: 'order' | 'reservation' | 'quote' | 'custom_order' | 'job';
  title: string;
  reason: string;
  action: string;
  audience: 'owner' | 'customer';
  due_at: string | null;
  priority: number;
}
export interface OwnerDashboard {
  order_counts?: Record<string, number>;
  store_id: string;
  period: DashboardPeriod;
  updated_at: string;
  simulated: boolean;
  money: DashboardMoney[];
  money_visible: boolean;
  work_visible: boolean;
  tasks: DashboardTask[];
  task_count: number;
  owner_task_count: number;
  customer_task_count: number;
  limit: number;
  offset: number;
}
