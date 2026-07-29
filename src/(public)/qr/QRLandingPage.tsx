import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { storefrontApi } from '@/lib/api/services';
import { storeHomePath, marketplaceHomePath } from '@/lib/storeRouting';
import { clearQRSession, sessionFromResolve, setQRSession } from '@/lib/qrSession';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/common/Skeleton';

export default function QRLandingPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState<Error | null>(null);
  const [disabled, setDisabled] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setError(null);
      setDisabled(false);
      if (!token) {
        setError(new Error('Missing QR token'));
        return;
      }
      try {
        const payload = await storefrontApi.resolveQR(token);
        if (cancelled) return;
        const session = sessionFromResolve(token, payload);
        if (!session.storeId || !session.qrCodeId) {
          throw new Error('Invalid QR response');
        }
        setQRSession(session);
        const slug = session.storeSlug || session.storeId;
        const params = new URLSearchParams();
        if (session.tableNumber) params.set('table', session.tableNumber);
        if (session.menuCategoryId) params.set('category', session.menuCategoryId);
        const qs = params.toString();
        navigate(`${storeHomePath(slug)}${qs ? `?${qs}` : ''}`, { replace: true });
      } catch (err: any) {
        if (cancelled) return;
        const status = err?.status ?? err?.response?.status;
        if (status === 410) {
          clearQRSession();
          setDisabled(true);
          setError(new Error('This QR code has been disabled. Ask staff for a new one.'));
          return;
        }
        setError(err instanceof Error ? err : new Error('Could not open QR menu'));
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [token, navigate, attempt]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream p-4">
        <ErrorState
          error={error}
          title={disabled ? 'QR code disabled' : 'Unable to open menu'}
          onRetry={disabled ? undefined : () => setAttempt((n) => n + 1)}
        />
        <Link to={marketplaceHomePath()} className="text-sm font-semibold text-forest underline">
          Browse stores
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-cream p-4">
      <Skeleton className="h-8 w-48" />
      <p className="text-sm text-forest-muted">Opening menu…</p>
    </div>
  );
}
