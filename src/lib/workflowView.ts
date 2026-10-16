export const WORKFLOW_VIEWS = [
  { value: 'action_queue', label: 'Action queue', description: 'Grouped by what needs attention, ongoing work and history.' },
  { value: 'table_detail', label: 'Table and detail pane', description: 'Select a row to preview its information alongside the list.' },
  { value: 'business_ledger', label: 'Business ledger', description: 'Dates, businesses and values in a compact record.' },
  { value: 'expandable_table', label: 'Expandable table', description: 'Expand a row for a quick overview without leaving the list.' },
] as const;

export type WorkflowView = typeof WORKFLOW_VIEWS[number]['value'];
export type WorkflowGroup = 'attention' | 'ongoing' | 'history';
export const DEFAULT_WORKFLOW_VIEW: WorkflowView = 'expandable_table';
export const WORKFLOW_VIEW_EVENT = 'geepay:workflow-view-changed';
const memoryPreferences = new Map<string, WorkflowView>();
const unsavedPreferences = new Set<string>();

export function isWorkflowView(value: unknown): value is WorkflowView {
  return WORKFLOW_VIEWS.some(option => option.value === value);
}

export function workflowViewKey(userId?: string | null): string | null {
  return userId ? `geepay:workflow-view:v1:${userId}` : null;
}

/** Only a presentation preference is stored, never records or payment data. */
export function readWorkflowView(userId?: string | null, storage?: Pick<Storage, 'getItem'>): WorkflowView {
  const key = workflowViewKey(userId);
  if (!key) return DEFAULT_WORKFLOW_VIEW;
  if (unsavedPreferences.has(key)) return memoryPreferences.get(key) ?? DEFAULT_WORKFLOW_VIEW;
  try {
    const value = (storage ?? window.localStorage).getItem(key);
    return isWorkflowView(value) ? value : DEFAULT_WORKFLOW_VIEW;
  } catch {
    return memoryPreferences.get(key) ?? DEFAULT_WORKFLOW_VIEW;
  }
}

export function saveWorkflowView(userId: string | null | undefined, value: unknown, storage?: Pick<Storage, 'setItem'>): boolean {
  const key = workflowViewKey(userId);
  if (!key || !isWorkflowView(value)) return false;
  memoryPreferences.set(key, value);
  try {
    (storage ?? window.localStorage).setItem(key, value);
    unsavedPreferences.delete(key);
  } catch { unsavedPreferences.add(key); /* Keep the view usable when storage is disabled. */ }
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(WORKFLOW_VIEW_EVENT));
  return true;
}

export function workflowDate(value?: string | null, includeTime = false): string {
  if (!value) return 'Not provided';
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return 'Not provided';
  return new Intl.DateTimeFormat('en-ZM', { dateStyle: 'medium', ...(includeTime ? { timeStyle: 'short' as const } : {}) }).format(date);
}

/** Group by workflow state only. Accepted prices do not imply confirmed payment. */
export function workflowGroup(status: string, needsAttention = false): WorkflowGroup {
  if (['fulfilled', 'handed_over', 'completed', 'customer_confirmed', 'cancelled', 'canceled', 'rejected', 'expired'].includes(status)) return 'history';
  if (needsAttention || ['provider_completed', 'awaiting_customer', 'disputed'].includes(status)) return 'attention';
  return 'ongoing';
}
