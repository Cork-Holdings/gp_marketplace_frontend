import { useCallback, useState, type ReactNode } from 'react';
import { ConfirmDialog, type ConfirmOptions } from '@/components/common/ConfirmDialog';

type Pending = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

export function useConfirm() {
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve });
    });
  }, []);

  const handleCancel = () => {
    pending?.resolve(false);
    setPending(null);
    setBusy(false);
  };

  const handleConfirm = () => {
    pending?.resolve(true);
    setPending(null);
    setBusy(false);
  };

  const dialog: ReactNode = (
    <ConfirmDialog
      open={Boolean(pending)}
      title={pending?.title ?? ''}
      description={pending?.description}
      confirmLabel={pending?.confirmLabel}
      cancelLabel={pending?.cancelLabel}
      tone={pending?.tone}
      requireText={pending?.requireText}
      busy={busy}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, dialog, setBusy };
}

export default useConfirm;
