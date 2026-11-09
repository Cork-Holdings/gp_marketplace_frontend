export type Toast = { id: number; message: string; tone: 'success' | 'error'; };
let nextId = 0;
let snapshot: { pending: number; toast: Toast | null } = { pending: 0, toast: null };
const listeners = new Set<() => void>();
function update(next: typeof snapshot) { snapshot = next; listeners.forEach(listener => listener()); }
export const feedbackStore = {
  subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
  getSnapshot: () => snapshot,
};
export function showToast(message: string, tone: Toast['tone'] = 'success') {
  update({ ...snapshot, toast: { id: ++nextId, message, tone } });
}
export function dismissToast(id: number) {
  if (snapshot.toast?.id === id) update({ ...snapshot, toast: null });
}
export function beginAction() {
  update({ ...snapshot, pending: snapshot.pending + 1 });
  let ended = false;
  return () => { if (!ended) { ended = true; update({ ...snapshot, pending: Math.max(0, snapshot.pending - 1) }); } };
}
export function actionSuccessMessage(path: string, method: string): string {
  if (/\/erp\//.test(path)) {
    if (/\/payment$/.test(path)) return 'External payment evidence recorded. No transfer was initiated.';
    if (/\/receive$/.test(path)) return 'Goods received and stock updated.';
    if (/\/post$/.test(path)) return 'Document posted to the accounting ledger.';
    if (/\/reverse$/.test(path)) return 'Reversal recorded. Original history retained.';
    if (/\/read$/.test(path)) return 'Marked as read.';
    return 'Business record saved.';
  }
  if (/\/settlements\//.test(path)) return 'Settlement record updated. Check the financial status; this is not confirmation of a transfer.';
  if (/collect|payment/.test(path)) return 'Payment request updated. Check its status before trying again.';
  if (/register|onboard/.test(path)) return 'Application submitted. You can continue setting up your business while it is reviewed.';
  if (/image|upload/.test(path)) return 'File uploaded.';
  if (method === 'DELETE') return 'Item removed.';
  if (method === 'POST') return 'Your request has been submitted.';
  return 'Changes saved.';
}
