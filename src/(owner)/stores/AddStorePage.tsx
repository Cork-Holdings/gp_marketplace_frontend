import { Navigate, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/context/useAuth';
import { CreateStoreForm } from './CreateStoreForm';

export default function MerchantAddStorePage() {
  const { isStoreOwner } = useAuth();
  const navigate = useNavigate();

  if (!isStoreOwner) return <Navigate to="/portal" replace />;

  return (
    <div className="w-full space-y-8">
      <div className="relative overflow-hidden rounded-3xl bg-navy px-6 py-8 text-cream sm:px-10 sm:py-10">
        <div className="auth-brand-glow pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative z-10">
          <Link
            to="/portal/owner/stores"
            className="inline-flex items-center gap-1 text-xs font-medium text-cream/70 transition hover:text-cream"
          >
            ← Back to stores
          </Link>
          <h1 className="mt-4 font-serif text-3xl font-medium tracking-tight sm:text-4xl">
            Launch a new storefront
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-cream/75 sm:text-base">
            Add a customer-facing branch under your business. Set up the basics now — logo, hero images, and page copy
            can wait until you&apos;re in <strong className="font-semibold text-cream">Branding</strong>.
          </p>
        </div>
      </div>

      <CreateStoreForm
        onSuccess={(store) => {
          if (store?.id) {
            navigate('/portal/owner/store-settings', { replace: true });
          } else {
            navigate('/portal/owner/stores', { replace: true });
          }
        }}
      />
    </div>
  );
}
