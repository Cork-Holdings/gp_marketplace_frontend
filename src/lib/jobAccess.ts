type JobAccess = { canManage: boolean; canUpdate: boolean; actorId?: string; assignedTo?: string | null; status?: string };

export function jobAccess({ canManage, canUpdate, actorId, assignedTo, status }: JobAccess) {
  const assignedProvider = Boolean(actorId && assignedTo && actorId === assignedTo && canUpdate);
  return {
    manage: canManage,
    progress: canManage || assignedProvider && ['dispatched', 'arrived', 'in_progress'].includes(status ?? ''),
    recordNote: (canManage || assignedProvider && status !== 'assigned') && ['assigned', 'dispatched', 'arrived', 'in_progress'].includes(status ?? ''),
  };
}
