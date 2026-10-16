import { useCallback, useSyncExternalStore } from 'react';
import { useAuth } from '@/lib/context/useAuth';
import { DEFAULT_WORKFLOW_VIEW, readWorkflowView, saveWorkflowView, WORKFLOW_VIEW_EVENT, workflowViewKey, type WorkflowView } from '@/lib/workflowView';

/** Shared per-account browser preference, with same-tab and cross-tab updates. */
export function useWorkflowView() {
  const { user } = useAuth();
  const userId = user?.id;
  const subscribe = useCallback((notify: () => void) => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === workflowViewKey(userId)) notify();
    };
    window.addEventListener(WORKFLOW_VIEW_EVENT, notify);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener(WORKFLOW_VIEW_EVENT, notify);
      window.removeEventListener('storage', onStorage);
    };
  }, [userId]);
  const getSnapshot = useCallback(() => readWorkflowView(userId), [userId]);
  const view = useSyncExternalStore(subscribe, getSnapshot, () => DEFAULT_WORKFLOW_VIEW);
  const setView = useCallback((value: WorkflowView) => saveWorkflowView(userId, value), [userId]);
  return { view, setView };
}
